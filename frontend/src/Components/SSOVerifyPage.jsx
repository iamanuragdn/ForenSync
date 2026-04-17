import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; 
import { auth, db } from '../firebase'; 
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 

export default function SSOVerifyPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Verifying your Grievance account...");
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const verifyCode = async () => {
            const code = searchParams.get('code');

            if (!code) {
                setStatus("Error: No SSO code found in URL.");
                setIsError(true);
                return;
            }

            try {
                // 1. Send the code to your ForenSync backend
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

                setStatus("Verification successful! Logging you in...");

                // 1. Sign into Firebase
                await signInWithCustomToken(auth, data.token);

                // 2. THE BULLETPROOF FIX: Wait for Firebase to globally confirm the login
                let validUser = null;
                await new Promise((resolve) => {
                    const unsubscribe = onAuthStateChanged(auth, (user) => {
                        if (user) {
                            validUser = user;
                            unsubscribe(); // Stop listening once we confirm
                            resolve();     // Allow the code to continue
                        }
                    });
                });

                // 3. VITE/REACT ROUTER FIX: ProtectedLayout reads from localStorage synchronously. 
                // We MUST populate forensync_user manually here just like Login.jsx does.
                try {
                    const userRef = doc(db, 'users', validUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const safeUser = { ...userSnap.data() };
                        delete safeUser.role;
                        delete safeUser.isVerifiedAdmin;
                        delete safeUser.adminType;
                        localStorage.setItem("forensync_user", JSON.stringify(safeUser));
                    }
                } catch (err) {
                    console.error("SSO verification local-storage failure: ", err);
                }

                // 4. NOW it is 100% safe to redirect. The dashboard will see the user.
                navigate('/dashboard'); 

            } catch (error) {
                console.error("SSO Login Error:", error);
                setStatus(`SSO Failed: ${error.message}. Please try logging in manually.`);
                setIsError(true);
            }
        };

        verifyCode();
    }, [searchParams, navigate]);

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#1a1a2e', 
            backgroundImage: 'radial-gradient(circle at 50% 50%, #2a2a4a 0%, #1a1a2e 100%)',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px 30px',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '90%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {/* Spinner or Error Icon */}
                {!isError ? (
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3b5998',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '20px'
                    }} />
                ) : (
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>❌</div>
                )}
                
                <h2 style={{ 
                    color: '#333', 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    marginBottom: '10px' 
                }}>
                    {status}
                </h2>
                
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    {isError ? "You can safely close this window." : "Please do not close this window."}
                </p>

                {/* Inline CSS for the spinner animation */}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}
