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

        const interviews = await prisma.interview.findMany({
            where: { userId },
        });
        res.status(200).json(interviews);
    } catch (error) {
        res.status(500).json({
            error: "An unspecified server error occurred: " + error,
        });
    }
});

router.get("/:interviewId", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { interviewId } = req.params;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) {
            res.status(404).json({ error: "Interview not found" });
            return;
        }

        if (interview.userId !== userId) {
            res.status(403).json({ error: "Unauthorized" });
            return;
        }

        const questionDetails = await prisma.question.findUnique({
            where: { questionNumber: interview.questionNumber },
        });

        const solutionResponse = await fetch(
            `${process.env.BASE_URL}/solutions?questionNumber=${interview.questionNumber}`
        );
        const solution = await solutionResponse.json();

        res.status(200).json({ interview, questionDetails, solution });
    } catch (error) {
        res.status(500).json({
            error: "An unspecified server error occurred: " + error,
        });
    }
});

router.post("/:interviewId", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        const { interviewId } = req.params;

        if (!interviewId) {
            res.status(400).json({ error: "Missing interviewId" });
            return;
        }

        const { messages, questionNumber } = req.body;

        if (!messages || !questionNumber) {
            res.status(400).json({ error: "Missing body parameters" });
            return;
        }

        const question = await prisma.question.findUnique({
            where: { questionNumber: questionNumber },
        });

        if (!question) {
            res.status(404).json({ error: "Question not found" });
            return;
        }

        const interview = await prisma.interview.findUnique({
            where: {
                id: interviewId,
            },
        });

        if (interview) {
            const updatedInterview = await prisma.interview.update({
                where: {
                    id: interviewId,
                },
                data: {
                    messages: messages,
                    questionNumber: questionNumber,
                },
            });
            res.status(200).json(updatedInterview);
            return;
        }

        const newInterview = await prisma.interview.create({
            data: {
                id: interviewId,
                userId,
                messages,
                questionNumber,
            },
        });

        res.status(201).json(newInterview);

        fetch(`${process.env.BASE_URL}/usage/increment`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: req.headers.authorization || "",
            },
            body: JSON.stringify({
                type: "interviewUsage",
            }),
        });
    } catch (error) {
        res.status(500).json({
            error: "An unspecified server error occurred: " + error,
        });
    }
});

router.patch(
    "/:interviewId/feedback",
    ClerkExpressWithAuth(),
    async (req, res) => {
        try {
            const userId = req.auth?.userId;
            const { interviewId } = req.params;
            const { feedback } = req.body;

            if (!userId) {
                res.status(401).json({ error: "Missing Auth" });
                return;
            }

            if (!feedback) {
                res.status(400).json({ error: "Missing feedback" });
                return;
            }

            const interview = await prisma.interview.findUnique({
                where: { id: interviewId },
            });

            if (!interview) {
                res.status(404).json({ error: "Interview not found" });
                return;
            }

            if (interview.userId !== userId) {
                res.status(403).json({ error: "Unauthorized" });
                return;
            }

            const updatedInterview = await prisma.interview.update({
                where: { id: interviewId },
                data: {
                    feedback: feedback.message,
                    completed: true,
                },
            });

            res.status(200).json(updatedInterview);
        } catch (error) {
            res.status(500).json({
                error: "An unspecified server error occurred: " + error,
            });
        }
    }
);

router.delete("/:interviewId", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { interviewId } = req.params;

        if (!userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) {
            res.status(404).json({ error: "Interview not found" });
            return;
        }

        if (interview.userId !== userId) {
            res.status(403).json({ error: "Unauthorized" });
            return;
        }

        await prisma.interview.delete({
            where: { id: interviewId },
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            error: "An unspecified server error occurred: " + error,
        });
    }
});

router.delete("/user/:userId", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const authUserId = req.auth?.userId;
        const { userId } = req.params;

        if (!authUserId || authUserId !== userId) {
            res.status(403).json({ error: "Unauthorized" });
            return;
        }

        await prisma.interview.deleteMany({
            where: { userId },
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            error: "An unspecified server error occurred: " + error,
        });
    }
});

export default router;
