// const checkEligibility=async(req,res)=>{
//     const {customer_id,loan_amount,interest_rate,tenure}=req.body;

// }

// module.exports={checkEligibility}

const db = require("../config/db");

const checkEligibility = async (req, res) => {
  const { customer_id, loan_amount, interest_rate, tenure } = req.body;

  try {
    db.query(
      `select sum(emis_on_time) as past_loans_paid_on_time, count(*) AS number_of_loans_taken, sum(loan_amount) as loan_approved_volume from loan_data where loanid = ${customer_id};`,
      function (err, result, fields) {
        if (err) throw err;


        const {
          past_loans_paid_on_time,
          number_of_loans_taken,
          loan_approved_volume,
        } = result[0];
        let creditScore = 0;
        if (past_loans_paid_on_time > 0) {
          creditScore += 20;
        }
        if (number_of_loans_taken > 0) {
          creditScore += 30;
        }

        
        const currentLoanQuery = `SELECT SUM(loan_amount) AS current_loan_sum FROM loan_data WHERE loanid = ${customer_id};`;
        db.query(currentLoanQuery, async (err, currentLoanResult) => {
          if (err) throw err;
          const currentLoanSum = currentLoanResult[0]?.current_loan_sum || 0;

          const approvedLimitQuery = `select approved_limit, monthly_salary from customer_data where customer_id = ${customer_id};`;
          db.query(
            approvedLimitQuery,
            [customer_id],
            (err, approvedLimitResult) => {
              if (err) throw err;
              const { approved_limit, monthly_salary } = approvedLimitResult[0];

              if (
                loan_amount > approved_limit ||
                loan_amount > 0.5 * monthly_salary
              ) {
                res.json({
                  customer_id: customer_id,
                  approval: false,
                  reason:
                    "loan amount exceeds approved limit or monthly salary",
                });
                return;
              }

              const maxAllowedLoanAmount = 1000000;
              if (loan_amount > maxAllowedLoanAmount) {
                res.json({
                  customer_id: customer_id,
                  approval: false,
                  reason: "Loan amount is too large",
                });
                return;
              }

              let interestRate;
              if (creditScore > 50) {
                interestRate = 0;
              } else if (creditScore > 30) {
                interestRate = 12;
              } else if (creditScore > 10) {
                interestRate = 16;
              } else {
                res.json({
                  customer_id: customer_id,
                  approval: false,
                  reason: "Credit score is too low",
                });
                return;
              }

              res.json({
                customer_id: customer_id,
                approval: true,
                interest_rate: interestRate,
              });
            }
          );
        });
      }
    );
  } catch (error) {
    console.error("Error calculating credit score:", error);
    res.status(500).json({ error: "Error calculating credit score" });
  }
};

const createLoan = async (req, res) => {
  const { customer_id, loan_amount, interest_rate, tenure } = req.body;

  try {

    db.query(
      `select sim(emis_on_time) as past_loans_paid_on_time, COUNT(*) as number_of_loans_taken, SUM(loan_amount) as loan_approved_volume from loan_data where loanid = ${customer_id};`,
      function (err, result, fields) {
        if (err) throw err;


        const {
          past_loans_paid_on_time,
          number_of_loans_taken,
          loan_approved_volume,
        } = result[0];
        let creditScore = 0;
        if (past_loans_paid_on_time > 0) {
          creditScore += 20;
        }
        if (number_of_loans_taken > 0) {
          creditScore += 30;
        }

        const currentLoanQuery = `select SUM(loan_amount) as current_loan_sum from loan_data where loanid = ${customer_id};`;
        db.query(currentLoanQuery, async (err, currentLoanResult) => {
          if (err) throw err;
          const currentLoanSum = currentLoanResult[0]?.current_loan_sum || 0;


          const approvedLimitQuery = `select approved_limit, monthly_salary from customer_data where customer_id = ${customer_id};`;
          db.query(
            approvedLimitQuery,
            [customer_id],
            (err, approvedLimitResult) => {
              if (err) throw err;
              const { approved_limit, monthly_salary } = approvedLimitResult[0];


              if (
                loan_amount > approved_limit ||
                loan_amount > 0.5 * monthly_salary
              ) {

                res.json({
                  customer_id: customer_id,
                  approval: false,
                  reason:
                    "Loan amount exceeds approved limit or monthly salary",
                });
                return;
              }


              const maxAllowedLoanAmount = 1000000; 
              if (loan_amount > maxAllowedLoanAmount) {

                res.json({
                  customer_id: customer_id,
                  approval: false,
                  reason: "Loan amount is too large",
                });
                return;
              }


              let interestRate;
              if (creditScore > 50) {
                interestRate = 0;
              } else if (creditScore > 30) {
                interestRate = 12;
              } else if (creditScore > 10) {
                interestRate = 16;
              } else {

                res.json({
                  customer_id: customer_id,
                  approval: false,
                  reason: "Credit score is too low",
                });
                return;
              }


              const insertLoanQuery = `insert into loan_data (loanid, loan_amount, interest_rate, tenure) values (?, ?, ?, ?)`;
              db.query(
                insertLoanQuery,
                [customer_id, loan_amount, interestRate, tenure],
                (err, result) => {
                  if (err) throw err;

                  res.json({
                    customer_id: customer_id,
                    approval: true,
                    interest_rate: interestRate,
                  });
                }
              );
            }
          );
        });
      }
    );
  } catch (error) {
    console.error("Error creating loan:", error);
    res.status(500).json({ error: "Error creating loan" });
  }
};

