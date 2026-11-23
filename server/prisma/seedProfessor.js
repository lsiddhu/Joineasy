
require("dotenv").config();

const bcrypt = require("bcryptjs");
const prisma = require("../config/db");

const createProfessor = async () => {
  try {
    const { PROFESSOR_NAME, PROFESSOR_EMAIL, PROFESSOR_PASSWORD } =
      process.env;

    if (!PROFESSOR_NAME || !PROFESSOR_EMAIL || !PROFESSOR_PASSWORD) {
      throw new Error("Professor environment variables are missing");
    }

    if (PROFESSOR_PASSWORD.length < 8) {
      throw new Error("Professor password must be at least 8 characters");
    }

    const email = PROFESSOR_EMAIL.trim().toLowerCase();

    const existingProfessor = await prisma.user.findUnique({
      where: { email },
    });

    if (existingProfessor) {
      if (existingProfessor.role !== "PROFESSOR") {
        throw new Error("This email is already registered as a student");
      }

      console.log("Professor account already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(PROFESSOR_PASSWORD, 12);

    const professor = await prisma.user.create({
      data: {
        name: PROFESSOR_NAME.trim(),
        email,
        password: hashedPassword,
        role: "PROFESSOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log("Professor account created successfully:", professor);
  } catch (error) {
    console.error("Professor creation error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
};

createProfessor();
