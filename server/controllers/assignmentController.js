const prisma = require("../config/db");

const createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      oneDriveUrl,
      dueDate,
      assignToAll,
      groupIds,
      courseId,
      submissionType = "INDIVIDUAL",
    } = req.body;

    // Validate required fields
    if (!title || !description || !oneDriveUrl || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "All assignment fields are required",
      });
    }

    // Validate OneDrive URL
    try {
      const url = new URL(oneDriveUrl);

      if (
        url.protocol !== "https:" ||
        !["1drv.ms", "onedrive.live.com", "sharepoint.com"].some(
          (domain) =>
            url.hostname === domain || url.hostname.endsWith(`.${domain}`),
        )
      ) {
        throw new Error("Invalid OneDrive URL");
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid OneDrive URL",
      });
    }

    // Validate due date
    const parsedDueDate = new Date(dueDate);

    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date",
      });
    }

    // Validate assignment target
    if (typeof assignToAll !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "assignToAll must be true or false",
      });
    }

    if (!["INDIVIDUAL", "GROUP"].includes(submissionType)) {
      return res.status(400).json({
        success: false,
        message: "Submission type must be INDIVIDUAL or GROUP",
      });
    }

    const parsedCourseId =
      courseId == null || courseId === "" ? null : Number(courseId);
    if (
      parsedCourseId !== null &&
      (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID" });
    }

    if (!assignToAll && (!Array.isArray(groupIds) || groupIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Select at least one group",
      });
    }

    const assignment = await prisma.$transaction(async (tx) => {
      if (parsedCourseId) {
        const course = await tx.course.findFirst({
          where: { id: parsedCourseId, professorId: req.user.id },
          select: { id: true },
        });
        if (!course) throw new Error("COURSE_NOT_FOUND");
      }

      let groups = [];

      if (!assignToAll) {
        const uniqueGroupIds = [...new Set(groupIds.map(Number))];

        if (uniqueGroupIds.some((id) => !Number.isInteger(id) || id <= 0)) {
          throw new Error("INVALID_GROUP_IDS");
        }

        groups = await tx.group.findMany({
          where: {
            id: { in: uniqueGroupIds },
            ...(parsedCourseId
              ? {
                  members: {
                    some: {
                      enrollments: { some: { courseId: parsedCourseId } },
                    },
                  },
                }
              : {}),
          },
          select: { id: true },
        });

        if (groups.length !== uniqueGroupIds.length) {
          throw new Error(
            parsedCourseId ? "GROUP_NOT_IN_COURSE" : "GROUP_NOT_FOUND",
          );
        }
      }

      return tx.assignment.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          oneDriveUrl,
          dueDate: parsedDueDate,
          assignToAll,
          submissionType,
          courseId: parsedCourseId,
          professorId: req.user.id,
          groups: {
            create: groups.map((group) => ({
              groupId: group.id,
            })),
          },
        },
        include: {
          course: { select: { id: true, name: true, code: true } },
          groups: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    console.error("Create assignment error:", error);

    if (error.message === "INVALID_GROUP_IDS") {
      return res.status(400).json({
        success: false,
        message: "Invalid group IDs",
      });
    }

    if (error.message === "COURSE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Course not found or not owned by this professor",
      });
    }

    if (error.message === "GROUP_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "One or more selected groups were not found",
      });
    }

    if (error.message === "GROUP_NOT_IN_COURSE") {
      return res.status(400).json({
        success: false,
        message: "Selected groups must have enrolled students in this course",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create assignment",
    });
  }
};

