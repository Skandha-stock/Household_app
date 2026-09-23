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

      const memberships = await prisma.householdMember.findMany({
        where: {
          userId: req.user.userId,
          leftAt: null,
        },
        orderBy: {
          joinedAt: "asc",
        },
        select: {
          role: true,
          joinedAt: true,
          household: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return res.json({
        households: memberships.map((membership) => ({
          id: membership.household.id,
          name: membership.household.name,
          role: membership.role,
          joinedAt: membership.joinedAt,
        })),
      });
    } catch (error) {
      console.error("Get households error:", error);

      return res.status(500).json({
        message: "Unable to get households.",
      });
    }
  }
);

export default router;