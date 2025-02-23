import { Request, Response, Router } from "express";
import OpenAI from "openai";
import { ChatCompletionChunk } from "openai/resources/index.mjs";

const router = Router();

async function streamOpenAIResponse(
    response: AsyncIterable<ChatCompletionChunk>,
    res: Response
) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(content);
            }
        }
    } catch (error) {
        console.error("Error processing stream:", error);
        res.write("\n\nError occurred.");
    } finally {
        res.end();
    }
}

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

        const responseStream = await openai.chat.completions.create({
            model: "o3-mini",
            stream: true,
            messages: [
                {
                    content: message,
                    role: "assistant",
                },
            ],
        });

        await streamOpenAIResponse(responseStream, res);
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
