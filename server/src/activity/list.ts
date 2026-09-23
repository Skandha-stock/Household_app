import { Router } from "express";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required.",
        });
      }

      // Get households the user currently belongs to
      const memberships = await prisma.householdMember.findMany({
        where: {
          userId: req.user.userId,
          leftAt: null,
        },
        select: {
          householdId: true,
        },
      });

      if (memberships.length === 0) {
        return res.status(403).json({
          message: "You are not a member of any household.",
        });
      }

      const activities = await prisma.activity.findMany({
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          name: true,
          icon: true,
        },
      });

      return res.json({
        activities,
      });
    } catch (error) {
      console.error("Get activities error:", error);

      return res.status(500).json({
        message: "Unable to get activities.",
      });
    }
  }
);

export default router;