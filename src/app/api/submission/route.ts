import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { promises as fs } from "fs";
import path from "path";
import { headers } from "next/headers";

const inputPath = path.join(process.cwd(), "src/testCases/input.txt");
const outputPath = path.join(process.cwd(), "src/testCases/output.txt");

async function readFiles(){
    const inputData = await fs.readFile(inputPath, "utf8");
    const outputData = await fs.readFile(outputPath, "utf8");

    const inputs = inputData
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
    const outputs = outputData
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log(inputs);
    console.log(outputs);

    return {inputs, outputs};

}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, languageId, problemId } = body;

    if (!code || !languageId || !problemId) {
      return NextResponse.json(
        { message: "Missing required fields: code, languageId, or problemId" },
        { status: 400 }
      );
    }

    // Send the code to Judge0 for execution
    const JUDGE0_URL = process.env.JUDGE0_URL;
    if (!JUDGE0_URL) {
      return NextResponse.json(
        { message: "JUDGE0_URL not configured" },
        { status: 500 }
      );
    }

    const {inputs, outputs} = await readFiles();

    const submissions = inputs.map((input, index) => ({
      language_id: languageId,
      source_code: Buffer.from(code).toString("base64"),
      stdin: Buffer.from(input).toString("base64"),
      expected_output: outputs[index] ? Buffer.from(outputs[index]).toString("base64") : "",
    }));

    console.log("Submissions Payload:", JSON.stringify({ submissions }, null, 2));

    const response = await axios.post(
      `${JUDGE0_URL}/submissions/batch?base64_encoded=true`,
      {submissions},
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      }
    );

    // Extract tokens from the response
    const tokens = response.data.map((submission: any) => submission.token);

    // Immediately fetch results using the tokens
    const results = await fetchResults(tokens);

    console.log(results)

    return NextResponse.json(
      { message: "Submissions sent and results fetched", tokens, results },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error processing request", error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to fetch results using tokens
async function fetchResults(tokens: string[]) {
  const JUDGE0_URL = process.env.JUDGE0_URL;
  if (!JUDGE0_URL) {
    throw new Error("JUDGE0_URL not configured");
  }

  const tokensString = tokens.join(",");
  const response = await axios.get(`${JUDGE0_URL}/submissions/batch`, {
    params: { tokens: tokensString, base64_encoded: "true", fields: "*" },
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    },
  });

  return response.data.submissions;
}


export async function GET(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const tokens = searchParams.get('tokens');
  
      if (!tokens) {
        return NextResponse.json(
          { message: "Missing required tokens parameter" },
          { status: 400 }
        );
      }
  
      const tokenArray = tokens.split(',');
      const results = await fetchResults(tokenArray);
      console.log("Received tokens:", tokens);
      console.log("JUDGE0_URL:", process.env.JUDGE0_URL);
      console.log("Results fetched:", results.length);
  
      return NextResponse.json(
        { submissions: results },
        { status: 200 }
        
      );
    } catch (error: any) {
      console.error("Error fetching submission results:", error);
      return NextResponse.json(
        { message: "Error fetching results", error: error.message },
        { status: 500 }
      );
    }
}