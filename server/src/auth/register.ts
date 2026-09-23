import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

const router = Router();


function generateLoginId(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, "").toUpperCase();

  const prefix = cleanName.substring(0, 4).padEnd(4, "X");

  const number = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}${number}`;
}

router.post("/register", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        message: "Name and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    let loginId = generateLoginId(name);

    while (await prisma.user.findUnique({ where: { loginId } })) {
      loginId = generateLoginId(name);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        loginId,
        passwordHash,
      },
    });

    return res.status(201).json({
      message: "User created successfully.",
      user: {
        id: user.id,
        loginId: user.loginId,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Unable to create user.",
    });
  }
});

export default router;