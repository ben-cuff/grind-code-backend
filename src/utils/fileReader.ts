import fs from "fs/promises";
import path from "path";

export async function readPythonSolution(
    questionNumber: number
): Promise<string> {
    const paddedNumber = questionNumber.toString().padStart(4, "0");
    const filePath = path.join(
        process.cwd(),
        "assets",
        "python",
        `${paddedNumber}-*.py`
    );

    try {
        const files = await fs.readdir(path.dirname(filePath));
        const matchingFile = files.find((file) =>
            file.startsWith(paddedNumber)
        );

        if (!matchingFile) {
            throw new Error(
                `No solution file found for question ${questionNumber}`
            );
        }

        const fullPath = path.join(path.dirname(filePath), matchingFile);
        const content = await fs.readFile(fullPath, "utf-8");
        return content;
    } catch (error) {
        throw new Error(`Error reading solution file: ${error}`);
    }
}
