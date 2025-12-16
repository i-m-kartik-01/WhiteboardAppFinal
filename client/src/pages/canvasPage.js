import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import Board from "../components/board";
import Toolbar from "../components/Toolbar";
import Toolbox from "../components/Toolbox";
import BoardProvider from "../store/BoardProvider";
import ToolboxProvider from "../store/ToolboxProvider";

function CanvasPage() {
  const { canvasId } = useParams();
  const [canvas, setCanvas] = useState(null);
  
  useEffect(() => {
    api.get(`/canvas/openCanvas/${canvasId}`)
      .then(res => setCanvas(res.data));
  }, [canvasId]);

  
  
  if (!canvas) return <p>Loading canvas...</p>;

  return (
    <BoardProvider canvasId={canvasId} initialElements={canvas.elements}>
      <ToolboxProvider>
        <Toolbox />
        <Toolbar />
        <Board />
      </ToolboxProvider>
    </BoardProvider>
  );
}

export default CanvasPage;

