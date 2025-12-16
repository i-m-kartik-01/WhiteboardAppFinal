import { useEffect, useLayoutEffect, useRef, useContext } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import toolboxContext from "../../store/toolbox-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import { buildRenderElement } from "../../utils/element";
import classes from "./index.module.css";

function Board() {
  const canvasRef = useRef();
  const textAreaRef = useRef();

  const {
    elements,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    toolActionType,
    textAreaBlurHandler,
    undo,
    redo,
    saveCanvas,
  } = useContext(boardContext);

  const { toolboxState } = useContext(toolboxContext);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z") undo();
      if (e.ctrlKey && e.key === "y") redo();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);

    
  }, [undo, redo]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const roughCanvas = rough.canvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((rawEl) => {
      const el = buildRenderElement(rawEl);

      switch (el.type) {
        case TOOL_ITEMS.BRUSH:
          ctx.fillStyle = el.stroke;
          ctx.fill(el.path);
          break;

        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          roughCanvas.draw(el.roughEle);
          break;

        case TOOL_ITEMS.TEXT:
          ctx.font = `${el.size}px Caveat`;
          ctx.fillStyle = el.stroke;
          ctx.fillText(el.text, el.x1, el.y1);
          break;

        default:
          break;
      }
    });
  }, [elements]);

  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && (
        <textarea
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: elements.at(-1)?.y1,
            left: elements.at(-1)?.x1,
          }}
          onBlur={(e) => textAreaBlurHandler(e.target.value)}
        />
      )}

      <canvas
        id="canvas"
        ref={canvasRef}
        onMouseDown={(e) => boardMouseDownHandler(e, toolboxState)}
        onMouseMove={(e) => {
          if (
            toolActionType === TOOL_ACTION_TYPES.DRAWING ||
            toolActionType === TOOL_ACTION_TYPES.ERASING
          ) {
            boardMouseMoveHandler(e);
          }
        }}

        onMouseUp={ () =>{
          console.log("Mouse Up Event");
          boardMouseUpHandler();
          saveCanvas(); 
        }
          
        }
      />
    </>
  );
}

export default Board;
