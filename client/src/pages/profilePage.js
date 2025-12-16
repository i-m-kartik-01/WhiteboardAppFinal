import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function ProfilePage() {
  const [canvases, setCanvases] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [shareEmails, setShareEmails] = useState({}); // canvasId -> email
  const navigate = useNavigate();

  /* ================= FETCH CANVASES ================= */

  useEffect(() => {
    fetchCanvases();
  }, []);

  const fetchCanvases = async () => {
    try {
      const res = await api.get("/canvas");
      setCanvases(res.data);
    } catch (err) {
      alert("Failed to load canvases");
    }
  };

  /* ================= CREATE CANVAS ================= */

  const createCanvas = async () => {
    if (!newTitle.trim()) {
      alert("Please enter a canvas title");
      return;
    }

    try {
      const res = await api.post("/canvas/createCanvas", {
        title: newTitle,
      });

      navigate(`/canvas/${res.data._id}`);
    } catch (err) {
      alert("Failed to create canvas");
    }
  };

  /* ================= SHARE CANVAS ================= */

  const shareCanvas = async (canvasId, email) => {
    if (!email || !email.trim()) {
      alert("Email required");
      return;
    }

    try {
      await api.put("/canvas/shareCanvas", {
        canvasId,
        email,
      });

      alert("Canvas shared successfully");

      // Clear input after success
      setShareEmails((prev) => ({
        ...prev,
        [canvasId]: "",
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Share failed");
    }
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Your Canvases</h2>

      {/* CREATE CANVAS */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Canvas title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button onClick={createCanvas}>Create Canvas</button>
      </div>

      {/* CANVAS LIST */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {canvases.map((c) => (
          <li
            key={c._id}
            style={{
              border: "1px solid #ccc",
              padding: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <strong>{c.title}</strong>

            <div style={{ marginTop: "0.5rem" }}>
              <button onClick={() => navigate(`/canvas/${c._id}`)}>
                Open
              </button>
            </div>

            {/* SHARE SECTION */}
            <div style={{ marginTop: "0.5rem" }}>
              <input
                type="email"
                placeholder="Share with email"
                value={shareEmails[c._id] || ""}
                onChange={(e) =>
                  setShareEmails((prev) => ({
                    ...prev,
                    [c._id]: e.target.value,
                  }))
                }
              />
              <button onClick={() => shareCanvas(c._id, shareEmails[c._id])}>
                Share
              </button>

            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProfilePage;
