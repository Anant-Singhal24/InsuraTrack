require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Initialize Express
const app = express();

// Connect to Database
connectDB();

// CORS Configuration
const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:3001";
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json()); // uses to tell we work with json data

// Routes imports
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const agentRoutes = require("./routes/agent.routes");
const customerRoutes = require("./routes/customer.routes");
const policyRoutes = require("./routes/policy.routes");
const messageRoutes = require("./routes/message.routes");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/messages", messageRoutes);

// Root Route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to InsuraTrack API" });
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  // console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
