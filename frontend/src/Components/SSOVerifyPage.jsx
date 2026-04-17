import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; 
import { auth, db } from '../firebase'; 
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function SSOVerifyPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Verifying your Grievance account...");
    const [authStage, setAuthStage] = useState('loading'); // 'loading', 'success', 'error'

    useEffect(() => {
        const verifyCode = async () => {
            const code = searchParams.get('code');

            if (!code) {
                setStatus("Error: No SSO code found in URL.");
                setAuthStage('error');
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

                setStatus("Verification successful!");
                setAuthStage('success');

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
                setStatus(`SSO Failed: ${error.message}`);
                setAuthStage('error');
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
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                padding: '40px', // Clean, generous padding (p-10)
                borderRadius: '16px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                textAlign: 'center',
                maxWidth: '420px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {/* Dynamically Rendered Lucide Icons */}
                <div style={{ marginBottom: '24px' }}>
                    {authStage === 'loading' && (
                        <Loader2 
                            size={48} 
                            color="#3b5998" 
                            style={{ animation: 'spin 1s linear infinite' }} 
                        />
                    )}
                    {authStage === 'success' && (
                        <CheckCircle2 size={48} color="#22c55e" />
                    )}
                    {authStage === 'error' && (
                        <XCircle size={48} color="#ef4444" />
                    )}
                </div>
                
                <h2 style={{ 
                    color: '#1f2937', 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    marginBottom: '12px',
                    lineHeight: '1.2'
                }}>
                    {status}
                </h2>
                
                <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {authStage === 'error' 
                        ? "You can safely close this window or try logging in manually." 
                        : "Logging you in. Please do not close this window."}
                </p>

                {/* Inline CSS for the spinner animation fallback */}
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}
