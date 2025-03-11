import express from "express";
import prisma from "../../db";

import activityRouter from "./activity/index";

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

router.use("/:userid/activity", activityRouter);

export default router;
