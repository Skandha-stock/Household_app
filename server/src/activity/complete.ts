import { Router } from "express";

import { prisma } from "../lib/prisma";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middleware/auth";

import { getIO  } from "../lib/socket";

const router = Router();

router.post(
  "/:activityId/complete",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;

      const activityId = Number(req.params.activityId);

      const { householdId, date } = req.body;

      if (!householdId || !date) {
        return res.status(400).json({
          message: "householdId and date are required.",
        });
      }

      if (!activityId || Number.isNaN(activityId)) {
        return res.status(400).json({
          message: "Invalid activity ID.",
        });
      }

      const completionDate = new Date(
        `${date}T00:00:00.000Z`
      );

      if (Number.isNaN(completionDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date.",
        });
      }

      const today = new Date();

      today.setUTCHours(
        0,
        0,
        0,
        0
      );

      if (completionDate > today) {
        return res.status(400).json({
          message:
            "Future dates cannot be marked as completed.",
        });
      }

      const membership =
        await prisma.householdMember.findFirst({
          where: {
            householdId: Number(householdId),
            userId,
            leftAt: null,
          },
        });

      if (!membership) {
        return res.status(403).json({
          message:
            "You are not a member of this household.",
        });
      }

      const activity =
        await prisma.activity.findUnique({
          where: {
            id: activityId,
          },
        });

      if (!activity) {
        return res.status(404).json({
          message: "Activity not found.",
        });
      }

      const completion =
        await prisma.activityCompletion.create({
          data: {
            householdId: Number(householdId),
            activityId,
            userId,
            date: completionDate,
          },
          include: {
            activity: true,
            user: {
              select: {
                id: true,
                name: true,
                loginId: true,
              },
            },
          },
        });

      getIO()
        .to(`household:${Number(householdId)}`)
        .emit(
          "activityCompleted",
          completion
        );

      return res.status(201).json({
        message:
          "Activity completed successfully.",
        completion,
      });

    } catch (error: any) {
      console.error(
        "COMPLETE ACTIVITY ERROR:",
        error
      );

      if (error?.code === "P2002") {
        return res.status(409).json({
          message:
            "This activity has already been completed for this date.",
        });
      }

      return res.status(500).json({
        message:
          "Unable to complete activity.",
      });
    }
  }
);

export default router;