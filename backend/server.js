const express=require("express");
const mysql=require("mysql");
const path=require("path");
const app=express();
const PORT=9000;
const bankRoutes=require("./routes/customerRoutes")
const loanRoutes=require("./routes/loanRoutes")
const db=require("./config/db");

app.use(express.json())

db.query('SELECT * FROM customer_data', (error, results, fields) => {
    if (error) {
        console.error('Error executing query:', error);
        return;
    }
    
});

app.get("/",(req,res)=>{
    res.send("hello user")
})

app.use("/bank",bankRoutes)
app.use("/loan",loanRoutes);
app.listen(PORT,()=>{
    console.log(`server listening on ${PORT}`);
})