const editAssignment = async (req, res) => {
  try {
    const assignmentId = Number(req.params.id);

    const {
      title,
      description,
      oneDriveUrl,
      dueDate,
      assignToAll,
      groupIds,
      courseId,
      submissionType = "INDIVIDUAL",
    } = req.body;

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    if (
      !title?.trim() ||
      !description?.trim() ||
      !oneDriveUrl ||
      !dueDate ||
      typeof assignToAll !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "All assignment fields are required",
      });
    }

    if (!["INDIVIDUAL", "GROUP"].includes(submissionType)) {
      return res.status(400).json({
        success: false,
        message: "Submission type must be INDIVIDUAL or GROUP",
      });
    }

    const parsedCourseId =
      courseId == null || courseId === "" ? null : Number(courseId);
    if (
      parsedCourseId !== null &&
      (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID" });
    }

    // Validate OneDrive URL
    try {
      const url = new URL(oneDriveUrl);

      if (
        url.protocol !== "https:" ||
        !["1drv.ms", "onedrive.live.com", "sharepoint.com"].some(
          (domain) =>
            url.hostname === domain || url.hostname.endsWith(`.${domain}`),
        )
      ) {
        throw new Error("Invalid URL");
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid OneDrive URL",
      });
    }

    const parsedDueDate = new Date(dueDate);

    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date",
      });
    }

    if (!assignToAll && (!Array.isArray(groupIds) || groupIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Select at least one group",
      });
    }

    const assignment = await prisma.$transaction(async (tx) => {
      // Only the professor who created it can edit it
      const existing = await tx.assignment.findFirst({
        where: {
          id: assignmentId,
          professorId: req.user.id,
        },
      });

      if (!existing) {
        return null;
      }

      if (parsedCourseId) {
        const course = await tx.course.findFirst({
          where: { id: parsedCourseId, professorId: req.user.id },
          select: { id: true },
        });
        if (!course) throw new Error("COURSE_NOT_FOUND");
      }

      let uniqueGroupIds = [];

      if (!assignToAll) {
        uniqueGroupIds = [...new Set(groupIds.map(Number))];

        if (uniqueGroupIds.some((id) => !Number.isInteger(id) || id <= 0)) {
          throw new Error("INVALID_GROUP_IDS");
        }

        const groups = await tx.group.findMany({
          where: {
            id: { in: uniqueGroupIds },
            ...(parsedCourseId
              ? {
                  members: {
                    some: {
                      enrollments: { some: { courseId: parsedCourseId } },
                    },
                  },
                }
              : {}),
          },
          select: { id: true },
        });

        if (groups.length !== uniqueGroupIds.length) {
          throw new Error(
            parsedCourseId ? "GROUP_NOT_IN_COURSE" : "GROUP_NOT_FOUND",
          );
        }
      }

      return tx.assignment.update({
        where: { id: assignmentId },
        data: {
          title: title.trim(),
          description: description.trim(),
          oneDriveUrl,
          dueDate: parsedDueDate,
          assignToAll,
          submissionType,
          courseId: parsedCourseId,
          groups: {
            deleteMany: {},
            create: uniqueGroupIds.map((groupId) => ({
              groupId,
            })),
          },
        },
        include: {
          course: { select: { id: true, name: true, code: true } },
          groups: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    console.error("Edit assignment error:", error);

    if (error.message === "INVALID_GROUP_IDS") {
      return res.status(400).json({
        success: false,
        message: "Invalid group IDs",
      });
    }

    if (error.message === "COURSE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Course not found or not owned by this professor",
      });
    }

    if (error.message === "GROUP_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "One or more selected groups were not found",
      });
    }

    if (error.message === "GROUP_NOT_IN_COURSE") {
      return res.status(400).json({
        success: false,
        message: "Selected groups must have enrolled students in this course",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update assignment",
    });
  }
};
const getAllAssignments = async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        professorId: req.user.id,
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
        groups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            confirmations: true,
            groupSubmissions: true,
          },
        },
        confirmations: {
          where: { confirmed: true },
          select: { id: true },
        },
        groupSubmissions: {
          where: { confirmed: true },
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get assignments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve assignments",
    });
  }
};
const getStudentAssignments = async (req, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { groupId: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          { assignToAll: true },
          ...(student.groupId
            ? [{ groups: { some: { groupId: student.groupId } } }]
            : []),
        ],
      },
      include: {
        groups: {
          include: {
            group: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { confirmations: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get student assignments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
    });
  }
};

