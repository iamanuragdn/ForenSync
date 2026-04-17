import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; 
import { auth } from '../firebase'; 
import { signInWithCustomToken } from 'firebase/auth';

export default function SSOVerifyPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Verifying your Grievance account...");

    useEffect(() => {
        const verifyCode = async () => {
            const code = searchParams.get('code');

            if (!code) {
                setStatus("❌ Error: No SSO code found in URL.");
                return;
            }

            try {
                // 1. Send the code to ForenSync Node.js backend
                const API_URL = import.meta.env.VITE_API_URL 
                    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
                    : 'https://forensync-backend.onrender.com';
                    
                const response = await fetch(`${API_URL}/api/auth/grievance`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Verification failed");
                }

                setStatus("✅ Verification successful! Logging you in...");

                // 2. Use the Custom Token to sign into Firebase
                await signInWithCustomToken(auth, data.token);

                // 3. Redirect to the ForenSync dashboard
                navigate('/dashboard'); 

            } catch (error) {
                console.error("SSO Login Error:", error);
                setStatus(`❌ SSO Failed: ${error.message}. Please try logging in manually.`);
            }
        };

        verifyCode();
    }, [searchParams, navigate]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            backgroundColor: 'var(--bg-app, #0f0f0f)', 
            color: 'var(--text-primary, white)', 
            flexDirection: 'column' 
        }}>
            <div className="spinner" style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255, 255, 255, 0.1)',
                borderLeftColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
            }}></div>
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
            <h2 style={{ marginTop: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>{status}</h2>
            <p style={{ color: 'var(--text-secondary, #888)', marginTop: '10px' }}>Please don't close this window.</p>
        </div>
    );
}
