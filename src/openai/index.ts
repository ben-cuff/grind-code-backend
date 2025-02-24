import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { Request, Response, Router } from "express";
import OpenAI from "openai";
import prisma from "../db";

const router = Router();

router.post(
    "/ask-ai",
    ClerkExpressRequireAuth(),
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
                fetch("/usage", {
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
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({
                error: "Failed to generate response, it is likely that your API key is broken or out of credit",
                errorMessage: error,
            });
        }
    }
);

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export default router;
