import { Request, Response, Router } from "express";
import OpenAI from "openai";

const router = Router();

router.post("/ask-ai", async (req: Request, res: Response) => {
    try {
        console.log("attempting");
        const { message } = req.body;

        if (!message) {
            res.status(400).json({
                error: "Invalid or missing 'message' field",
            });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "o3-mini",
            messages: [
                {
                    content: message,
                    role: "assistant",
                },
            ],
        });

        res.status(200).json({ message: response.choices[0]?.message.content });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "Failed to generate response, it is likely that your API key is broken or out of credit",
            errorMessage: error,
        });
    }
});

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export default router;
