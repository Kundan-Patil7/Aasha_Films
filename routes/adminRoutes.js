const express = require("express");
const router = express.Router();

// Controllers
const { adminLogin, profile } = require("../controllers/admin/authController");
const {
  fetchTickets,
  allUsers,
  suspendUser,
  blockUser,
  unsuspendUser,
  changePlan,
} = require("../controllers/admin/dashboardController");

// Middleware
const authenticate = require("../middleware/adminMiddleware");

// Admin Authentication
router.post("/login", adminLogin);

// Admin Profile
router.get("/profile", authenticate, profile);

// User Management
router.post("/block", authenticate, blockUser);
router.post("/suspend", authenticate, suspendUser);
router.post("/unsuspend", authenticate, unsuspendUser);

// Admin Actions
router.get("/tickets", authenticate, fetchTickets);
router.get("/users", authenticate, allUsers);
router.post("/planChange", authenticate, changePlan);

module.exports = router;
