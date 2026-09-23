import { Router } from "express";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required.",
        });
      }

      const { name } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Household name is required.",
        });
      }

      const household = await prisma.household.create({
        data: {
          name: name.trim(),
          members: {
            create: {
              userId: req.user.userId,
              role: "ADMIN",
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  loginId: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return res.status(201).json({
        message: "Household created successfully.",
        household,
      });
    } catch (error) {
      console.error("Create household error:", error);

      return res.status(500).json({
        message: "Unable to create household.",
      });
    }
  }
);

export default router;
