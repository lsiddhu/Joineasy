const prisma = require("../config/db");

const courseAccessWhere = (studentId) => ({
  OR: [{ courseId: null }, { course: { students: { some: { studentId } } } }],
});

const assignmentAccessWhere = (studentId, groupId) => ({
  AND: [
    courseAccessWhere(studentId),
    {
      OR: [
        { assignToAll: true },
        ...(groupId ? [{ groups: { some: { groupId } } }] : []),
      ],
    },
  ],
});

const getStudentAssignments = async (req, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { groupId: true },
    });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const courseId = req.query.courseId ? Number(req.query.courseId) : null;
    if (req.query.courseId && (!Number.isInteger(courseId) || courseId <= 0)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID" });
    }

    if (courseId) {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: { courseId, studentId: req.user.id },
        },
      });
      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in this course",
        });
      }
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        ...assignmentAccessWhere(req.user.id, student.groupId),
        ...(courseId ? { courseId } : {}),
        ...(student.groupId ? {} : { submissionType: "INDIVIDUAL" }),
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
        groups: {
          include: { group: { select: { id: true, name: true } } },
        },
        confirmations: {
          where: { studentId: req.user.id },
          select: { confirmed: true, confirmedAt: true },
        },
        groupSubmissions: {
          where: { groupId: student.groupId || -1 },
          select: {
            confirmed: true,
            confirmedAt: true,
            confirmedBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const result = assignments.map((assignment) => {
      const submission =
        assignment.submissionType === "GROUP"
          ? assignment.groupSubmissions[0]
          : assignment.confirmations[0];
      const { confirmations, groupSubmissions, ...details } = assignment;
      return {
        ...details,
        submissionStatus: !submission
          ? "NOT_STARTED"
          : submission.confirmed
            ? "CONFIRMED"
            : "PENDING",
        confirmedAt: submission?.confirmedAt || null,
        confirmedBy: submission?.confirmedBy || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      assignments: result,
    });
  } catch (error) {
    console.error("Get student assignments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
    });
  }
};

const loadEligibleAssignment = async (assignmentId, userId) => {
  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, groupId: true },
  });
  if (!student) return { student: null, assignment: null };

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      ...assignmentAccessWhere(userId, student.groupId),
    },
  });
  return { student, assignment };
};

const startSubmissionConfirmation = async (req, res) => {
  try {
    const assignmentId = Number(req.params.id);
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid assignment ID" });
    }

    const { student, assignment } = await loadEligibleAssignment(
      assignmentId,
      req.user.id,
    );
    if (!student || !assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found or not assigned to you",
      });
    }

    if (assignment.submissionType === "GROUP") {
      if (!student.groupId) {
        return res.status(400).json({
          success: false,
          message: "Join a group before starting this submission",
        });
      }
      const group = await prisma.group.findUnique({
        where: { id: student.groupId },
        select: { leaderId: true },
      });
      if (group?.leaderId !== student.id) {
        return res.status(403).json({
          success: false,
          message: "Only the group leader can confirm this submission",
        });
      }

      const submission = await prisma.groupSubmission.upsert({
        where: {
          assignmentId_groupId: {
            assignmentId,
            groupId: student.groupId,
          },
        },
        update: {},
        create: {
          assignmentId,
          groupId: student.groupId,
          startedById: student.id,
        },
      });
      if (submission.confirmed) {
        return res.status(409).json({
          success: false,
          message: "Group submission already confirmed",
        });
      }
      return res.status(200).json({
        success: true,
        message:
          "Group submission started. Confirm when the upload is complete.",
        submission,
      });
    }

    const submission = await prisma.submissionConfirmation.upsert({
      where: {
        assignmentId_studentId: { assignmentId, studentId: student.id },
      },
      update: {},
      create: { assignmentId, studentId: student.id, confirmed: false },
    });
    if (submission.confirmed) {
      return res.status(409).json({
        success: false,
        message: "Submission already confirmed",
      });
    }
    return res.status(200).json({
      success: true,
      message:
        "Submission confirmation started. Confirm when the upload is complete.",
      submission,
    });
  } catch (error) {
    console.error("Start submission confirmation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start submission confirmation",
    });
  }
};

