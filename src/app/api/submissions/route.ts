import { NextResponse } from 'next/server';
import { prisma } from '../../../../prisma';

export async function GET(
    request: Request,
    { params }: { params: { problemId: string } }
) {
    try {
        const submissions = await prisma.submission.findMany({
            where: {
                problemId: params.problemId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(submissions);
    } catch (error) {
        console.error('Failed to fetch submissions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch submissions' },
            { status: 500 }
        );
    }
}