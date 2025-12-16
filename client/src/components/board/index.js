import {
  useEffect,
  useLayoutEffect,
  useRef,
  useContext,
  useState,
} from "react";
import rough from "roughjs";
import throttle from "lodash.throttle";

import boardContext from "../../store/board-context";
import toolboxContext from "../../store/toolbox-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import { buildRenderElement } from "../../utils/element";
import classes from "./index.module.css";
import socket from "../../utils/socket";

function Board({ canvasId }) {
  const canvasRef = useRef();
  const textAreaRef = useRef();

  const {
    elements,
    setElements, // ✅ authoritative replace
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    toolActionType,
    textAreaBlurHandler,
    undo,
    redo,
  } = useContext(boardContext);

  const { toolboxState } = useContext(toolboxContext);

  /* =========================
     LIVE PREVIEW STATE
     ========================= */
  const [remoteElements, setRemoteElements] = useState({});

  /* =========================
     THROTTLED EMITTER
     ========================= */
  const emitDrawingProgress = useRef(
    throttle((payload) => {
      socket.emit("drawing-progress", payload);
    }, 16)
  ).current;

  /* =========================
     JOIN CANVAS (ONCE)
     ========================= */
  useEffect(() => {
    socket.emit("join-canvas", { canvasId });
  }, [canvasId]);

  /* =========================
     SOCKET LISTENERS
     ========================= */
  useEffect(() => {
    // 🔹 Authoritative canvas sync
    socket.on("canvas-sync", ({ elements }) => {
      setElements(elements);
    });

    // 🔹 Live preview strokes
    socket.on("drawing-progress", ({ userId, element }) => {
      if (!userId || !element?.type) return;

      setRemoteElements((prev) => ({
        ...prev,
        [userId]: element,
      }));
    });

    return () => {
      socket.off("canvas-sync");
      socket.off("drawing-progress");
    };
  }, [setElements]);

  /* =========================
     CANVAS SETUP
     ========================= */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  /* =========================
     UNDO / REDO
     ========================= */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z") undo();
      if (e.ctrlKey && e.key === "y") redo();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  /* =========================
     DRAW CANVAS
     ========================= */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const roughCanvas = rough.canvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1️⃣ committed elements (from server)
    elements.forEach((el) => {
      if (!el?.type) return;
      drawElement(ctx, roughCanvas, buildRenderElement(el));
    });

    // 2️⃣ live previews
    Object.values(remoteElements).forEach((el) => {
      if (!el?.type) return;
      drawElement(ctx, roughCanvas, buildRenderElement(el));
    });
  }, [elements, remoteElements]);

  /* =========================
     TEXT TOOL
     ========================= */
  useEffect(() => {
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      setTimeout(() => textAreaRef.current?.focus(), 0);
    }
  }, [toolActionType]);

  /* =========================
     MOUSE HANDLERS
     ========================= */
  const handleMouseMove = (e) => {
    if (
      toolActionType === TOOL_ACTION_TYPES.DRAWING ||
      toolActionType === TOOL_ACTION_TYPES.ERASING
    ) {
      boardMouseMoveHandler(e);

      const activeElement = elements.at(-1);
      if (!activeElement?.type) return;

      emitDrawingProgress({
        canvasId,
        element: structuredClone(activeElement),
      });
    }
  };

  const handleMouseUp = () => {
    boardMouseUpHandler();
    emitDrawingProgress.flush();

    const finalElement = elements.at(-1);
    if (!finalElement?.type) return;

    socket.emit("drawing-commit", {
      canvasId,
      element: structuredClone(finalElement),
    });
  };

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
        ref={canvasRef}
        id="canvas"
        onMouseDown={(e) => boardMouseDownHandler(e, toolboxState)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </>
  );
}

/* =========================
   DRAW HELPER
   ========================= */
function drawElement(ctx, roughCanvas, el) {
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
}

export default Board;
