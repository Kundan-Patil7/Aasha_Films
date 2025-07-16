const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  createTicket,
  updateProfile,
} = require("../controllers/userController");
const userAuth = require("../middleware/userAuth");
// Middleware for handling file uploads

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/profile", userAuth, getUserProfile);

router.post("/createTicket", createTicket);

router.put("/profile", userAuth, updateProfile);

module.exports = router;
