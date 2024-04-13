const db = require("../config/db");

const registerNewBankUser = async (req, res) => {
    console.log("user req is " + JSON.stringify(req.body));

    const { customer_id, first_name, last_name, age, monthly_salary, phone_number } = req.body;

    const approved_limit = 36 * monthly_salary;


    const userData = {
        customer_id,
        first_name,
        last_name,
        age,
        monthly_salary,
        approved_limit, 
        phone_number
    };

    const toSendData = {
        customer_id,
        first_name,
        age,
        monthly_salary,
        approved_limit, 
        phone_number
    };

    const sql = "INSERT INTO customer_data SET ?";
    db.query(sql, userData, (err, result) => {
        if (err) {
            console.log("error in insert " + err);
            res.status(500).send("Error inserting data into database");
            return;
        }
        console.log("inserted data " + JSON.stringify(result));
        res.status(200).send(toSendData);
    });
};

module.exports = { registerNewBankUser };

