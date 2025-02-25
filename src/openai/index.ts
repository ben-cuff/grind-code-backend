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

router.post("/stream", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const { messages, solution } = req.body as {
            messages: Message[];
            solution: string;
        };

        if (solution) {
            messages.unshift({
                role: "assistant",
                content:
                    "You are the interviewer in a technical interview. This is the solution to the problem. use it to guide the user and give better feedback. Solution: " +
                    solution +
                    " Do not every give them the solution to the problem. The user is not required to write any code. Do not give them answers but instead guide them by asking questions like What about edge cases?" +
                    "or what about if X was Y? The solution provided was not given by the user. Instead use the solution given to aid them in giving feedback." +
                    "If their solution is correct then you don't need to give them questions but you can just give feedback or advice." +
                    "If the user asks explicitly for the solution to the problem then you can provide the python solution above but this will be marked against them. " +
                    "If you consider their answers exemplary, then you can say that you are satisfied and end the interview. " +
                    "Don't ask questions to just ask questions either",
            });
        }

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

        if (!user.premium && usage.interviewUsage > 1) {
            res.status(402).json({ error: "Usage limit exceeded" });
            return;
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: "o3-mini",
            messages,
        });

        res.status(200).json({
            message: completion.choices[0]?.message.content,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "An unspecified server error occurred: " + error,
        });
    }
});

// router.post("/stream", ClerkExpressWithAuth(), async (req, res) => {
//     try {
//         const { messages } = req.body as { messages: Message[] };

//         const userId = req.auth?.userId;

//         if (!userId) {
//             res.status(401).json({ error: "Missing Auth" });
//             return;
//         }

//         const [user, usageResponse] = await Promise.all([
//             prisma.account.findUnique({
//                 where: { id: userId },
//             }),
//             fetch(`${process.env.BASE_URL}/usage`, {
//                 method: "GET",
//                 headers: {
//                     Authorization: req.headers.authorization || "",
//                 },
//             }),
//         ]);

//         if (!user) {
//             res.status(404).json({ error: "User not found" });
//             return;
//         }

//         const usage = await usageResponse.json();

//         if (!user.premium && usage.interviewUsage > 1) {
//             res.status(402).json({ error: "Usage limit exceeded" });
//             return;
//         }

//         const openai = new OpenAI({
//             apiKey: process.env.OPENAI_API_KEY,
//         });

//         const completion = await openai.chat.completions.create({
//             model: "o3-mini",
//             messages,
//             stream: true,
//         });

//         res.setHeader("Content-Type", "text/event-stream");
//         res.setHeader("Cache-Control", "no-cache");
//         res.setHeader("Connection", "keep-alive");

//         for await (const chunk of completion) {
//             const content = chunk.choices[0]?.delta?.content;
//             console.log(content);
//             if (content) {
//                 res.write(`${content}`);
//             }
//         }
//         res.end();
//     } catch (error) {
//         console.error("Error:", error);
//         res.status(500).json({
//             error: "An unspecified server error occurred: " + error,
//         });
//     }
// });

router.post("/feedback", ClerkExpressWithAuth(), async (req, res) => {
    try {
        const { messages } = req.body as {
            messages: Message[];
        };

        messages.push({
            role: "assistant",
            content:
                "You are trying to figure out whether or not you would hire someone based off of the messages that they sent " +
                "during their interview. Looking at what they said, the clarifying questions they answered and how close to the solution they were, " +
                "rate them strong hire, hire, lean hire, lean no hire, no hire, or strong no hire. Put this as the first thing in your response. " +
                "Also give them advice on what they could do better next time",
        });

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

        if (!user.premium && usage.interviewUsage > 1) {
            res.status(402).json({ error: "Usage limit exceeded" });
            return;
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: "o3-mini",
            reasoning_effort: "high",
            messages,
        });

        res.status(200).json({
            message: completion.choices[0]?.message.content,
        });
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
