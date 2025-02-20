import cors from "cors";
import "dotenv/config";
import express from "express";
import accountsRouter from "./accounts";

const port = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.send("Hello from the API!");
});

app.use("/accounts", accountsRouter);

app.listen(port, () => {
    console.log(`App listening on port: ${port}`);
});
