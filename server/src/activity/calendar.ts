import { Router } from "express";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.get(
  "/calendar/:householdId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required.",
        });
      }

      const householdId = Number(req.params.householdId);
      const { date } = req.query;

      if (!Number.isInteger(householdId)) {
        return res.status(400).json({
          message: "Invalid household ID.",
        });
      }

      if (typeof date !== "string" || !date) {
        return res.status(400).json({
          message: "Date is required.",
        });
      }

      // Check household membership
      const membership = await prisma.householdMember.findFirst({
        where: {
          householdId,
          userId: req.user.userId,
          leftAt: null,
        },
      });

      if (!membership) {
        return res.status(403).json({
          message: "You are not a member of this household.",
        });
      }

      const startDate = new Date(`${date}T00:00:00.000Z`);

      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date.",
        });
      }

      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 1);

      const completions = await prisma.activityCompletion.findMany({
        where: {
          householdId,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        orderBy: {
          completedAt: "asc",
        },
        select: {
          id: true,
          date: true,
          completedAt: true,
          activity: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
          user: {
            select: {
              id: true,
              loginId: true,
              name: true,
            },
          },
        },
      });

      return res.json({
        householdId,
        date,
        completions,
      });
    } catch (error) {
      console.error("Get calendar error:", error);

      return res.status(500).json({
        message: "Unable to get calendar data.",
      });
    }
  }
);

export default router;