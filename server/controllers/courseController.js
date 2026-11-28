const crypto = require("crypto");
const prisma = require("../config/db");

const createCourse = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || null;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Course name is required",
      });
    }

    const course = await prisma.course.create({
      data: {
        name,
        description,
        code: crypto.randomBytes(4).toString("hex").toUpperCase(),
        professorId: req.user.id,
      },
      include: {
        _count: {
          select: { students: true, assignments: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};

const listCourses = async (req, res) => {
  try {
    const isProfessor = req.user.role === "PROFESSOR";
    const student = isProfessor
      ? null
      : await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { groupId: true },
        });
    const courses = await prisma.course.findMany({
      where: isProfessor
        ? { professorId: req.user.id }
        : { students: { some: { studentId: req.user.id } } },
      include: {
        professor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { students: true, assignments: true },
        },
        ...(isProfessor
          ? {
              students: {
                select: {
                  student: {
                    select: { id: true, groupId: true },
                  },
                },
              },
              assignments: {
                include: {
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
              },
            }
          : {
              assignments: {
                select: {
                  id: true,
                  assignToAll: true,
                  groups: { select: { groupId: true } },
                },
              },
            }),
      },
      orderBy: { name: "asc" },
    });

    const result = courses.map((course) => {
      if (!isProfessor) {
        const { assignments, ...studentCourse } = course;
        const availableAssignments = assignments.filter(
          (assignment) =>
            assignment.assignToAll ||
            (student?.groupId &&
              assignment.groups.some(
                (item) => item.groupId === student.groupId,
              )),
        );
        return {
          ...studentCourse,
          _count: {
            ...course._count,
            assignments: availableAssignments.length,
          },
        };
      }

      const enrolledStudents = course.students.map((entry) => entry.student);
      let totalEligibleSubmissions = 0;
      let totalConfirmed = 0;

      const assignmentAnalytics = course.assignments.map((assignment) => {
        const groupIds = new Set(assignment.groups.map((item) => item.groupId));
        const eligibleStudents = enrolledStudents.filter(
          (student) =>
            (assignment.assignToAll || groupIds.has(student.groupId)) &&
            (assignment.submissionType !== "GROUP" || student.groupId !== null),
        );
        const confirmedStudentIds = new Set(
          assignment.confirmations.map((item) => item.studentId),
        );
        const confirmedGroupIds = new Set(
          assignment.groupSubmissions.map((item) => item.groupId),
        );
        const confirmed = eligibleStudents.filter((student) =>
          assignment.submissionType === "GROUP"
            ? confirmedGroupIds.has(student.groupId)
            : confirmedStudentIds.has(student.id),
        ).length;

        totalEligibleSubmissions += eligibleStudents.length;
        totalConfirmed += confirmed;

        return {
          assignmentId: assignment.id,
          submissionType: assignment.submissionType,
          eligible: eligibleStudents.length,
          confirmed,
          pending: eligibleStudents.length - confirmed,
        };
      });

      const { students, assignments, ...professorCourse } = course;
      return {
        ...professorCourse,
        analytics: {
          studentCount: enrolledStudents.length,
          assignmentCount: assignments.length,
          totalEligibleSubmissions,
          confirmed: totalConfirmed,
          pending: totalEligibleSubmissions - totalConfirmed,
          completionPercentage: totalEligibleSubmissions
            ? Math.round((totalConfirmed / totalEligibleSubmissions) * 100)
            : 0,
          assignments: assignmentAnalytics,
        },
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      courses: result,
    });
  } catch (error) {
    console.error("List courses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
};

const getCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID" });
    }

    const where =
      req.user.role === "PROFESSOR"
        ? { id: courseId, professorId: req.user.id }
        : {
            id: courseId,
            students: { some: { studentId: req.user.id } },
          };
    const course = await prisma.course.findFirst({
      where,
      include: {
        professor: { select: { id: true, name: true } },
        _count: { select: { students: true, assignments: true } },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({ success: true, course });
  } catch (error) {
    console.error("Get course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course",
    });
  }
};

const enrollInCourse = async (req, res) => {
  try {
    const code = req.body.code?.trim().toUpperCase();
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Course code is required",
      });
    }

    const course = await prisma.course.findUnique({ where: { code } });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course code was not found",
      });
    }

    // JWTs contain the user's ID and role, but not their name.
    const student = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true },
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student account was not found",
      });
    }

    const enrollment = await prisma.courseEnrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: course.id,
          studentId: req.user.id,
        },
      },
      update: {},
      create: {
        name: student.name,
        courseId: course.id,
        studentId: req.user.id,
      },
      include: { course: true },
    });

    return res.status(200).json({
      success: true,
      message: "You are enrolled in the course",
      enrollment,
    });
  } catch (error) {
    console.error("Enroll in course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to enroll in course",
    });
  }
};

module.exports = {
  createCourse,
  listCourses,
  getCourse,
  enrollInCourse,
};