const confirmSubmission = async (req, res) => {
  try {
    const assignmentId = Number(req.params.id);
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid assignment ID" });
    }

    const { student, assignment } = await loadEligibleAssignment(
      assignmentId,
      req.user.id,
    );
    if (!student || !assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found or not assigned to you",
      });
    }

    if (assignment.submissionType === "GROUP") {
      const group = student.groupId
        ? await prisma.group.findUnique({
            where: { id: student.groupId },
            select: { leaderId: true },
          })
        : null;
      if (group?.leaderId !== student.id) {
        return res.status(403).json({
          success: false,
          message: "Only the group leader can confirm this submission",
        });
      }

      const existing = await prisma.groupSubmission.findUnique({
        where: {
          assignmentId_groupId: {
            assignmentId,
            groupId: student.groupId,
          },
        },
      });
      if (!existing) {
        return res.status(400).json({
          success: false,
          message: "Start the group submission before confirming it",
        });
      }
      if (existing.confirmed) {
        return res.status(409).json({
          success: false,
          message: "Group submission already confirmed",
        });
      }

      const submission = await prisma.groupSubmission.update({
        where: { id: existing.id },
        data: {
          confirmed: true,
          confirmedById: student.id,
          confirmedAt: new Date(),
        },
      });
      return res.status(200).json({
        success: true,
        message: "Group submission confirmed for all group members",
        submission,
      });
    }

    const existing = await prisma.submissionConfirmation.findUnique({
      where: {
        assignmentId_studentId: { assignmentId, studentId: student.id },
      },
    });
    if (!existing) {
      return res.status(400).json({
        success: false,
        message: "Start the submission confirmation first",
      });
    }
    if (existing.confirmed) {
      return res.status(409).json({
        success: false,
        message: "Submission already confirmed",
      });
    }

    const submission = await prisma.submissionConfirmation.update({
      where: { id: existing.id },
      data: { confirmed: true, confirmedAt: new Date() },
    });
    return res.status(200).json({
      success: true,
      message: "Submission confirmed successfully",
      submission,
    });
  } catch (error) {
    console.error("Confirm submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm submission",
    });
  }
};

const getGroupProgress = async (req, res) => {
  try {
    const group = await prisma.group.findFirst({
      where: { members: { some: { id: req.user.id } } },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            studentId: true,
            confirmations: {
              where: { confirmed: true },
              select: { assignmentId: true },
            },
            enrollments: { select: { courseId: true } },
          },
        },
        submissions: {
          where: { confirmed: true },
          select: { assignmentId: true },
        },
      },
    });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "You are not part of any group",
      });
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        AND: [
          {
            OR: [
              { assignToAll: true },
              { groups: { some: { groupId: group.id } } },
            ],
          },
          {
            OR: [
              { courseId: null },
              { course: { students: { some: { studentId: req.user.id } } } },
            ],
          },
        ],
      },
      select: { id: true, title: true, submissionType: true, courseId: true },
    });

    const confirmedGroupAssignments = new Set(
      group.submissions.map((submission) => submission.assignmentId),
    );
    const memberProgress = group.members.map((member) => {
      const enrolledCourseIds = new Set(
        member.enrollments.map((enrollment) => enrollment.courseId),
      );
      const eligible = assignments.filter(
        (assignment) =>
          !assignment.courseId || enrolledCourseIds.has(assignment.courseId),
      );
      const completedAssignments = eligible.filter((assignment) =>
        assignment.submissionType === "GROUP"
          ? confirmedGroupAssignments.has(assignment.id)
          : member.confirmations.some(
              (confirmation) => confirmation.assignmentId === assignment.id,
            ),
      ).length;
      return { ...member, eligibleAssignments: eligible, completedAssignments };
    });

    const totalTasks = memberProgress.reduce(
      (total, member) => total + member.eligibleAssignments.length,
      0,
    );
    const completedTasks = memberProgress.reduce(
      (total, member) => total + member.completedAssignments,
      0,
    );
    const totalAssignments = new Set(
      memberProgress.flatMap((member) =>
        member.eligibleAssignments.map((assignment) => assignment.id),
      ),
    ).size;

    return res.status(200).json({
      success: true,
      groupName: group.name,
      totalMembers: group.members.length,
      totalAssignments,
      completedTasks,
      totalTasks,
      progressPercentage: totalTasks
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0,
      members: memberProgress.map((member) => ({
        id: member.id,
        name: member.name,
        studentId: member.studentId,
        completedAssignments: member.completedAssignments,
        totalAssignments: member.eligibleAssignments.length,
      })),
    });
  } catch (error) {
    console.error("Get group progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch group progress",
    });
  }
};

