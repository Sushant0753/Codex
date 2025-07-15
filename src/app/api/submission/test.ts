import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { promises as fs } from "fs";
import path from "path";

const inputPath = path.join(process.cwd(), "src/testCases/input.txt");
const outputPath = path.join(process.cwd(), "src/testCases/output.txt");

// Track submissions in memory for now (will use DB later)
const submissionStore = new Map();

async function readFiles() {
  const inputData = await fs.readFile(inputPath, "utf8");
  const outputData = await fs.readFile(outputPath, "utf8");

  const inputs = inputData
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/\\n/g, "\n"));
  const outputs = outputData
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return { inputs, outputs };
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

    const { inputs, outputs } = await readFiles();

    const submissions = inputs.map((input, index) => ({
      language_id: languageId,
      source_code: Buffer.from(code).toString("base64"),
      stdin: Buffer.from(input).toString("base64"),
      expected_output: outputs[index] ? Buffer.from(outputs[index]).toString("base64") : "",
    }));

    console.log("Submissions Payload:", JSON.stringify({ submissions }, null, 2));

    const response = await axios.post(
      `${JUDGE0_URL}/submissions/batch?base64_encoded=true`,
      { submissions },
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      },

    );

    // Extract tokens from the response
    const tokens = response.data.map((submission: any) => submission.token);
    
    // Generate unique submission ID
    const submissionId = Date.now().toString();
    
    // Store submission in our memory store
    submissionStore.set(submissionId, {
      tokens,
      problemId,
      languageId,
      status: "PENDING",
      results: null,
      created_at: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        message: "Submissions created successfully", 
        tokens,
        submissionId
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { message: "Error processing request", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('submissionId');
    const tokens = searchParams.get('tokens');
    
    if (!submissionId && !tokens) {
      return NextResponse.json(
        { message: "Missing required parameters: either submissionId or tokens" },
        { status: 400 }
      );
    }
    
    // If we have a submissionId, check our store first
    if (submissionId && submissionStore.has(submissionId)) {
      const submission = submissionStore.get(submissionId);
      
      // If we already have results, return them
      if (submission.results) {
        return NextResponse.json(
          { 
            status: "COMPLETED",
            submissions: submission.results
          },
          { status: 200 }
        );
      }
      
      // Otherwise, fetch from Judge0
      const results = await checkSubmissionStatus(submission.tokens);
      
      // Check if all are completed
      const allComplete = results.every((sub: any) => 
        sub && sub.status && sub.status.id !== 1 && sub.status.id !== 2);
      
      if (allComplete) {
        // Update our store
        submission.status = "COMPLETED";
        submission.results = results;
        submissionStore.set(submissionId, submission);
      }
      
      return NextResponse.json(
        { 
          status: allComplete ? "COMPLETED" : "PENDING",
          submissions: results
        },
        { status: 200 }
      );
    }
    
    // If we just have tokens, check directly with Judge0
    if (tokens) {
      const tokenArray = tokens.split(',');
      const results = await checkSubmissionStatus(tokenArray);
      
      return NextResponse.json(
        { submissions: results },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { message: "Submission not found" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error fetching submission results:", error);
    return NextResponse.json(
      { 
        message: "Error fetching results", 
        error: error.message
      },
      { status: 500 }
    );
  }
}

// Helper function to check submission status with Judge0
async function checkSubmissionStatus(tokens: string[]) {
  const JUDGE0_URL = process.env.JUDGE0_URL;
  if (!JUDGE0_URL) {
    throw new Error("JUDGE0_URL not configured");
  }

  const tokensString = tokens.join(",");
  const response = await axios.get(`${JUDGE0_URL}/submissions/batch`, {
    params: { 
      tokens: tokensString, 
      base64_encoded: "true", 
      fields: "*" 
    },
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    },
  });

  return response.data.submissions || [];
}