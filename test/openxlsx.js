const xlsx = require("xlsx");
const fs = require("fs");

// Load the XLSX file
const workbook = xlsx.readFile("ID-Password_FTP.xlsx"); // Replace 'example.xlsx' with your file path

// Choose a specific sheet from the workbook (e.g., the first sheet)
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert the sheet data into a JavaScript object
const jsonData = xlsx.utils.sheet_to_json(worksheet);

// Now, jsonData contains the Excel data as a JavaScript object
console.log(jsonData);

// You can also write the object to a JSON file if needed
fs.writeFileSync("data.json", JSON.stringify(jsonData));
