import express from "express";
import prismaClient from "./db";
import { SubmissionCallback } from "@repo/common/zod";
import { outputMapping } from "./outputMapping";
import { getPoints } from "./points";

const app = express();
app.use(express.json());

app.put("/submission-callback", async (req, res) => {
    const parsedBody = SubmissionCallback.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(403).json({
            message: "Invalid input",
        });
    }

    const testCase = await prismaClient.testCase.update({
        where: {
            judge0TrackingId: parsedBody.data.token,
        },
        data: {
            status: outputMapping[parsedBody.data.status.description],
            time: Number(parsedBody.data.time),
            memory: parsedBody.data.memory,
        },
    });

    if (!testCase) {
        return res.status(404).json({
            message: "Testcase not found",
        });
    }
    const allTestcaseData = await prismaClient.testCase.findMany({
        where: {
            submissionId: testCase.submissionId,
        },
    });
    
    const pendingTestcases = allTestcaseData.filter(
        (testcase) => testcase.status === "PENDING"
    );
    
    const failedTestcases = allTestcaseData.filter(
        (testcase) => testcase.status !== "AC"
    );

    if (pendingTestcases.length === 0) {
        const accepted = failedTestcases.length === 0;
        const response = await prismaClient.submission.update({
            where: {
                id: testCase.submissionId,
            },
            data: {
                status: accepted ? "AC" : "REJECTED",
                time: Math.max(
                    ...allTestcaseData.map((testcase) => Number(testcase.time || "0"))
                ),
                memory: Math.max(
                    ...allTestcaseData.map((testcase) => testcase.memory || 0)
                ),
            },
            include: {
                problem: true,
                activeContest: true,
            },
        });
    }    
    
return res.status(200).json({
    message: "Submission processed successfully",
});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});
