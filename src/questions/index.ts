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
            error: "An unexpect server occurred: " + error,
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.question.findUnique({
            where: { id },
        });

        if (!user) {
            res.status(404).json({ error: "User with that id does not exist" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            error: "An unexpect server occurred: " + error,
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
            error: "An unexpect server occurred: " + error,
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
            error: "An unexpect server occurred: " + error,
        });
    }
});

export default router;
