import React, { useState } from 'react';

function PYQTestMaker() {
  // Setup Phase
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Active Test Phase
  const [testActive, setTestActive] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // local file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("paper", file);

    try {
      // Calls instant-test route!
      const response = await fetch("http://localhost:5001/api/instant-test", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to generate test.");
      
      const data = await response.json();
      setQuestions(data);
      setTestActive(true); 
    } catch (err) {
      setError("Error extracting questions. Ensure it's a valid PDF.");
    } finally {
      setLoading(false);
    }
  };

  // ACTIVE TEST CARD
  if (testActive && questions.length > 0) {
    const currentQ = questions[currentIndex];

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '800px', backgroundColor: 'var(--bg-app)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          
          <div style={{ backgroundColor: 'var(--accent-blue)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Practice Test</h2>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <button 
              onClick={() => setTestActive(false)}
              style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Finish Test
            </button>
          </div>

          <div style={{ padding: '40px 30px', minHeight: '250px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {currentQ.subject || "General"}
              </span>
              <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {currentQ.type || "Descriptive"}
              </span>
            </div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', lineHeight: '1.6', fontWeight: '500', margin: 0 }}>
              {currentQ.question_text}
            </h3>
          </div>

          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)' }}>
            <button 
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', backgroundColor: currentIndex === 0 ? 'var(--border-color)' : 'var(--bg-hover)', color: currentIndex === 0 ? 'var(--text-secondary)' : 'var(--text-primary)' }}
            >
              ← Previous
            </button>
            <button 
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(currentIndex + 1)}
              style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer', backgroundColor: currentIndex === questions.length - 1 ? 'var(--border-color)' : 'var(--accent-blue)', color: 'white' }}
            >
              Next →
            </button>
          </div>

        </div>
      </div>
    );
  }

  //UPLOAD SCREEN
  return (
    <div className="page-content" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-primary)' }}>📝 AI Test Maker</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Upload a Past Year Paper (PYQ) or select one from Drive to instantly generate a practice test.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        <div style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '12px', textAlign: 'center', backgroundColor: 'var(--bg-hover)' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Upload from Device</h3>
          <input 
            type="file" 
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ marginBottom: '20px', width: '100%', color: 'var(--text-primary)' }}
          />
          <button 
            onClick={handleFileUpload}
            disabled={loading}
            style={{ width: '100%', padding: '12px', backgroundColor: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? "⏳ Extracting Questions..." : "🚀 Generate Test"}
          </button>
          {error && <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>}
        </div>
        
        <div style={{ border: '2px solid var(--border-color)', padding: '30px', borderRadius: '12px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Select from Google Drive</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Choose a pre-synced PYQ from your ForenSync Drive folder.
          </p>
          <button 
            onClick={() => alert("Drive selection UI coming next! Let's test the upload feature first.")}
            style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            📁 Browse Drive PYQs
          </button>
        </div>

      </div>
    </div>
  );
}

export default PYQTestMaker;