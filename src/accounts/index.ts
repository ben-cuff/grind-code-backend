import { clerkClient, ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import express from "express";
import { prisma } from "..";

declare global {
    namespace Express {
        interface Request {
            auth?: { userId: string };
        }
    }
}

const router = express.Router();

router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await prisma.account.findUnique({
            where: { id: userId },
        });

        if (!user) {
            res.status(404).json({
                error: "A user with that userId was not found",
            });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            error: "A unexpected server error occurred: " + error,
        });
    }
});

router.post("/", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
        }

        const user = await clerkClient.users.getUser(userId || "");

        const email = user.emailAddresses[0]?.emailAddress;

        if (!userId || !email) {
            res.status(400).json({ error: "userId and email are required" });
        }
        let newAccount;
        try {
            newAccount = await prisma.account.create({
                data: {
                    id: userId!,
                    email: email ?? "",
                },
            });
        } catch {
            await prisma.account.update({
                where: {
                    id: userId!,
                },
                data: {
                    lastLogin: new Date(),
                },
            });
            res.status(409).json({
                error: "Account with email or already exists",
            });
        }

        res.status(201).json(newAccount);
    } catch (error) {
        res.status(500).json({
            error: "A unexpected server error occurred: " + error,
        });
    }
});

router.delete("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        try {
            await prisma.account.delete({
                where: {
                    id: userId,
                },
            });
        } catch {
            res.status(400).json({ error: "That account does not exist" });
        }

        res.status(200).json({ message: "Account successfully deleted" });
    } catch (error) {
        res.status(500).json({
            error: "A unexpected server error occurred: " + error,
        });
    }
});

export default router;
