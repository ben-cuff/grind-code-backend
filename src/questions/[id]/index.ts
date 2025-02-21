import express from "express";

const router = express.Router();

import prisma from "@/db";

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: "Missing id from path" });
            return;
        }

        const question = await prisma.question.findUnique({
            where: { id },
        });

        if (!question) {
            res.status(404).json({
                error: "Question with that id does not exist",
            });
            return;
        }

        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server error occurred: " + error,
        });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!Object.keys(updateData).length) {
            res.status(400).json({ error: "No data provided for update" });
            return;
        }

        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: updateData,
        });

        res.status(200).json(updatedQuestion);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server error occurred: " + error,
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: "Missing id from path" });
            return;
        }
        try {
            await prisma.question.delete({
                where: {
                    id,
                },
            });
        } catch {
            res.status(400).json({ error: "That question does not exist" });
            return;
        }

        res.status(200).json({ message: "Question successfully deleted" });
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server error occurred: " + error,
        });
    }
});

export default router;
