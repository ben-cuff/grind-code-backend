import cors from "cors";
import "dotenv/config";
import express from "express";
import accountsRouter from "./accounts";
import prisma from "./db";
import questionsRouter from "./questions";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.send("Hello from the API!");
});

app.use("/accounts", accountsRouter);

app.use("/questions", questionsRouter);

if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`App listening on port: ${port}`);
    });
}

export default app;
export { prisma };
