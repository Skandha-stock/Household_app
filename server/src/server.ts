import "dotenv/config";

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import registerRouter from "./auth/register";
import loginRouter from "./auth/login";

import createHouseholdRouter from "./household/create";
import addMemberRouter from "./household/add-member";
import getMembersRouter from "./household/get-members";
import householdListRouter from "./household/list";

import activityListRouter from "./activity/list";
import completeActivityRouter from "./activity/complete";
import calendarRouter from "./activity/calendar";

import {
  authenticateToken,
  AuthenticatedRequest,
} from "./middleware/auth";

import { initializeSocket } from "./lib/socket";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

initializeSocket(io);

const PORT = Number(process.env.PORT) || 3000;


// --------------------------------------------------
// REST API ROUTES
// --------------------------------------------------

app.use(cors());
app.use(express.json());

app.use("/api/auth", registerRouter);
app.use("/api/auth", loginRouter);

app.use("/api/households", createHouseholdRouter);
app.use("/api/households", addMemberRouter);
app.use("/api/households", getMembersRouter);
app.use("/api/households", householdListRouter);

app.use("/api/activities", activityListRouter);
app.use("/api/activities", completeActivityRouter);
app.use("/api/activities", calendarRouter);


// --------------------------------------------------
// PROTECTED TEST
// --------------------------------------------------

app.get(
  "/api/protected-test",
  authenticateToken,
  (req: AuthenticatedRequest, res) => {
    res.json({
      message: "You are authenticated.",
      user: req.user,
    });
  }
);


// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Household API is running",
  });
});


// --------------------------------------------------
// SOCKET.IO
// --------------------------------------------------

io.on("connection", (socket) => {
  console.log(
    `Socket connected: ${socket.id}`
  );

  socket.on("disconnect", () => {
    console.log(
      `Socket disconnected: ${socket.id}`
    );
  });
});


// --------------------------------------------------
// START SERVER
// --------------------------------------------------

httpServer.listen(PORT, () => {
  console.log(
    `Household API running on http://localhost:${PORT}`
  );

  console.log(
    `Socket.IO running on port ${PORT}`
  );
});