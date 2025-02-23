import { Router } from "express";
import { readPythonSolution } from "../utils/fileReader";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const questionNumber = Number(req.query.questionNumber);

        if (!questionNumber) {
            res.status(400).json({
                error: "Missing questionNumber from path",
            });
        }

        try {
            let solutionContent = await readPythonSolution(
                Number(questionNumber)
            );

            solutionContent = "```py\n" + solutionContent + "\n```";
            res.status(200).json({
                solution: solutionContent,
            });
        } catch (error) {
            res.status(404).json({
                error: "Could not find question: " + error,
            });
        }
    } catch (error) {
        res.status(500).json({
            error: "An unexpected server occurred: " + error,
        });
    }
});

export default router;
