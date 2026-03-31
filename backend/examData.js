const examData = {
  "btech-mtech-cybersecurity": {
    "sem-2": [
      {
        code: 'CTВT-BSC-201',
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
        code: 'CTВТ-HSM-201',
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

      {
        code: 'CTВT-BSC-201',
        name: 'Mathematics-II',
        examDate: '2026-04-24', // Starting day
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '10:00 AM - 1:00 PM', // 3 hours for End Sem
        colorClass: 'exam-red',
        dotColor: '#ef4444'
      },
      {
        code: 'CTBT-EMC-201',
        name: 'Fundamentals of Forensic Science',
        examDate: '2026-04-27', // Monday after the weekend
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '10:00 AM - 1:00 PM',
        colorClass: 'exam-blue',
        dotColor: '#3b82f6'
      },
      {
        code: 'CTBT-ESC-201',
        name: 'Digital Logic Design',
        examDate: '2026-04-29', // 1 day gap
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '10:00 AM - 1:00 PM',
        colorClass: 'exam-green',
        dotColor: '#22c55e'
      },
      {
        code: 'CTBT-PCC-201',
        name: 'Object Oriented Programming with C++',
        examDate: '2026-05-01', // 1 day gap
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '10:00 AM - 1:00 PM',
        colorClass: 'exam-yellow',
        dotColor: '#eab308'
      },
      {
        code: 'CTВТ-HSM-201',
        name: 'Professional Ethics',
        examDate: '2026-05-02', // Back-to-back (common for minor subjects)
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '10:00 AM - 1:00 PM',
        colorClass: 'exam-blue',
        dotColor: '#3b82f6'
      },
      {
        code: 'CTBT-EMC-202',
        name: 'Environment Science',
        examDate: '2026-05-04', // Final day
        type: 'CA4 (End Semester)',
        fullMarks: 100,
        time: '10:00 AM - 1:00 PM',
        colorClass: 'exam-green',
        dotColor: '#22c55e'
      }
    ]
  }
};

module.exports = examData;