import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/loginPage";
import ProfilePage from "./pages/profilePage";
import CanvasPage from "./pages/canvasPage";
import ProtectedRoute from "./components/ProtectedRoute";

// import { io } from 'socket.io-client';

function App() {
  
  return (
    
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/canvas/:canvasId"
          element={
            <ProtectedRoute>
              <CanvasPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// Connect to the WebSocket server

