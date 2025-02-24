import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { Router } from "express";
import prisma from "../db";

const router = Router();

router.get("/", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        await resetDailyUsage(userId);

        const usage = await prisma.usage.findUnique({
            where: { userId },
        });

        if (!usage) {
            const newUsage = await prisma.usage.create({ data: { userId } });
            res.status(201).json(newUsage);
            return;
        }

        res.status(200).json(usage);
    } catch (error) {
        res.status(500).json({
            error: "An unspecified server error occurred: " + error,
        });
    }
});

router.post("/", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
        }

        try {
            const usage = await prisma.usage.create({
                data: { userId },
            });
            res.status(201).json(usage);
        } catch (error) {
            res.status(409).json({ error: "User already has a usage input" });
        }
    } catch (error) {
        res.status(500).json({
            error: "An unspecified server error occurred: " + error,
        });
    }
});

router.patch("/increment", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        const { type } = req.body;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        if (!type) {
            res.status(400).json({ error: "Missing type field" });
            return;
        }

        await resetDailyUsage(userId);

        const now = new Date();
        const updatedUsage = await prisma.usage.update({
            where: { userId },
            data: {
                [type]: {
                    increment: 1,
                },
                ...(type === "askAIUsage" ? { askAILast: now } : {}),
                ...(type === "interviewUsage" ? { interviewLast: now } : {}),
            },
        });

        res.status(200).json(updatedUsage);
    } catch (error) {
        res.status(500).json({
            error: "An unspecified server error occurred: " + error,
        });
    }
});

async function resetDailyUsage(userId: string): Promise<void> {
    const usage = await prisma.usage.findUnique({ where: { userId } });
    if (!usage) return;

    const now = new Date();
    const lastUpdatedAskAI = new Date(usage.askAILast);
    const lastUpdatedInterview = new Date(usage.interviewLast);

    const isNewDay = (lastDate: Date) =>
        lastDate.getFullYear() !== now.getFullYear() ||
        lastDate.getMonth() !== now.getMonth() ||
        lastDate.getDate() !== now.getDate();

    const updateData: Partial<{
        askAIUsage: number;
        askAILast: Date;
        interviewUsage: number;
        interviewLast: Date;
    }> = {};

    if (isNewDay(lastUpdatedAskAI)) {
        updateData.askAIUsage = 0;
        updateData.askAILast = now;
    }

    if (isNewDay(lastUpdatedInterview)) {
        updateData.interviewUsage = 0;
        updateData.interviewLast = now;
    }

    if (Object.keys(updateData).length > 0) {
        await prisma.usage.update({
            where: { userId },
            data: updateData,
        });
    }
}

export default router;
