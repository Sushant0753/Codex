import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
    try {
        const { code, problemId } = await request.json();

        console.log('Received Execution Request:', {
            codeLength: code ? code.length : 'No code',
            problemId: problemId || 'No problem ID'
        });

        if (!code || typeof code !== 'string') {
            console.error('Invalid code input');
            return NextResponse.json({
                status: 'error',
                output: 'Invalid code input',
            }, { status: 400 });
        }

        const scriptPath = path.join(process.cwd(), 'src', 'app', 'scripts', 'code_executor.py');

        
        if (!fs.existsSync(scriptPath)) {
            console.error('Executor script not found:', scriptPath);
            return NextResponse.json({
                status: 'error',
                output: 'Execution script not found',
            }, { status: 500 });
        }


        console.log('Executor Script Path:', scriptPath);

        return new Promise((resolve, reject) => {
            
            const pythonProcess = spawn('python', ['-u', scriptPath, code]);
            
            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                const dataStr = data.toString().trim();
                output += dataStr;
                console.log('STDOUT:', dataStr);
            });

            pythonProcess.stderr.on('data', (data) => {
                const dataStr = data.toString().trim();
                errorOutput += dataStr;
                console.error('STDERR:', dataStr);
            });

            pythonProcess.on('close', (exitCode) => {
                console.log('Process Closed:', {
                    exitCode,
                    output,
                    errorOutput
                });

                try {
                    
                    let result;
                    try {
                        result = JSON.parse(output || '{}');
                    } catch {
                        result = {
                            status: exitCode === 0 ? 'success' : 'error',
                            output: output || errorOutput || 'No output',
                            exit_code: exitCode
                        };
                    }
                    
                    resolve(
                        NextResponse.json({
                            status: result.status || 'error',
                            output: result.output || 'No output',
                            exitCode: result.exit_code || exitCode
                        })
                    );
                } catch (parseError) {
                    console.error('Result Parsing Error:', parseError);
                    resolve(
                        NextResponse.json({
                            status: 'error',
                            output: 'Failed to parse execution result',
                            exitCode: -1
                        })
                    );
                }
            });

            pythonProcess.on('error', (err) => {
                console.error('Process Execution Error:', err);
                reject(
                    NextResponse.json({
                        status: 'error',
                        output: `Process execution failed: ${err.message}`,
                        exitCode: -1
                    })
                );
            });
        });
    } catch (error) {
        console.error('Execution Route Error:', error);
        return NextResponse.json(
            {
                status: 'error',
                output: 'Failed to execute code',
                error: (error as Error).message,
            },
            { status: 500 }
        );
    }
}