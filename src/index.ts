import cors from "cors";
import "dotenv/config";
import express from "express";

const port = process.env.PORT || 3000;

const app = express();

app.use(cors());

app.get("/", (_req, res) => {
    res.send("Hello from the API!");
});

app.listen(port, () => {
    console.log(`App listening on port: ${port}`);
});
