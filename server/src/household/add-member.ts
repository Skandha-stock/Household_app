import { Router } from "express";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.post(
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
      const { loginId } = req.body;

      if (!Number.isInteger(householdId)) {
        return res.status(400).json({
          message: "Invalid household ID.",
        });
      }

      if (!loginId || typeof loginId !== "string") {
        return res.status(400).json({
          message: "Login ID is required.",
        });
      }

      // Check that the logged-in user is an ADMIN
      const adminMembership = await prisma.householdMember.findFirst({
        where: {
          householdId,
          userId: req.user.userId,
          role: "ADMIN",
          leftAt: null,
        },
      });

      if (!adminMembership) {
        return res.status(403).json({
          message: "Only a household admin can add members.",
        });
      }

      // Find the user being added
      const user = await prisma.user.findUnique({
        where: {
          loginId: loginId.trim().toUpperCase(),
        },
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      // Prevent adding yourself
      if (user.id === req.user.userId) {
        return res.status(400).json({
          message: "You are already a member of this household.",
        });
      }

      // Check whether the user is already a member
      const existingMembership =
        await prisma.householdMember.findUnique({
          where: {
            householdId_userId: {
              householdId,
              userId: user.id,
            },
          },
        });

      if (existingMembership && existingMembership.leftAt === null) {
        return res.status(409).json({
          message: "User is already a member of this household.",
        });
      }

      // Add the user
      const membership = await prisma.householdMember.create({
        data: {
          householdId,
          userId: user.id,
          role: "MEMBER",
        },
        include: {
          user: {
            select: {
              id: true,
              loginId: true,
              name: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Member added successfully.",
        member: membership,
      });
    } catch (error) {
      console.error("Add member error:", error);

      return res.status(500).json({
        message: "Unable to add member.",
      });
    }
  }
);

export default router;