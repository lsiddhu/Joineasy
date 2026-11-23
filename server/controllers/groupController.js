const prisma = require("../config/db");
const crypto = require("crypto");

// Create a new group
const createGroup = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate group name
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    const studentId = req.user.id;

    // Check whether student already belongs to a group
    const existingStudent = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (existingStudent.groupId) {
      return res.status(409).json({
        success: false,
        message: "You already belong to a group",
      });
    }

    // Generate unique invite code
    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Create group and add creator as leader and first member
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        inviteCode,
        leader: {
          connect: { id: studentId },
        },
        members: {
          connect: { id: studentId },
        },
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            studentId: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    console.error("Create group error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create group",
    });
  }
};
// Join an existing group
const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const studentId = req.user.id;

    // Validate invite code
    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invite code is required",
      });
    }

    const normalizedCode = inviteCode.trim().toUpperCase();

    const result = await prisma.$transaction(
      async (tx) => {
        // Check whether student exists
        const student = await tx.user.findUnique({
          where: { id: studentId },
        });

        if (!student || student.role !== "STUDENT") {
          return {
            status: 404,
            body: {
              success: false,
              message: "Student not found",
            },
          };
        }

        // Check whether student already belongs to a group
        if (student.groupId) {
          return {
            status: 409,
            body: {
              success: false,
              message: "You already belong to a group",
            },
          };
        }

        // Find group using invite code
        const group = await tx.group.findUnique({
          where: { inviteCode: normalizedCode },
          include: {
            _count: {
              select: { members: true },
            },
          },
        });

        if (!group) {
          return {
            status: 404,
            body: {
              success: false,
              message: "Invalid invite code",
            },
          };
        }

        // Check group capacity
        if (group._count.members >= 4) {
          return {
            status: 409,
            body: {
              success: false,
              message: "This group is already full",
            },
          };
        }

        // Add student to group
        await tx.user.update({
          where: { id: studentId },
          data: { groupId: group.id },
        });

        // Get updated group details
        const updatedGroup = await tx.group.findUnique({
          where: { id: group.id },
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
              },
            },
            members: {
              select: {
                id: true,
                name: true,
                studentId: true,
              },
            },
          },
        });

        return {
          status: 200,
          body: {
            success: true,
            message: "Successfully joined the group",
            group: updatedGroup,
          },
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Join group error:", error);

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "Group membership changed simultaneously. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to join group",
    });
  }
};

// Get current student's group details
const getMyGroup = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        groupId: true,
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!student.groupId) {
      return res.status(404).json({
        success: false,
        message: "You are not a member of any group",
      });
    }

    const group = await prisma.group.findUnique({
      where: { id: student.groupId },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Group details retrieved successfully",
      group: {
        ...group,
        totalMembers: group._count.members,
        availableSlots: 4 - group._count.members,
      },
    });
  } catch (error) {
    console.error("Get group error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve group details",
    });
  }
};

const addMember = async (req, res) => {
  try {
    const { email, studentId: targetStudentId } = req.body;
    const leaderId = req.user.id;

    // Require exactly one identifier
    if (
      (!email && !targetStudentId) ||
      (email && targetStudentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide either student email or student ID",
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Find the requesting student's group
        const leader = await tx.user.findUnique({
          where: { id: leaderId },
          select: { groupId: true },
        });

        if (!leader || !leader.groupId) {
          return {
            status: 404,
            body: {
              success: false,
              message: "You do not belong to any group",
            },
          };
        }

        const group = await tx.group.findUnique({
          where: { id: leader.groupId },
          select: {
            id: true,
            leaderId: true,
            _count: {
              select: { members: true },
            },
          },
        });

        // Only the group leader can add members
        if (!group || group.leaderId !== leaderId) {
          return {
            status: 403,
            body: {
              success: false,
              message: "Only the group leader can add members",
            },
          };
        }

        // Find student by email or student ID
        const newStudent = email
          ? await tx.user.findUnique({
              where: { email: email.trim().toLowerCase() },
            })
          : await tx.user.findUnique({
              where: { studentId: targetStudentId.trim() },
            });

        if (!newStudent || newStudent.role !== "STUDENT") {
          return {
            status: 404,
            body: {
              success: false,
              message: "Student not found",
            },
          };
        }

        if (newStudent.groupId) {
          return {
            status: 409,
            body: {
              success: false,
              message: "This student already belongs to a group",
            },
          };
        }

        // Check group capacity
        if (group._count.members >= 4) {
          return {
            status: 409,
            body: {
              success: false,
              message: "Your group is already full",
            },
          };
        }

        // Add student to the group
        await tx.user.update({
          where: { id: newStudent.id },
          data: { groupId: group.id },
        });

        const updatedGroup = await tx.group.findUnique({
          where: { id: group.id },
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
              },
            },
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
              },
            },
            _count: {
              select: { members: true },
            },
          },
        });

        return {
          status: 200,
          body: {
            success: true,
            message: "Student added to group successfully",
            group: {
              ...updatedGroup,
              totalMembers: updatedGroup._count.members,
              availableSlots: 4 - updatedGroup._count.members,
            },
          },
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Add member error:", error);

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "Group membership changed simultaneously. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add student",
    });
  }
};


module.exports = { createGroup, joinGroup, getMyGroup, addMember };