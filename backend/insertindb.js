const express=require("express");
const mysql=require("mysql");
const path=require("path");
const xlsx=require("xlsx");
const app=express();
const PORT=9000;

const db=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"alemenoDB"
})
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

const filePath = path.join(__dirname, '..', 'loan_data.xlsx');
let workbook = xlsx.readFile(filePath);

let worksheet = workbook.Sheets[workbook.SheetNames[0]];
let range = xlsx.utils.decode_range(worksheet["!ref"]);


let bulkData = [];

// Process each row of the Excel sheet and collect data for bulk insert
for (let row = range.s.r + 1; row <= range.e.r; row++) {
    let data = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
        let cell = worksheet[xlsx.utils.encode_cell({ r: row, c: col })];
        data.push(cell ? cell.v : null); // Handle empty cells
    }
    bulkData.push(data);
}

let sql = "INSERT INTO loan_data (customer_id, loanid, loan_amount, tenure, interest_rate, emi, emis_on_time, start_date, end_date) VALUES ?";
db.query(sql, [bulkData], (err, result) => {
    if (err) {
        console.error('Error inserting data into database:', err);
        return;
    }
    console.log('Data inserted successfully');
});


app.get("/",(req,res)=>{
    res.send("hello user")
})

app.listen(PORT,()=>{
    console.log(`server listening on ${PORT}`);
})