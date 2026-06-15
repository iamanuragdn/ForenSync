const fs = require('fs');
let data = fs.readFileSync('./syllabusData.js', 'utf8');

// We can just require it to get the object
const syllabusData = require('./syllabusData.js');

// Add a dummy subject to sem-3 of btech-mtech-cybersecurity
syllabusData['btech-mtech-cybersecurity'].semesters['sem-3'] = {
  ...syllabusData['btech-mtech-cybersecurity'].semesters['sem-3'],
  "DUMMY-101": {
    name: "Dummy Subject",
    credits: 3,
    teacher: "John Doe",
    type: "Core",
    units: []
  }
};

const newContent = 'const syllabusData = ' + JSON.stringify(syllabusData, null, 2) + ';\n\nmodule.exports = syllabusData;\n';
fs.writeFileSync('./syllabusData_test.js', newContent);
console.log("Done");
