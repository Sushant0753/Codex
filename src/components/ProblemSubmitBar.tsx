"use client";
import Editor from "@monaco-editor/react";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { use, useEffect, useState } from "react";
import axios from "axios";
import { ISubmission, SubmissionTable } from "./SubmissionTable";
import { CheckIcon, XCircleIcon, ClockIcon } from "lucide-react"; 
import { toast } from "react-toastify";

enum SubmitStatus {
        SUBMIT = "SUBMIT",
        PENDING = "PENDING",
        ACCEPTED = "ACCEPTED",
        FAILED = "FAILED"
}

export interface IProblem {
        id: string;
        title: string;
        description: string;
        slug: string;
        defaultCode: {
                code: string;
        }[]
}




export const ProblemSubmitBar = ({
        problem
}: {
        problem: IProblem
}) => {
        const [activeTab, setActiveTab] = useState("problem");
        return (
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mt-3">
                        <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                        <Tabs
                                                value={activeTab}
                                                onValueChange={setActiveTab}
                                        >
                                                <TabsList className="grid grid-cols-2 w-full">
                                                        <TabsTrigger value="problem" onClick={() => {}}>Submit</TabsTrigger>
                                                        <TabsTrigger value="submissions" onClick={() => {}}>Submissions</TabsTrigger>
                                                </TabsList>
                                        </Tabs>
                                </div>
                        </div>
                        <div className={`${activeTab === "problem" ? "" : "hidden"}`}>
                                <SubmitProblem problem={problem} />
                        </div>
                        {activeTab === "submissions" && <Submissions problem={problem} />}
                </div>
        );
}

function Submissions({ problem }: { problem: IProblem }) {
    const [submissions, setSubmissions] = useState<ISubmission[]>([]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const response = await axios.get(`/api/submissions/${problem.id}`);
                setSubmissions(response.data);
            } catch (error) {
                console.error('Failed to fetch submissions', error);
            }
        };
        fetchSubmissions();
    }, [problem.id]);

    return (
        <div>
            <SubmissionTable submissions={submissions} />
        </div>
    );
}

function SubmitProblem({ problem }: { problem: IProblem }) {
    const [code, setCode] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<string>(SubmitStatus.SUBMIT)
    const [output, setOutput] = useState<string>('');

    useEffect(()=>{
        let defaultCode: {[key: string] : string} = {};
        if (problem.defaultCode && problem.defaultCode.length > 0) {
            defaultCode = { code: problem.defaultCode[0].code };
        }
        setCode(defaultCode);
    }, [problem.defaultCode]);

    async function submit() {
        try {
            setStatus(SubmitStatus.PENDING);
            setOutput('');
            
            // Add more explicit console logging
            console.log('Current code state before submission:', code);
            console.log('Code to submit:', code?.code);
            console.log('Problem ID:', problem.id);
    
            const response = await axios.post('/api/execute', {
                code: code?.code,  
                problemId: problem.id
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setOutput(response.data.output || 'No output generated');
            
            if (response.data.status === "success") {
                setStatus(SubmitStatus.ACCEPTED);
                toast.success('Solution submitted successfully!');
            } else {
                setStatus(SubmitStatus.FAILED);
                toast.error(`Execution failed: ${response.data.output}`);
            }
        } catch (error) {
            console.error('Submission Error:', error);
            setStatus(SubmitStatus.FAILED);
            toast.error('Error submitting solution');
        }
    }

    return (
        <div>
            <Label htmlFor="language">Language</Label>
            <div className="text-sm text-gray-500 mb-2">
                Python
            </div>

            <div className="pt-4 rounded-md">
                <Editor
                    height={"50vh"}
                    value={code.code || ''}  
                    theme="vs-dark"
                    language="python"  
                    onMount={() => {}}
                    options={{
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                    }}
                    onChange={(value, event) => {
                        if (value !== undefined) {
                            setCode({ code: value }); 
                        }
                    }}
                />
            </div>
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                <div className="font-semibold mb-2">Output:</div>
                <pre className="whitespace-pre-wrap break-words text-sm">
                    {output || 'No output yet'}
                </pre>
            </div>

            <div className="flex justify-end">
                <Button
                    disabled={status === SubmitStatus.PENDING}
                    type="submit"
                    className="mt-4 align-right"
                    onClick={submit}
                >
                    {status === SubmitStatus.PENDING ? "Submitting..." : "Submit"}
                </Button>
            </div>
        </div>
    );
}