const viewloan = async (req, res) => {
    const customerId = req.params.loan_id;

    db.query(`select * from loan_data where loanid = ${customerId}`, (loanError, loanResults, loanFields) => {
        if (loanError) {
            console.error('Error fetching loan data:', loanError);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (loanResults.length === 0) {
            res.status(404).json({ error: 'No loans found for the customer' });
            return;
        }

        db.query(`select customer_id, first_name, last_name, phone_number, age from customer_data where customer_id = ${customerId}`, (customerError, customerResults, customerFields) => {
            if (customerError) {
                console.error('Error fetching customer data:', customerError);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            if (customerResults.length === 0) {
                res.status(404).json({ error: 'Customer not found' });
                return;
            }

            const customerDetails = customerResults[0];


            const responseBody = {
                customer: {
                    id: customerDetails.id,
                    first_name: customerDetails.first_name,
                    last_name: customerDetails.last_name,
                    phone_number: customerDetails.phone_number,
                    age: customerDetails.age
                },
                loans: loanResults.map(loan => ({
                    loan_id: loan.loanid,
                    loan_amount: loan.loan_amount,
                    interest_rate: loan.interest_rate,
                    monthly_installment: loan.monthly_installment,
                    tenure: loan.tenure
                }))
            };


            res.json(responseBody);
        });
    });
};

const makePayment = async (req, res) => {
    const {  loan_id,loan_amount } = req.body;
    const { amount } = req.body;

    try {

      const loanQuery = `select * from loan_data where loan_amount=${loan_amount} and loanid = ${loan_id};`;
        db.query(loanQuery, (loanError, loanResults, loanFields) => {
            if (loanError) {
                console.error('Error fetching loan data:', loanError);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            if (loanResults.length === 0) {
                res.status(404).json({ error: 'Loan not found' });
                return;
            }

            console.log("result of query is " + JSON.stringify(loanResults));
            const loanDetails = loanResults[0];
            const { loan_amount, tenure, interest_rate, emi, emis_on_time } = loanDetails;
            console.log("emi is "+loanResults[0].emi);

            
            let newEmi = loanDetails.emi;
            if (amount !== newEmi) {
                newEmi = amount;
            }
            console.log("emi is " + newEmi);
            console.log("emi is "+newEmi);


            const updatedEmisOnTime = emis_on_time + 1;
            console.log("emi on time cnt "+updatedEmisOnTime);


            const updateQuery = `update loan_data set emi = ${newEmi}, emis_on_time = ${updatedEmisOnTime} where  loanid = ${loan_id}`;
            db.query(updateQuery, (updateError, updateResults) => {
                if (updateError) {
                    console.error('Error updating loan data:', updateError);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }


                res.json({ message: 'Payment successful',"emi":newEmi });
            });
        });
    } catch (error) {
        console.error('Error making payment:', error);
        res.status(500).json({ error: 'Error making payment' });
    }
};

const viewStatement = async (req, res) => {
  const { customer_id, loan_id } = req.params;


  db.query(`SELECT * FROM loan_data WHERE loanid = ${loan_id}`, (loanError, loanResults, loanFields) => {
      if (loanError) {
          console.error('Error fetching loan data:', loanError);
          res.status(500).json({ error: 'Internal server error' });
          return;
      }

      if (loanResults.length === 0) {
          res.status(404).json({ error: 'Loan not found' });
          return;
      }

      
      db.query(`SELECT * FROM customer_data WHERE customer_id = ${customer_id}`, (customerError, customerResults, customerFields) => {
          if (customerError) {
              console.error('Error fetching customer data:', customerError);
              res.status(500).json({ error: 'Internal server error' });
              return;
          }

          if (customerResults.length === 0) {
              res.status(404).json({ error: 'Customer not found' });
              return;
          }

          const customerDetails = customerResults[0];
          const loanDetails = loanResults[0];

          
          const responseBody = {
              customer_id: customer_id,
              loan_id: loan_id,
              principal: loanDetails.loan_amount,
              interest_rate: loanDetails.interest_rate,
              amount_paid: loanDetails.amount_paid,
              monthly_installment: loanDetails.monthly_installment,
              repayments_left: loanDetails.tenure - loanDetails.repayments_made
          };

          
          res.json(responseBody);
      });
  });
};


module.exports = { checkEligibility, createLoan, viewloan,makePayment,viewStatement };
