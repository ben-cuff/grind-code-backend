import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import express from "express";
import prisma from "../../../db";

const router = express.Router();

router.get("/", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        const activity = await prisma.activity.findMany({ where: { userId } });

        if (!activity) {
            res.status(404).json({ error: "No activity history found" });
            return;
        }

        res.status(200).json(activity);
    } catch (error) {
        res.status(500).json({
            error: "A unexpected server error occurred: " + error,
        });
    }
});

router.post("/interview", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        const todaysDate = new Date();

        let activity = await prisma.activity.findFirst({
            where: {
                userId,
                date: todaysDate,
            },
        });

        if (!activity) {
            const activity = await prisma.activity.create({
                data: { userId, date: todaysDate, interviewCount: 1 },
            });
            res.status(201).json(activity);
            return;
        }

        activity = await prisma.activity.update({
            where: { id: activity.id },
            data: { interviewCount: activity.interviewCount + 1 },
        });

        res.status(200).json(activity);
    } catch (error) {
        res.status(500).json({
            error: "A unexpected server error occurred: " + error,
        });
    }
});

router.post("/practice", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        const todaysDate = new Date();

        let activity = await prisma.activity.findFirst({
            where: {
                userId,
                date: todaysDate,
            },
        });

        if (!activity) {
            const activity = await prisma.activity.create({
                data: { userId, date: todaysDate, practiceCount: 1 },
            });
            res.status(201).json(activity);
            return;
        }

        activity = await prisma.activity.update({
            where: { id: activity.id },
            data: { practiceCount: activity.practiceCount + 1 },
        });

        res.status(200).json(activity);
    } catch (error) {
        res.status(500).json({
            error: "A unexpected server error occurred: " + error,
        });
    }
});

export default router;
