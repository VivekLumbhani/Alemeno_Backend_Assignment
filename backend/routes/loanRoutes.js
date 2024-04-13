const express=require("express");
const { checkEligibility, createLoan, viewloan, makePayment, viewStatement } = require("../conreollers/loanController");
const router=express.Router();

router.post("/check-eligibility",checkEligibility)
router.post("/create-loan",createLoan)
router.get("/view-loan/:loan_id",viewloan)
router.post("/make-payment",makePayment)
router.get("/make-payment/:customer_id/loan_id",viewStatement)



module.exports=router