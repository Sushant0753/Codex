import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const inputPath = path.join(process.cwd(), "src/db/input.txt");
    const outputPath = path.join(process.cwd(), "src/db/output.txt");

    const inputData = await fs.readFile(inputPath, "utf8");
    const outputData = await fs.readFile(outputPath, "utf8");

    console.log(inputData)

    const inputs = inputData
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
    const outputs = outputData
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const body = await req.json();
    const { code, languageId } = body;

    if (!code || !languageId) {
      return NextResponse.json(
        { message: "Missing required fields: code or languageId" },
        { status: 400 }
      );
    }


    const JUDGE0_URL = process.env.JUDGE0_URL;
    console.log(JUDGE0_URL)
    if (!JUDGE0_URL) {
      return NextResponse.json(
        { message: "JUDGE0_URL not configured" },
        { status: 500 }
      );
    }

    const submissions = inputs.map((input, index) => ({
      language_id: languageId,
      source_code: Buffer.from(code).toString("base64"),
      stdin: Buffer.from(input).toString("base64"),
      expected_output: outputs[index] ? Buffer.from(outputs[index]).toString("base64") : "",
    }));

    const response = await axios.post(
      `${JUDGE0_URL}/submissions/batch?base64_encoded=true`,
      { submissions },
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(
      { message: "Submissions sent", data: response.data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Error processing request", error: error.message },
      { status: 500 }
    );
  }
}
