const express = require("express");
const router = express.Router();

const {
  createGroup,
  joinGroup,
  getMyGroup,
  addMember,
  getAllGroups,
} = require("../controllers/groupController");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

// Create a group (students only)
router.post("/", verifyToken, authorizeRole("STUDENT"), createGroup);
// Join a group
router.post("/join", verifyToken, authorizeRole("STUDENT"), joinGroup);

// Get current student's group details
router.get("/my-group", verifyToken, authorizeRole("STUDENT"), getMyGroup);
// Add a member using email or student ID
router.get("/", verifyToken, authorizeRole("PROFESSOR"), getAllGroups);

router.post("/add-member", verifyToken, authorizeRole("STUDENT"), addMember);

module.exports = router;
