import React, { useReducer, useState } from "react";
import boardContext from "./board-context";
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import { createRoughElement, isPointNearElement } from "../utils/element";
import api from "../api/axios";
import { useEffect } from "react";

const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL:
      return { ...state, activeToolItem: action.payload.tool };

    case BOARD_ACTIONS.DRAW_DOWN: {
      if (state.activeToolItem === TOOL_ITEMS.ERASER) return state;

      const el = createRoughElement(
        state.elements.length,
        action.payload.clientX,
        action.payload.clientY,
        action.payload.clientX,
        action.payload.clientY,
        {
          type: state.activeToolItem,
          stroke: action.payload.stroke,
          fill: action.payload.fill,
          size: action.payload.size,
        }
      );

      return {
        ...state,
        toolActionType:
          state.activeToolItem === TOOL_ITEMS.TEXT
            ? TOOL_ACTION_TYPES.WRITING
            : TOOL_ACTION_TYPES.DRAWING,
        elements: [...state.elements, el],
      };
    }

    case BOARD_ACTIONS.DRAW_MOVE: {
      const elements = [...state.elements];
      const el = elements.at(-1);
      if (!el) return state;

      if (el.type === TOOL_ITEMS.BRUSH) {
        el.points.push([action.payload.clientX, action.payload.clientY]);
      } else {
        el.x2 = action.payload.clientX;
        el.y2 = action.payload.clientY;
      }

      return { ...state, elements };
    }

    case BOARD_ACTIONS.DRAW_UP: {
  if (
    state.toolActionType !== TOOL_ACTION_TYPES.DRAWING &&
    state.toolActionType !== TOOL_ACTION_TYPES.ERASING
  ) {
    return state;
  }

  const history = state.history.slice(0, state.index + 1);
  history.push([...state.elements]);

  return {
    ...state,
    history,
    index: state.index + 1,
    toolActionType: TOOL_ACTION_TYPES.NONE
  };
}



    case BOARD_ACTIONS.ERASE: {
      const filtered = state.elements.filter(
        (el) =>
          !isPointNearElement(
            el,
            action.payload.clientX,
            action.payload.clientY
          )
      );
      return { ...state, elements: filtered };
    }

    case BOARD_ACTIONS.UNDO:
      return state.index > 0
        ? {
            ...state,
            elements: state.history[state.index - 1],
            index: state.index - 1,
          }
        : state;

    case BOARD_ACTIONS.REDO:
      return state.index < state.history.length - 1
        ? {
            ...state,
            elements: state.history[state.index + 1],
            index: state.index + 1,
          }
        : state;

    default:
      return state;
  }
};

const BoardProvider = ({ children, initialElements = [], canvasId }) => {
  const [state, dispatch] = useReducer(boardReducer, {
    activeToolItem: TOOL_ITEMS.BRUSH,
    toolActionType: TOOL_ACTION_TYPES.NONE,
    elements: initialElements,
    history: [initialElements],
    index: 0,
  });

 
  const saveCanvas = async () => {
    await api.put("/canvas/updateCanvas", {
      canvasId,
      elements: state.elements,
    });
    console.log("saved succesfully");
  };

  return (
    <boardContext.Provider
      value={{
        ...state,
        saveCanvas,
        changeToolHandler: (tool) =>
          dispatch({ type: BOARD_ACTIONS.CHANGE_TOOL, payload: { tool } }),
        boardMouseDownHandler: (e, toolbox) =>
          dispatch({
            type: BOARD_ACTIONS.DRAW_DOWN,
            payload: {
              clientX: e.clientX,
              clientY: e.clientY,
              stroke: toolbox[state.activeToolItem]?.stroke,
              fill: toolbox[state.activeToolItem]?.fill,
              size: toolbox[state.activeToolItem]?.size,
            },
          }),
        boardMouseMoveHandler: (e) =>
          dispatch({
            type: BOARD_ACTIONS.DRAW_MOVE,
            payload: { clientX: e.clientX, clientY: e.clientY },
          }),
        boardMouseUpHandler: () =>{
            console.log("DISPATCH DRAW_UP");
            dispatch({ type: BOARD_ACTIONS.DRAW_UP });
        },
          
        undo: () => dispatch({ type: BOARD_ACTIONS.UNDO }),
        redo: () => dispatch({ type: BOARD_ACTIONS.REDO }),
      }}
    >
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;
