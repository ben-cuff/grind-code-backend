import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { userId, email } = req.body;

        if (!userId || !email) {
            return res
                .status(400)
                .json({ error: "userId and email are required" });
        }

        const newAccount = await prisma.account.create({
            data: {
                id: userId,
                email,
            },
        });
        return res.status(201).json(newAccount);
    } catch (error) {
        return res
            .status(500)
            .json({ error: "A server error occurred: " + error });
    }
});

export default router;
