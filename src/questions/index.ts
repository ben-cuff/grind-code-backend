import express from "express";

const router = express.Router();

import prisma from "@/db";

router.get("/", async (_req, res) => {
    try {
        const questions = await prisma.question.findMany();

        if (!questions) {
            res.status(404).json({
                error: "No questions found",
            });
        }

        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server error occurred: " + error,
        });
    }
});

router.get("/:questionNumber", async (req, res) => {
    try {
        const { questionNumber } = req.params;

        if (!questionNumber) {
            res.status(400).json({
                error: "Missing questionNumber from path",
            });
        }

        const user = await prisma.question.findUnique({
            where: { questionNumber: Number(questionNumber) },
        });

        if (!user) {
            res.status(404).json({
                error: "User with that questionNumber does not exist",
            });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server occurred: " + error,
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: "Missing id from path" });
        }

        const user = await prisma.question.findUnique({
            where: { id },
        });

        if (!user) {
            res.status(404).json({ error: "User with that id does not exist" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server occurred: " + error,
        });
    }
});

router.get("/random-question", async (req, res) => {
    try {
        const questions = await prisma.question.findMany();

        if (!questions) {
            res.status(404).json({
                error: "No questions found",
            });
        }

        const randomIndex = Math.floor(Math.random() * questions.length);
        const randomQuestion = questions[randomIndex];

        res.status(200).json(randomQuestion);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server occurred: " + error,
        });
    }
});

router.post("/:questionNumber", async (req, res) => {
    try {
        const { urlSolution, solutionRoute, urlQuestion, prompt } = req.body;
        const { questionNumber } = req.params;

        if (!urlSolution || !solutionRoute || !urlQuestion || !prompt) {
            res.status(400).json({ error: "Missing attributes in body" });
        }
        if (!questionNumber) {
            res.status(400).json({ error: "Missing questionNumber from path" });
        }

        let newQuestion;
        try {
            newQuestion = await prisma.question.create({
                data: {
                    questionNumber: Number(questionNumber),
                    urlSolution,
                    solutionRoute,
                    urlQuestion,
                    prompt,
                },
            });
        } catch {
            res.status(409).json({
                error: "A question with that questionNumber already exists",
            });
        }

        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server occurred: " + error,
        });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!Object.keys(updateData).length) {
            res.status(400).json({ error: "No data provided for update" });
        }

        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: updateData,
        });

        res.status(200).json(updatedQuestion);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server occurred: " + error,
        });
    }
});

router.patch("/:questionNumber", async (req, res) => {
    try {
        const { questionNumber } = req.params;
        const updateData = req.body;

        if (!Object.keys(updateData).length) {
            res.status(400).json({ error: "No data provided for update" });
        }

        const updatedQuestion = await prisma.question.update({
            where: { questionNumber: Number(questionNumber) },
            data: updateData,
        });

        res.status(200).json(updatedQuestion);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server occurred: " + error,
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: "Missing id from path" });
        }
        try {
            await prisma.question.delete({
                where: {
                    id,
                },
            });
        } catch {
            res.status(400).json({ error: "That question does not exist" });
        }

        res.status(200).json({ message: "Question successfully deleted" });
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server occurred: " + error,
        });
    }
});

router.delete("/:questionNumber", async (req, res) => {
    try {
        const { questionNumber } = req.params;

        if (!questionNumber) {
            res.status(400).json({ error: "Missing questionNumber from path" });
        }
        try {
            await prisma.question.delete({
                where: {
                    questionNumber: Number(questionNumber),
                },
            });
        } catch {
            res.status(400).json({ error: "That question does not exist" });
        }

        res.status(200).json({ message: "Question successfully deleted" });
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server occurred: " + error,
        });
    }
});

export default router;
