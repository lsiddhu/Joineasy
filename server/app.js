const express = require("express");
const cors = require("cors");
const prisma = require("./config/db");

const app = express();
const authRoutes = require("./routes/authRoutes");
const grouppRoutes = require("./routes/groupRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const courseRoutes = require("./routes/courseRoutes");

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/groups", grouppRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/courses", courseRoutes);

// Basic API route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Joineazy API is running 🚀",
  });
});

// Database health-check route
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Database connected successfully",
      database: "joineazy_db",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

module.exports = app;
