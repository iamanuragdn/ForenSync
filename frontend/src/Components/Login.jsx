import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Ask the backend to verify the username
      const res = await fetch(`http://localhost:5001/api/users/${username}`);
      const userData = await res.json();

      if (userData.error) {
        setError("User not found. Try 'anurag' or 'anindya'.");
      } else {
        // Success! Save user data to browser's local storage
        localStorage.setItem("forensync_user", JSON.stringify(userData));
        
        // Redirect to the home dashboard
        navigate("/");
        // Quick reload to ensure the sidebar/nav catch the new user
        window.location.reload(); 
      }
    } catch (err) {
      setError("Failed to connect to server.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f7f6', width: '100%' }}>
      <div style={{ background: 'white', width: '400px', textAlign: 'center', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginBottom: '10px', color: '#1f2937' }}>Welcome to ForenSync</h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>Enter your team username to continue.</p>
        
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Username (e.g., anurag)" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '16px', boxSizing: 'border-box' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>}
          <button 
            type="submit" 
            style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;