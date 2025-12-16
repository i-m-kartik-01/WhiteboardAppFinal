import rough from "roughjs";
import getStroke from "perfect-freehand";
import { ARROW_LENGTH, TOOL_ITEMS } from "../constants";
import { getArrowHeadCoordinates, isPointCloseToLine } from "./math";

const generator = rough.generator();

/* =========================
   CREATE RAW ELEMENT (STATE)
   ========================= */
export const createRoughElement = (
  id,
  x1,
  y1,
  x2,
  y2,
  options,
  userId
) => {
  const { type, stroke, fill, size } = options;

  switch (type) {
    case TOOL_ITEMS.BRUSH:
      return {
        id,
        type,
        points: [[x1, y1]],
        stroke,
        size,
        userId,
      };

    case TOOL_ITEMS.TEXT:
      return {
        id,
        type,
        x1,
        y1,
        text: "",
        stroke,
        size,
        userId,
      };

    default:
      return {
        id,
        type,
        x1,
        y1,
        x2,
        y2,
        stroke,
        fill,
        size,
        userId,
      };
  }
};

/* =========================
   BUILD RENDER ELEMENT
   ========================= */
export const buildRenderElement = (el) => {
  switch (el.type) {
    case TOOL_ITEMS.BRUSH: {
      const stroke = getStroke(el.points, {
        size: el.size || 2,
      });

      return {
        ...el,
        path: new Path2D(getSvgPathFromStroke(stroke)),
      };
    }

    case TOOL_ITEMS.LINE:
      return {
        ...el,
        roughEle: generator.line(el.x1, el.y1, el.x2, el.y2),
      };

    case TOOL_ITEMS.RECTANGLE:
      return {
        ...el,
        roughEle: generator.rectangle(
          el.x1,
          el.y1,
          el.x2 - el.x1,
          el.y2 - el.y1
        ),
      };

    case TOOL_ITEMS.CIRCLE:
      return {
        ...el,
        roughEle: generator.ellipse(
          (el.x1 + el.x2) / 2,
          (el.y1 + el.y2) / 2,
          el.x2 - el.x1,
          el.y2 - el.y1
        ),
      };

    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadCoordinates(
        el.x1,
        el.y1,
        el.x2,
        el.y2,
        ARROW_LENGTH
      );

      return {
        ...el,
        roughEle: generator.linearPath([
          [el.x1, el.y1],
          [el.x2, el.y2],
          [x3, y3],
          [el.x2, el.y2],
          [x4, y4],
        ]),
      };
    }

    default:
      return el;
  }
};

/* =========================
   SVG PATH HELPER
   ========================= */
export const getSvgPathFromStroke = (stroke) => {
  if (!Array.isArray(stroke) || !stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[i + 1] || arr[i];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};

/* =========================
   HIT TESTING
   ========================= */
export const isPointNearElement = (element, x, y) => {
  switch (element.type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.ARROW:
      return isPointCloseToLine(
        element.x1,
        element.y1,
        element.x2,
        element.y2,
        x,
        y
      );

    case TOOL_ITEMS.BRUSH: {
      const canvas = document.getElementById("canvas");
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      return element.path && ctx.isPointInPath(element.path, x, y);
    }

    default:
      return false;
  }
};
