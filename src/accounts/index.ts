import { clerkClient, ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import express from "express";
import { prisma } from "..";

import idAccountRouter from "./[id]/index";

declare global {
    namespace Express {
        interface Request {
            auth?: { userId: string };
        }
    }
}

const router = express.Router();

router.post("/", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        const user = await clerkClient.users.getUser(userId || "");

        const email = user.emailAddresses[0]?.emailAddress;

        if (!userId || !email) {
            res.status(400).json({ error: "userId and email are required" });
            return;
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

router.patch("/premium", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        const currentAccount = await prisma.account.findUnique({
            where: { id: userId },
        });

        const updatedAccount = await prisma.account.update({
            where: { id: userId },
            data: { premium: !currentAccount?.premium },
        });

        res.status(200).json(updatedAccount);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server error occurred: " + error,
        });
    }
});

router.use("/", idAccountRouter);

export default router;
