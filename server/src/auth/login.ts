import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        message: "Login ID and password are required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        loginId: loginId.trim().toUpperCase(),
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid Login ID or password.",
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid Login ID or password.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        message: "Server authentication configuration error.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        loginId: user.loginId,
      },
      jwtSecret,
      {
        expiresIn: "15m",
      }
    );

    return res.json({
      message: "Login successful.",
      accessToken: token,
      user: {
        id: user.id,
        loginId: user.loginId,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to login.",
    });
  }
});

export default router;