const startSubmissionConfirmation = async (req, res) => {
  try {
    const assignmentId = Number(req.params.id);
    const studentId = req.user.id;

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { groupId: true },
    });

    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        OR: [
          { assignToAll: true },
          ...(student?.groupId
            ? [{ groups: { some: { groupId: student.groupId } } }]
            : []),
        ],
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found or not assigned to you",
      });
    }

    const existing = await prisma.submissionConfirmation.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });

    if (existing?.confirmed) {
      return res.status(409).json({
        success: false,
        message: "Submission already confirmed",
      });
    }

    const confirmation = await prisma.submissionConfirmation.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      update: {},
      create: {
        assignmentId,
        studentId,
        confirmed: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Submission confirmation started. Please confirm to complete.",
      confirmation,
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
    const studentId = req.user.id;

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const confirmation = await prisma.submissionConfirmation.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });

    if (!confirmation) {
      return res.status(400).json({
        success: false,
        message: "Please start the submission confirmation first",
      });
    }

    if (confirmation.confirmed) {
      return res.status(409).json({
        success: false,
        message: "Submission already confirmed",
      });
    }

    const updatedConfirmation = await prisma.submissionConfirmation.update({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      data: {
        confirmed: true,
        confirmedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Submission confirmed successfully",
      confirmation: updatedConfirmation,
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
    const studentId = req.user.id;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { groupId: true },
    });

    if (!student || !student.groupId) {
      return res.status(404).json({
        success: false,
        message: "You are not part of any group",
      });
    }

    const group = await prisma.group.findUnique({
      where: { id: student.groupId },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            studentId: true,
            confirmations: {
              where: {
                confirmed: true,
              },
              select: {
                assignmentId: true,
              },
            },
          },
        },
      },
    });

    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          { assignToAll: true },
          { groups: { some: { groupId: student.groupId } } },
        ],
      },
      select: { id: true, title: true },
    });

    const totalTasks = assignments.length * group.members.length;

    const completedTasks = group.members.reduce(
      (total, member) =>
        total +
        member.confirmations.filter((confirmation) =>
          assignments.some(
            (assignment) => assignment.id === confirmation.assignmentId,
          ),
        ).length,
      0,
    );

    const progressPercentage =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return res.status(200).json({
      success: true,
      groupName: group.name,
      totalMembers: group.members.length,
      totalAssignments: assignments.length,
      completedTasks,
      totalTasks,
      progressPercentage,
      members: group.members.map((member) => ({
        id: member.id,
        name: member.name,
        studentId: member.studentId,
        completedAssignments: member.confirmations.filter((confirmation) =>
          assignments.some(
            (assignment) => assignment.id === confirmation.assignmentId,
          ),
        ).length,
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
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        professorId: req.user.id,
      },
      include: {
        groups: {
          select: {
            groupId: true,
            group: {
              select: { id: true, name: true },
            },
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

    const groupIds = assignment.groups.map((item) => item.groupId);

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...(assignment.assignToAll ? {} : { groupId: { in: groupIds } }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        group: {
          select: { id: true, name: true },
        },
        confirmations: {
          where: { assignmentId },
          select: {
            confirmed: true,
            confirmedAt: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const studentStatus = students.map((student) => {
      const confirmation = student.confirmations[0];

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        group: student.group,
        status: !confirmation
          ? "NOT_STARTED"
          : confirmation.confirmed
            ? "CONFIRMED"
            : "PENDING",
        confirmedAt: confirmation?.confirmedAt || null,
      };
    });

    const groupMap = {};

    studentStatus.forEach((student) => {
      const groupId = student.group?.id ?? "no-group";
      const groupName = student.group?.name ?? "No Group";

      if (!groupMap[groupId]) {
        groupMap[groupId] = {
          groupId,
          groupName,
          totalStudents: 0,
          confirmedStudents: 0,
        };
      }

      groupMap[groupId].totalStudents++;

      if (student.status === "CONFIRMED") {
        groupMap[groupId].confirmedStudents++;
      }
    });

    const confirmedCount = studentStatus.filter(
      (student) => student.status === "CONFIRMED",
    ).length;

    return res.status(200).json({
      success: true,
      assignment: {
        id: assignment.id,
        title: assignment.title,
      },
      summary: {
        totalStudents: studentStatus.length,
        confirmed: confirmedCount,
        pending: studentStatus.filter((student) => student.status === "PENDING")
          .length,
        notStarted: studentStatus.filter(
          (student) => student.status === "NOT_STARTED",
        ).length,
      },
      groupSummary: Object.values(groupMap),
      students: studentStatus,
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
    const professorId = req.user.id;

    const assignments = await prisma.assignment.findMany({
      where: { professorId },
      include: {
        groups: {
          select: { groupId: true },
        },
        _count: {
          select: { confirmations: true },
        },
        confirmations: {
          where: { confirmed: true },
          select: { studentId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalStudents = await prisma.user.count({
      where: { role: "STUDENT" },
    });
    const assignmentAnalytics = await Promise.all(
      assignments.map(async (assignment) => {
        const eligibleStudents = await prisma.user.findMany({
          where: {
            role: "STUDENT",
            ...(assignment.assignToAll
              ? {}
              : {
                  groupId: {
                    in: assignment.groups.map((group) => group.groupId),
                  },
                }),
          },
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true,
          },
          orderBy: {
            name: "asc",
          },
        });

        const confirmedRecords = await prisma.submissionConfirmation.findMany({
          where: {
            assignmentId: assignment.id,
            confirmed: true,
          },
          select: {
            studentId: true,
            confirmedAt: true,
          },
        });

        const confirmationMap = new Map(
          confirmedRecords.map((record) => [
            record.studentId,
            record.confirmedAt,
          ]),
        );

        const studentSubmissions = eligibleStudents.map((student) => {
          const confirmedAt = confirmationMap.get(student.id);

          return {
            id: student.id,
            name: student.name,
            studentId: student.studentId,
            email: student.email,
            status: confirmedAt ? "SUBMITTED" : "PENDING",
            confirmedAt: confirmedAt || null,
          };
        });

        const confirmed = confirmedRecords.length;

        return {
          assignmentId: assignment.id,
          title: assignment.title,
          totalStudents: eligibleStudents.length,
          confirmed,
          pending: Math.max(eligibleStudents.length - confirmed, 0),
          completionPercentage:
            eligibleStudents.length === 0
              ? 0
              : Math.round((confirmed / eligibleStudents.length) * 100),
          studentSubmissions,
        };
      }),
    );

    const totalEligible = assignmentAnalytics.reduce(
      (sum, item) => sum + item.totalStudents,
      0,
    );

    const totalConfirmed = assignmentAnalytics.reduce(
      (sum, item) => sum + item.confirmed,
      0,
    );

    return res.status(200).json({
      success: true,
      overview: {
        totalAssignments: assignments.length,
        totalStudents,
        totalEligibleSubmissions: totalEligible,
        totalConfirmed,
        totalPending: Math.max(totalEligible - totalConfirmed, 0),
        completionPercentage:
          totalEligible === 0
            ? 0
            : Math.round((totalConfirmed / totalEligible) * 100),
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
  createAssignment,
  editAssignment,
  getAllAssignments,
  getStudentAssignments,
  startSubmissionConfirmation,
  confirmSubmission,
  getGroupProgress,
  getAssignmentSubmissionStatus,
  getProfessorAnalytics,
};
