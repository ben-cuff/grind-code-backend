import express from "express";

const router = express.Router();

import prisma from "@/db";

router.get("/", async (req, res) => {
    if (req.query.questionNumber) {
        const questionNumber = req.query.questionNumber;
        if (!questionNumber) {
            res.status(400).json({
                error: "Missing questionNumber in query",
            });
            return;
        }
        try {
            const question = await prisma.question.findUnique({
                where: { questionNumber: Number(questionNumber) },
            });
            if (!question) {
                res.status(404).json({
                    error: "Question with that questionNumber does not exist",
                });
                return;
            }
            res.status(200).json(question);
        } catch (error) {
            res.status(500).json({
                error: "An unexpected server error occurred: " + error,
            });
        }
    } else {
        try {
            const questions = await prisma.question.findMany();
            if (!questions) {
                res.status(404).json({
                    error: "No questions found",
                });
                return;
            }
            res.status(200).json(questions);
        } catch (error) {
            res.status(500).json({
                error: "An unexpected server error occurred: " + error,
            });
        }
    }
});

router.get("/random-question", async (_req, res) => {
    try {
        const questions = await prisma.question.findMany();

        if (!questions) {
            res.status(404).json({
                error: "No questions found",
            });
            return;
        }

        const randomIndex = Math.floor(Math.random() * questions.length);
        const randomQuestion = questions[randomIndex];

        res.status(200).json(randomQuestion);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server error occurred: " + error,
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: "Missing id from path" });
            return;
        }

        const user = await prisma.question.findUnique({
            where: { id },
        });

        if (!user) {
            res.status(404).json({ error: "User with that id does not exist" });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server error occurred: " + error,
        });
    }
});

router.post("/:questionNumber", async (req, res) => {
    try {
        const { urlSolution, solutionRoute, urlQuestion, prompt, pattern } =
            req.body;
        const { questionNumber } = req.params;

        if (
            !urlSolution ||
            !solutionRoute ||
            !urlQuestion ||
            !prompt ||
            !pattern
        ) {
            res.status(400).json({ error: "Missing attributes in body" });
            return;
        }

        if (!allowedPatterns.has(pattern)) {
            res.status(400).json({ error: "Invalid pattern provided" });
            return;
        }
        if (!questionNumber) {
            res.status(400).json({ error: "Missing questionNumber from path" });
            return;
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
                    pattern,
                },
            });
        } catch {
            res.status(409).json({
                error: "A question with that questionNumber already exists",
            });
            return;
        }

        res.status(201).json(newQuestion);
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

router.patch("/", async (req, res) => {
    try {
        const questionNumber = req.query.questionNumber;
        const updateData = req.body;

        if (!questionNumber) {
            res.status(400).json({ error: "Missing questionNumber in query" });
            return;
        }
        if (!Object.keys(updateData).length) {
            res.status(400).json({ error: "No data provided for update" });
            return;
        }

        const updatedQuestion = await prisma.question.update({
            where: { questionNumber: Number(questionNumber) },
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

router.delete("/", async (req, res) => {
    try {
        const questionNumber = req.query.questionNumber;
        if (!questionNumber) {
            res.status(400).json({ error: "Missing questionNumber in query" });
            return;
        }
        try {
            await prisma.question.delete({
                where: {
                    questionNumber: Number(questionNumber),
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

type AlgorithmPattern =
    | "slidingWindow"
    | "twoPointer"
    | "fastSlowPointers"
    | "binarySearch"
    | "heapTopK"
    | "bfs"
    | "dfs"
    | "bitwise"
    | "backtracking"
    | "dynamicProgramming1d"
    | "dynamicProgramming2d"
    | "greedy"
    | "stack"
    | "mergeIntervals"
    | "math"
    | "trees";

const allowedPatterns = new Set<AlgorithmPattern>([
    "slidingWindow",
    "twoPointer",
    "fastSlowPointers",
    "binarySearch",
    "heapTopK",
    "bfs",
    "dfs",
    "bitwise",
    "backtracking",
    "dynamicProgramming1d",
    "dynamicProgramming2d",
    "greedy",
    "stack",
    "mergeIntervals",
    "math",
    "trees",
]);

export type { AlgorithmPattern };

export default router;
