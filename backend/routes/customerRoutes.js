const express=require("express");
const { registerNewBankUser } = require("../conreollers/bankUsers");
const router=express.Router();

router.post("/register",registerNewBankUser)

module.exports=router