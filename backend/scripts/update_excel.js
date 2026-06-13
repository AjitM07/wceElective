const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'data', 'responses.xlsx');

if (!fs.existsSync(filePath)) {
  console.error(`Excel file not found at: ${filePath}`);
  process.exit(1);
}

const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws);

// Populate 'Division' as A or B alternatingly
rows.forEach((row, index) => {
  row['Division'] = index % 2 === 0 ? 'A' : 'B';
});

const newWs = XLSX.utils.json_to_sheet(rows);
wb.Sheets[wb.SheetNames[0]] = newWs;
XLSX.writeFile(wb, filePath);

console.log('Successfully added Division column to Excel file!');
console.log('First 5 updated rows:', rows.slice(0, 5).map(r => ({ Name: r.Name, PRN: r['PRN No'], Division: r.Division })));
