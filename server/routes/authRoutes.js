
const express = require("express");
const router = express.Router();

const { registerStudent, loginStudent , loginProfessor} = require("../controllers/authcontroller");
const {
  verifyToken,
  authorizeRole,
} = require("../middleware/authMiddleware");


router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/professor/login", loginProfessor)
router.get(
  "/profile",
  verifyToken,
  authorizeRole("STUDENT"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Protected student profile accessed",
      user: req.user,
    });
  }
);
module.exports = router;