const getAssignmentSubmissionStatus = async (req, res) => {
  try {
    const assignmentId = Number(req.params.id);
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid assignment ID" });
    }

    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, professorId: req.user.id },
      include: {
        groups: { select: { groupId: true } },
        groupSubmissions: {
          select: {
            groupId: true,
            confirmed: true,
            confirmedAt: true,
            confirmedBy: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const selectedGroupIds = assignment.groups.map((item) => item.groupId);
    const enrollments = assignment.courseId
      ? await prisma.courseEnrollment.findMany({
          where: { courseId: assignment.courseId },
          select: { studentId: true },
        })
      : null;
    const courseStudentIds = enrollments
      ? new Set(enrollments.map((item) => item.studentId))
      : null;
    const users = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...(courseStudentIds ? { id: { in: [...courseStudentIds] } } : {}),
        ...(assignment.assignToAll
          ? {}
          : { groupId: { in: selectedGroupIds } }),
        ...(assignment.submissionType === "GROUP"
          ? { groupId: { not: null } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        group: { select: { id: true, name: true, leaderId: true } },
        confirmations: {
          where: { assignmentId },
          select: { confirmed: true, confirmedAt: true },
        },
      },
      orderBy: { name: "asc" },
    });
    const groupSubmissions = new Map(
      assignment.groupSubmissions.map((submission) => [
        submission.groupId,
        submission,
      ]),
    );
    const students = users.map((student) => {
      const record =
        assignment.submissionType === "GROUP"
          ? groupSubmissions.get(student.group.id)
          : student.confirmations[0];
      const state = !record
        ? "NOT_STARTED"
        : record.confirmed
          ? "CONFIRMED"
          : "PENDING";
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        group: student.group,
        status: state,
        confirmedAt: record?.confirmedAt || null,
        confirmedBy: record?.confirmedBy || null,
      };
    });

    const groupMap = new Map();
    students.forEach((student) => {
      const key = student.group?.id ?? "no-group";
      const entry = groupMap.get(key) || {
        groupId: key,
        groupName: student.group?.name || "No Group",
        totalStudents: 0,
        confirmedStudents: 0,
      };
      entry.totalStudents += 1;
      if (student.status === "CONFIRMED") entry.confirmedStudents += 1;
      groupMap.set(key, entry);
    });

    const confirmed = students.filter(
      (student) => student.status === "CONFIRMED",
    ).length;
    return res.status(200).json({
      success: true,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        submissionType: assignment.submissionType,
        courseId: assignment.courseId,
      },
      summary: {
        totalStudents: students.length,
        confirmed,
        pending: students.filter((student) => student.status === "PENDING")
          .length,
        notStarted: students.filter(
          (student) => student.status === "NOT_STARTED",
        ).length,
      },
      groupSummary: [...groupMap.values()],
      students,
    });
  } catch (error) {
    console.error("Get assignment submission status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch submission status",
    });
  }
};

const getProfessorAnalytics = async (req, res) => {
  try {
    const [assignments, allStudentRecords] = await Promise.all([
      prisma.assignment.findMany({
        where: { professorId: req.user.id },
        include: {
          course: {
            include: {
              students: {
                select: {
                  student: { select: { id: true, groupId: true } },
                },
              },
            },
          },
          groups: { select: { groupId: true } },
          confirmations: {
            where: { confirmed: true },
            select: { studentId: true },
          },
          groupSubmissions: {
            where: { confirmed: true },
            select: { groupId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true, groupId: true },
      }),
    ]);

    const allStudents = allStudentRecords.length;
    const assignmentAnalytics = assignments.map((assignment) => {
      const enrolledStudents = assignment.course
        ? assignment.course.students.map((entry) => entry.student)
        : allStudentRecords;
      const selectedGroupIds = new Set(
        assignment.groups.map((item) => item.groupId),
      );
      const eligible = enrolledStudents.filter(
        (student) =>
          (assignment.assignToAll || selectedGroupIds.has(student.groupId)) &&
          (assignment.submissionType !== "GROUP" || student.groupId !== null),
      );
      const confirmedStudentIds = new Set(
        assignment.confirmations.map((item) => item.studentId),
      );
      const confirmedGroupIds = new Set(
        assignment.groupSubmissions.map((item) => item.groupId),
      );
      const confirmed = eligible.filter((student) =>
        assignment.submissionType === "GROUP"
          ? confirmedGroupIds.has(student.groupId)
          : confirmedStudentIds.has(student.id),
      ).length;

      return {
        assignmentId: assignment.id,
        title: assignment.title,
        courseName: assignment.course?.name || null,
        totalStudents: eligible.length,
        confirmed,
        pending: Math.max(eligible.length - confirmed, 0),
        completionPercentage: eligible.length
          ? Math.round((confirmed / eligible.length) * 100)
          : 0,
      };
    });

    const totalEligibleSubmissions = assignmentAnalytics.reduce(
      (total, item) => total + item.totalStudents,
      0,
    );
    const totalConfirmed = assignmentAnalytics.reduce(
      (total, item) => total + item.confirmed,
      0,
    );

    return res.status(200).json({
      success: true,
      overview: {
        totalAssignments: assignments.length,
        totalStudents: allStudents,
        totalEligibleSubmissions,
        totalConfirmed,
        totalPending: totalEligibleSubmissions - totalConfirmed,
        completionPercentage: totalEligibleSubmissions
          ? Math.round((totalConfirmed / totalEligibleSubmissions) * 100)
          : 0,
      },
      assignmentAnalytics,
    });
  } catch (error) {
    console.error("Professor analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch professor analytics",
    });
  }
};

module.exports = {
  getStudentAssignments,
  startSubmissionConfirmation,
  confirmSubmission,
  getGroupProgress,
  getAssignmentSubmissionStatus,
  getProfessorAnalytics,
};
