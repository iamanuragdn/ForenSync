const fs = require('fs');
const syllabusData = require('./syllabusData');

let dict = {};
for (const prog in syllabusData) {
    const sems = syllabusData[prog].semesters;
    if (sems) {
        for (const sem in sems) {
            for (const code in sems[sem]) {
                const item = sems[sem][code];
                dict[code] = item.name || code;
            }
        }
    }
}

// Make sure the target directory exists if we use src/data
const dir = './src/data';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync('./src/data/subjectDictionary.json', JSON.stringify(dict, null, 2));
console.log('Dictionary successfully generated at ./src/data/subjectDictionary.json!');
