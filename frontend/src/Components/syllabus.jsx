import { useState } from 'react';
import './Syllabus.css';

function Syllabus() {
  // This tracks which unit is currently clicked open!
  const [openUnitIndex, setOpenUnitIndex] = useState(null);

  // Hardcoded data for testing the UI instantly
  const subjectData = {
    name: "Engineering Mathematics-1",
    code: "CTBT-BSC-101",
    credits: 4,
    units: [
      { 
        unitNumber: "I", title: "Differential Calculus", hours: 15,
        topics: [
          "Successive differentiation",
          "Leibniz's theorem (without proof)",
          "Taylor's & McLaurin's series for a function of one variable",
          "Evaluation of indeterminate forms by L'Hospital's rule",
          "Infinite Series: Convergence by definition, Zero Test, Comparison Test, Ratio Test, Alternating Series."
        ] 
      },
      { 
        unitNumber: "II", title: "Partial Differentiation", hours: 10,
        topics: [
          "Functions of two variables",
          "Limit and Continuity of function of several variables",
          "Partial derivative, Total derivative, Chain rule",
          "Jacobian, error and approximation, maxima and minima"
        ] 
      },
      { 
        unitNumber: "III", title: "Integral Calculus", hours: 10,
        topics: [
          "Reduction formula for sin^n x, cos^n x, tan^n x",
          "Beta and Gamma functions and their properties (without proof)",
          "Evaluation of improper integrals of type-I and type-II"
        ] 
      }
    ]
  };

  // This function toggles the accordion open/closed
  const toggleUnit = (index) => {
    // If clicking the one that's already open, close it. Otherwise, open the new one.
    if (openUnitIndex === index) {
      setOpenUnitIndex(null);
    } else {
      setOpenUnitIndex(index);
    }
  };

  return (
    <div className="syllabus-page">
      {/* Top Header Banner */}
      <div className="syllabus-header">
        <h1>{subjectData.name} ({subjectData.code})</h1>
        <span className="credits-badge">{subjectData.credits} Credits</span>
      </div>

      {/* The List of Units */}
      <div className="units-container">
        {subjectData.units.map((unit, index) => (
          <div key={index} className="unit-card">
            
            {/* The clickable bar */}
            <div className="unit-header" onClick={() => toggleUnit(index)}>
              <div className="unit-title-group">
                <span className="unit-number">Unit {unit.unitNumber}</span>
                <span className="unit-name">{unit.title}</span>
              </div>
              
              <div className="unit-meta">
                <span className="hours-badge">{unit.hours} Hours</span>
                <span className={`dropdown-icon ${openUnitIndex === index ? 'open' : ''}`}>
                  ▼
                </span>
              </div>
            </div>

            {/* The dropdown content (Only shows if openUnitIndex matches this index) */}
            {openUnitIndex === index && (
              <div className="unit-content">
                <ul>
                  {unit.topics.map((topic, tIndex) => (
                    <li key={tIndex}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
            
          </div>
        ))}
      </div>
    </div>
  );
}

export default Syllabus;