import cors from "cors";
import "dotenv/config";
import express from "express";
import accountsRouter from "./accounts";
import prisma from "./db";
import openaiRouter from "./openai";
import questionsRouter from "./questions";
import solutionsRouter from "./solutions";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.send("Hello from the API!");
});

app.use("/accounts", accountsRouter);

app.use("/solutions", solutionsRouter);

app.use("/questions", questionsRouter);

app.use("/openai", openaiRouter);

if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`App listening on port: ${port}`);
    });
}

export default app;
export { prisma };
