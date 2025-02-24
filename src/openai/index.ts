import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { Request, Response, Router } from "express";
import OpenAI from "openai";
import prisma from "../db";

const router = Router();

router.post(
    "/ask-ai",
    ClerkExpressWithAuth(),
    async (req: Request, res: Response) => {
        try {
            const { message } = req.body;

            const userId = req.auth?.userId;

            if (!userId) {
                res.status(401).json({ error: "Missing Auth" });
                return;
            }

            const [user, usageResponse] = await Promise.all([
                prisma.account.findUnique({
                    where: { id: userId },
                }),
                fetch(`${process.env.BASE_URL}/usage`, {
                    method: "GET",
                    headers: {
                        Authorization: req.headers.authorization || "",
                    },
                }),
            ]);

            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            const usage = await usageResponse.json();

            if (!user.premium && usage.askAIUsage > 5) {
                res.status(402).json({ error: "Usage limit exceeded" });
                return;
            }

            if (!message) {
                res.status(400).json({
                    error: "Invalid or missing 'message' field",
                });
            }

            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        content: message,
                        role: "assistant",
                    },
                ],
            });

            res.status(200).json({
                message: response.choices[0]?.message.content,
            });

            fetch(`${process.env.BASE_URL}/usage/increment`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: req.headers.authorization || "",
                },
                body: JSON.stringify({
                    type: "askAIUsage",
                }),
            });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({
                error: "An unspecified server error occurred: " + error,
            });
        }
    }
);

router.post("/stream", async (req, res) => {
    try {
        const { messages } = req.body as { messages: Message[] };

        const userId = req.auth?.userId;

        if (userId) {
            res.status(401).json({ error: "Missing Auth" });
            return;
        }

        const [user, usageResponse] = await Promise.all([
            prisma.account.findUnique({
                where: { id: userId },
            }),
            fetch(`${process.env.BASE_URL}/usage`, {
                method: "GET",
                headers: {
                    Authorization: req.headers.authorization || "",
                },
            }),
        ]);

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        // const usage = await usageResponse.json();

        // if (!user.premium && usage.interviewUsage > 1) {
        //     res.status(402).json({ error: "Usage limit exceeded" });
        //     return;
        // }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: "o3-mini",
            messages,
            stream: true,
        });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");

        for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                res.write(`${content}`);
            }
        }
        res.end();
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "An unspecified server error occurred: " + error,
        });
    }
});

export interface Message {
    role: "user" | "assistant";
    content: string;
}

export default router;
