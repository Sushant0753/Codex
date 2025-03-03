import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma";

export async function POST(req: NextRequest) {
  try {
    const submission = await req.json();
    
    const token = submission.token;
    if (!token) {
      return NextResponse.json(
        { message: "No token provided in callback" },
        { status: 400 }
      );
    }

    console.log(`Received callback for token: ${token}`);
    
    const dbSubmission = await prisma.submission.findFirst({
      where: {
        tokens: {
          has: token
        }
      }
    });
    
    if (!dbSubmission) {
      console.error(`No submission found with token: ${token}`);
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }
    
    const currentResults = dbSubmission.results || [];
    const updatedResults = [...currentResults];
    
    const resultIndex = updatedResults.findIndex(
      (result: any) => result.token === token
    );
    
    if (resultIndex >= 0) {
      updatedResults[resultIndex] = submission;
    } else {
      updatedResults.push(submission);
    }

    const allComplete = dbSubmission.tokens.every(t => 
      updatedResults.some((r: any) => 
        r.token === t && r.status && r.status.id !== 1 && r.status.id !== 2
      )
    );
    
    await prisma.submission.update({
      where: { id: dbSubmission.id },
      data: {
        results: updatedResults.filter(Boolean) as any,
        status: allComplete ? "COMPLETED" : "PENDING"
      }
    });
    
    return NextResponse.json(
      { message: "Callback processed successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error processing Judge0 callback:", error);
    return NextResponse.json(
      { message: "Error processing callback", error: error.message },
      { status: 500 }
    );
  }
}