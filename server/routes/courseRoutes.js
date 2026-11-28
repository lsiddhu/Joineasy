const express = require("express");
const {
  createCourse,
  listCourses,
  getCourse,
  enrollInCourse,
} = require("../controllers/courseController");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  verifyToken,
  authorizeRole("STUDENT", "PROFESSOR"),
  listCourses,
);
router.get(
  "/:id",
  verifyToken,
  authorizeRole("STUDENT", "PROFESSOR"),
  getCourse,
);
router.post("/", verifyToken, authorizeRole("PROFESSOR"), createCourse);
router.post("/enroll", verifyToken, authorizeRole("STUDENT"), enrollInCourse);

module.exports = router;
