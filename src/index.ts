import cors from "cors";
import "dotenv/config";
import express from "express";
import accountsRouter from "./accounts";
import prisma from "./db";
import interviewRouter from "./interview";
import openaiRouter from "./openai";
import questionsRouter from "./questions";
import solutionsRouter from "./solutions";
import usageRouter from "./usage";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.send("Hello from the API!");
});

export const apiKeyMiddleware = (
    req: express.Request,
    res: express.Response
) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.X_API_KEY) {
        res.status(401).json({ error: "Invalid API key" });
        return false;
    }
    return true;
};

app.use("/accounts", accountsRouter);
app.use("/solutions", solutionsRouter);
app.use("/questions", questionsRouter);
app.use("/openai", openaiRouter);
app.use("/usage", usageRouter);
app.use("/interview", interviewRouter);

if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`App listening on port: ${port}`);
    });
}

export default app;
export { prisma };
