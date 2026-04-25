import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import './VerifyEmail.css';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('No verification token found in the URL.');
            return;
        }

        const verifyWithBackend = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const baseUrl = API_URL.replace(/\/api\/?$/, '');

                const response = await fetch(`${baseUrl}/api/auth/verify-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setErrorMessage(data.error || 'Verification failed. The link may be expired.');
                }
            } catch (error) {
                console.error("Verification error:", error);
                setStatus('error');
                setErrorMessage('Network error occurred while verifying your email.');
            }
        };

        verifyWithBackend();
    }, [token]);

    return (
        <div className="verify-email-wrapper">
            <div className="verify-email-card">
                <div className="verify-icon-container">
                    {status === 'loading' && <Loader2 className="verify-icon spinning" color="#3b82f6" />}
                    {status === 'success' && <CheckCircle2 className="verify-icon success" color="#10b981" />}
                    {status === 'error' && <XCircle className="verify-icon error" color="#ef4444" />}
                </div>
                
                <h2 className="verify-title">
                    {status === 'loading' && 'Verifying Email...'}
                    {status === 'success' && 'Email Verified!'}
                    {status === 'error' && 'Verification Failed'}
                </h2>
                
                <p className="verify-message">
                    {status === 'loading' && 'Please wait while we verify your account securely.'}
                    {status === 'success' && 'Your email has been successfully verified. You can now access your ForenSync account.'}
                    {status === 'error' && errorMessage}
                </p>

                {(status === 'success' || status === 'error') && (
                    <button onClick={() => navigate('/login')} className="verify-action-button">
                        Return to Login <ArrowRight size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}
