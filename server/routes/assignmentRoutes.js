const express = require("express");
const router = express.Router();

const {
  createAssignment,
  editAssignment,
  getAllAssignments,
  getStudentAssignments,
  startSubmissionConfirmation,
  confirmSubmission,
  getGroupProgress,
  getAssignmentSubmissionStatus,
  getProfessorAnalytics,
} = require("../controllers/assignmentController");

const {
  verifyToken,
  authorizeRole,
} = require("../middleware/authMiddleware");

// Professor-only assignment creation
router.post(
  "/",
  verifyToken,
  authorizeRole("PROFESSOR"),
  createAssignment
);
// Edit assignment
router.put(
  "/:id",
  verifyToken,
  authorizeRole("PROFESSOR"),
  editAssignment
);
// View all assignments created by the professor
router.get(
  "/",
  verifyToken,
  authorizeRole("PROFESSOR"),
  getAllAssignments
);

router.get(
  "/student",
  verifyToken,
  authorizeRole("STUDENT"),
  getStudentAssignments
)

router.post(
  "/:id/submission/start",
  verifyToken,
  authorizeRole("STUDENT"),
  startSubmissionConfirmation
)
//
router.post(
  "/:id/submission/confirm",
  verifyToken,
  authorizeRole("STUDENT"),
  confirmSubmission
)
//
router.get(
  "/student/group-progress",
  verifyToken,
  authorizeRole("STUDENT"),
  getGroupProgress
)
//
router.get(
  "/:id/submission-status",
  verifyToken,
  authorizeRole("PROFESSOR"),
  getAssignmentSubmissionStatus
)
//
router.get(
  "/professor/analytics",
  verifyToken,
  authorizeRole("PROFESSOR"),
  getProfessorAnalytics
)

module.exports = router;