/**
 * ============================================================================
 * EXAM DATA TEMPLATE
 * ============================================================================
 * Use the following structure to add new exams safely. 
 * Every object MUST include `code` and `type` to generate a unique database ID.
 * * {
 * code: 'CTBT-XXX-000',       // (REQUIRED) Exact subject code.
 * name: 'Subject Name',       // (REQUIRED) Full name of the subject.
 * examDate: 'YYYY-MM-DD',     // (REQUIRED) Date of the exam (e.g., '2026-03-16').
 * type: 'CA2 (Mid-Sem)',      // (REQUIRED) Determines unique ID and categorization (e.g., 'CA2 (Mid-Sem)', 'CA4 (End Semester)').
 * fullMarks: 50,              // (REQUIRED) Maximum marks (50 for Mid-Sem, 100 for End-Sem).
 * time: '10:00 AM - 12:00 PM',// (REQUIRED) Time slot for the exam.
 * colorClass: 'exam-blue',    // (Optional) Frontend color token for the card (e.g., exam-blue, exam-green, exam-yellow, exam-red).
 * dotColor: '#3b82f6',        // (Optional) Hex color for calendar dots.
 * syllabus: ['Unit 1', 'Unit 2'] // (Optional) Specific syllabus if applicable.
 * }
 * ============================================================================
 */

const examData = {
  "btech-mtech-cybersecurity": {
    "sem-2": [
      // ----------------- MID SEMESTERS -----------------
      {
        code: 'CTBT-BSC-201',
        name: 'Mathematics-II',
        examDate: '2026-03-16',
        type: 'CA2 (Mid-Sem)',
        fullMarks: 50,
        time: '10:00 AM - 12:00 PM',
        colorClass: 'exam-blue',
        dotColor: '#3b82f6'
      },
      {
        code: 'CTBT-EMC-201',
        name: 'Fundamentals of Forensic Science',
        examDate: '2026-03-17',
        type: 'CA2 (Mid-Sem)',
        fullMarks: 50,
        time: '10:00 AM - 12:00 PM',
        colorClass: 'exam-green',
        dotColor: '#22c55e'
      },
      {
        code: 'CTBT-ESC-201',
        name: 'Digital Logic Design',
        examDate: '2026-03-18',
        type: 'CA2 (Mid-Sem)',
        fullMarks: 50,
        time: '10:00 AM - 12:00 PM',
        colorClass: 'exam-yellow',
        dotColor: '#eab308'
      },
      {
        code: 'CTBT-PCC-201',
        name: 'Object Oriented Programming with C++',
        examDate: '2026-03-19',
        type: 'CA2 (Mid-Sem)',
        fullMarks: 50,
        time: '10:00 AM - 12:00 PM',
        colorClass: 'exam-red',
        dotColor: '#ef4444'
      },
      {
        code: 'CTBT-HSM-201',
        name: 'Professional Ethics',
        examDate: '2026-03-20',
        type: 'CA2 (Mid-Sem)',
        fullMarks: 50,
        time: '10:00 AM - 12:00 PM',
        colorClass: 'exam-blue',
        dotColor: '#3b82f6'
      },
      {
        code: 'CTBT-EMC-202',
        name: 'Environment Science',
        examDate: '2026-03-23',
        type: 'CA2 (Mid-Sem)',
        fullMarks: 50,
        time: '10:00 AM - 12:00 PM',
        colorClass: 'exam-green',
        dotColor: '#22c55e'
      },

      // ----------------- END SEMESTERS -----------------
      {
        code: 'CTBT-BSC-201',
        name: 'Mathematics-II',
        examDate: '2026-04-24', // Starting day
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM', // 3 hours for End Sem
        colorClass: 'exam-red',
        dotColor: '#ef4444'
      },
      {
        code: 'CTBT-EMC-201',
        name: 'Fundamentals of Forensic Science',
        examDate: '2026-04-27', 
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM',
        colorClass: 'exam-blue',
        dotColor: '#3b82f6'
      },
      {
        code: 'CTBT-ESC-201',
        name: 'Digital Logic Design',
        examDate: '2026-04-28', // 1 day gap
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM',
        colorClass: 'exam-green',
        dotColor: '#22c55e'
      },
      {
        code: 'CTBT-PCC-201',
        name: 'Object Oriented Programming with C++',
        examDate: '2026-04-29', // 1 day gap
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM',
        colorClass: 'exam-yellow',
        dotColor: '#eab308'
      },
      {
        code: 'CTBT-HSM-201',
        name: 'Professional Ethics',
        examDate: '2026-04-30', // Back-to-back (common for minor subjects)
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM',
        colorClass: 'exam-blue',
        dotColor: '#3b82f6'
      }
    ]
  },
  
  "bsc-msc-forensic": {
    "sem-2": [
      // ----------------- B.SC END SEMESTERS -----------------
      {
        code: 'BSC-MJ-201',
        name: 'Criminal and Evidence Law',
        examDate: '2026-04-24', 
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM', // B.Sc Afternoon Time
        colorClass: 'exam-blue',
        dotColor: '#3b82f6'
      },
      {
        code: 'BSC-MJ-202',
        name: 'Fingerprint Science',
        examDate: '2026-04-27', 
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM',
        colorClass: 'exam-green',
        dotColor: '#22c55e'
      },
      {
        code: 'BSC-MN-203',
        name: 'GENERAL BIOLOGY-I',
        examDate: '2026-04-28', 
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM',
        colorClass: 'exam-yellow',
        dotColor: '#eab308'
      },
      {
        code: 'BSC-MN-204',
        name: 'GENERAL PHYSICS-II',
        examDate: '2026-04-29', 
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM',
        colorClass: 'exam-red',
        dotColor: '#ef4444'
      },
      {
        code: 'BSC-AE-205',
        name: 'ENGLISH LANGUAGE SKILLS -II',
        examDate: '2026-04-30', 
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM',
        colorClass: 'exam-blue',
        dotColor: '#3b82f6'
      },
      {
        code: 'BSC-SE-206',
        name: 'FINANCIAL LITERACY',
        examDate: '2026-05-04', 
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM',
        colorClass: 'exam-green',
        dotColor: '#22c55e'
      },
      {
        code: 'BSC-VA-207',
        name: 'INDIAN KNOWLEDGE SYSTEM',
        examDate: '2026-05-05', 
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '02:30 PM - 05:30 PM',
        colorClass: 'exam-green',
        dotColor: '#22c55e'
      }
    ]
  }
};

module.exports = examData;