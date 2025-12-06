import { useState } from 'react';
import { callBackend } from './api';
import './App.css';

function App() {
  const [userId, setUserId] = useState(1);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetFriends = async () => {
    setLoading(true);
    setError("");
    setFriends([]);

    // 1. Call the Node Bridge -> C++ Backend
    const data = await callBackend("get_friends", [userId]);

    if (data && !data.error) {
      setFriends(data);
    } else {
      setError("Could not load friends. Check console.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>NovaCom Debugger</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <label>Enter User ID: </label>
        <input 
          type="number" 
          value={userId} 
          onChange={(e) => setUserId(e.target.value)}
          style={{ padding: "5px", marginRight: "10px" }}
        />
        <button onClick={handleGetFriends} disabled={loading}>
          {loading ? "Loading..." : "Get Friends"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Friend List Results:</h3>
      {friends.length === 0 ? <p>No friends found (or not loaded yet).</p> : (
        <ul>
          {friends.map((f) => (
            <li key={f.id}>
              <strong>{f.name}</strong> (ID: {f.id})
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "50px", borderTop: "1px solid #ccc", paddingTop: "10px" }}>
        <small>Connected to C++ Backend via Node.js Bridge</small>
      </div>
    </div>
  );
}

export default App;