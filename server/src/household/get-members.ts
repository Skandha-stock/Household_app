import { Router } from "express";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.get(
  "/:householdId/members",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required.",
        });
      }

      const householdId = Number(req.params.householdId);

      if (!Number.isInteger(householdId)) {
        return res.status(400).json({
          message: "Invalid household ID.",
        });
      }

      // Make sure the logged-in user belongs to this household
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

      const household = await prisma.household.findUnique({
        where: {
          id: householdId,
        },
        select: {
          id: true,
          name: true,
          members: {
            where: {
              leftAt: null,
            },
            orderBy: {
              joinedAt: "asc",
            },
            select: {
              id: true,
              role: true,
              joinedAt: true,
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

      if (!household) {
        return res.status(404).json({
          message: "Household not found.",
        });
      }

      return res.json({
        household,
      });
    } catch (error) {
      console.error("Get household members error:", error);

      return res.status(500).json({
        message: "Unable to get household members.",
      });
    }
  }
);

export default router;