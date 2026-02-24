import React, { useState } from 'react';

function PYQTestMaker() {
  // States for the Setup Phase
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // States for the Active Test Phase
  const [testActive, setTestActive] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Handle local file upload
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
      // Calls your teammate's instant-test route!
      const response = await fetch("http://localhost:5001/api/instant-test", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to generate test.");
      
      const data = await response.json();
      setQuestions(data);
      setTestActive(true); // Switch to the Test Card UI!
    } catch (err) {
      setError("Error extracting questions. Ensure it's a valid PDF.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // UI: THE ACTIVE TEST CARD (Matches your screenshot)
  // -----------------------------------------------------
  if (testActive && questions.length > 0) {
    const currentQ = questions[currentIndex];

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '800px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          
          {/* Header */}
          <div style={{ backgroundColor: '#2563eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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

          {/* Body */}
          <div style={{ padding: '40px 30px', minHeight: '250px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {currentQ.subject || "General"}
              </span>
              <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {currentQ.type || "Descriptive"}
              </span>
            </div>
            <h3 style={{ fontSize: '1.5rem', color: '#1e293b', lineHeight: '1.6', fontWeight: '500', margin: 0 }}>
              {currentQ.question_text}
            </h3>
          </div>

          {/* Footer */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0' }}>
            <button 
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', backgroundColor: currentIndex === 0 ? '#cbd5e1' : '#e2e8f0', color: currentIndex === 0 ? '#94a3b8' : '#475569' }}
            >
              ← Previous
            </button>
            <button 
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(currentIndex + 1)}
              style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer', backgroundColor: currentIndex === questions.length - 1 ? '#93c5fd' : '#2563eb', color: 'white' }}
            >
              Next →
            </button>
          </div>

        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // UI: THE SETUP / UPLOAD SCREEN
  // -----------------------------------------------------
  return (
    <div className="page-content" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: '#1e293b' }}>📝 AI Test Maker</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Upload a Past Year Paper (PYQ) or select one from Drive to instantly generate a practice test.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Option 1: Upload Local File */}
        <div style={{ border: '2px dashed #cbd5e1', padding: '30px', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <h3 style={{ marginBottom: '15px', color: '#334155' }}>Upload from Device</h3>
          <input 
            type="file" 
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ marginBottom: '20px', width: '100%' }}
          />
          <button 
            onClick={handleFileUpload}
            disabled={loading}
            style={{ width: '100%', padding: '12px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? "⏳ Extracting Questions..." : "🚀 Generate Test"}
          </button>
          {error && <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>}
        </div>

        {/* Option 2: Select from Drive */}
        <div style={{ border: '2px solid #e2e8f0', padding: '30px', borderRadius: '12px', textAlign: 'center', backgroundColor: 'white' }}>
          <h3 style={{ marginBottom: '15px', color: '#334155' }}>Select from Google Drive</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
            Choose a pre-synced PYQ from your ForenSync Drive folder.
          </p>
          <button 
            onClick={() => alert("Drive selection UI coming next! Let's test the upload feature first.")}
            style={{ width: '100%', padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            📁 Browse Drive PYQs
          </button>
        </div>

      </div>
    </div>
  );
}

export default PYQTestMaker;