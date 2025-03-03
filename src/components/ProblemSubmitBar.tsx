"use client";
import Editor from "@monaco-editor/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import { useEffect, useState } from "react";
import { LANGUAGE_MAPPING } from "@/components/languageMapping";
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
                languageId: number;
                code: string;
        }[]
}
export interface Judge0Status {
    id: number;
}

export interface Judge0Submission {
    status: Judge0Status;
    stdin?: string;
    expected_output?: string;
    stdout?: string;
    stderr?: string;
    compile_output?: string;
}
interface ProcessedTestCase {
    index: number;
    status: string;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    error?: string;
    compile_output?: string;
}

export interface Judge0Results {
    submissions?: Judge0Submission[];
}

interface Judge0Response {
    data: Judge0Results;
}

export const ProblemSubmitBar = ({
        problem
}: {
        problem: IProblem
}) => {
        const [activeTab, setActiveTab] = useState("problem");
        return (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
                        <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                        <Tabs
                                                value={activeTab}
                                                onValueChange={setActiveTab}
                                        >
                                                <TabsList className="grid grid-cols-2 w-full">
                                                        <TabsTrigger value="problem">Submit</TabsTrigger>
                                                        <TabsTrigger value="submissions">Submissions</TabsTrigger>
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
        const fetchData = async () => {
            const response = await axios.get(
                `/api/submission/bulk?problemId=${problem.id}`
            );
            setSubmissions(response.data.submissions || []);
        };
        fetchData();
    }, [problem.id]);

    return (
        <div>
            <SubmissionTable submissions={submissions} />
        </div>
    );
}

function SubmitProblem({
    problem
}: {
    problem: IProblem;
}) {
    const [language, setLanguage] = useState(
        Object.keys(LANGUAGE_MAPPING)[0] as string
    );
    const [code, setCode] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<string>(SubmitStatus.SUBMIT);
    const [testcases, setTestcases] = useState<any[]>([]);
    const [submissionTokens, setSubmissionTokens] = useState<string[]>([]);

    useEffect(() => {
        const defaultCode: { [key: string]: string } = {};
        problem.defaultCode.forEach((code) => {
            const language = Object.keys(LANGUAGE_MAPPING).find(
                (language) => LANGUAGE_MAPPING[language]?.internal === code.languageId
            );
            if (!language) return;
            defaultCode[language] = code.code;
        });
        setCode(defaultCode);
    }, [problem]);

    async function pollWithBackoff(id: string, tokens: string[], retries: number) {
        if (retries === 0) {
            setStatus(SubmitStatus.SUBMIT);
            toast.error("Not able to get status ");
            return;
        }
        
        try {
            // First, try to get results from our own API using the submission ID
            const response = await axios.get(`/api/submission/?id=${id}`);
            
            // Check if we need to fetch Judge0 results directly using tokens
            if (response.data.submission.status === "PENDING" && tokens.length > 0) {
                // Get test results from Judge0 using the tokens
                const judge0Response = await fetchJudge0Results(tokens);
                
                // Process the Judge0 results
                if (judge0Response && judge0Response.data) {
                    // Update testcases based on Judge0 results
                    const updatedTestcases = processJudge0Results(judge0Response.data);
                    setTestcases(updatedTestcases);
                    
                    // Check if all test cases are done
                    const allDone = updatedTestcases.every(tc => tc.status !== "PENDING");
                    if (allDone) {
                        // If all tests pass, mark as accepted
                        const allPassed = updatedTestcases.every(tc => tc.status === "AC");
                        setStatus(allPassed ? SubmitStatus.ACCEPTED : SubmitStatus.FAILED);
                        toast.success(allPassed ? "Accepted!" : "Failed :(");
                        return;
                    }
                }
                
                // Continue polling if needed
                await new Promise((resolve) => setTimeout(resolve, 2.5 * 1000));
                pollWithBackoff(id, tokens, retries - 1);
            } else if (response.data.submission.status === "PENDING") {
                // No tokens, use existing logic
                setTestcases(response.data.testCases);
                await new Promise((resolve) => setTimeout(resolve, 2.5 * 1000));
                pollWithBackoff(id, tokens, retries - 1);
            } else {
                // Results available from our API
                if (response.data.submission.status === "AC") {
                    setStatus(SubmitStatus.ACCEPTED);
                    setTestcases(response.data.testCases);
                    toast.success("Accepted!");
                    return;
                } else {
                    setStatus(SubmitStatus.FAILED);
                    toast.error("Failed :(");
                    setTestcases(response.data.testCases);
                    return;
                }
            }
        } catch (error) {
            console.error("Error polling for results:", error);
            await new Promise((resolve) => setTimeout(resolve, 2.5 * 1000));
            pollWithBackoff(id, tokens, retries - 1);
        }
    }

    function processJudge0Results(judgeResults: any): ProcessedTestCase[] {
        if (!judgeResults || !Array.isArray(judgeResults)) {
          console.error("No submissions found in Judge0 results.");
          return [];
        }
      
        return judgeResults.map((submission: any, index: number) => {
          let status = "PENDING";
          if (submission.status) {
            if (submission.status.id === 3) status = "AC"; // Accepted
            else if (submission.status.id === 5) status = "TLE"; // Time Limit Exceeded
            else if (submission.status.id === 6) status = "COMPILATION_ERROR"; // Compilation Error
            else if (submission.status.id > 3) status = "FAIL"; // Other errors
          }
      
          return {
            index,
            status,
            input: submission.stdin ? atob(submission.stdin) : "",
            expectedOutput: submission.expected_output ? atob(submission.expected_output) : "",
            actualOutput: submission.stdout ? atob(submission.stdout) : "",
            error: submission.stderr ? atob(submission.stderr) : "",
            compile_output: submission.compile_output ? atob(submission.compile_output) : "",
          };
        });
      }

    async function fetchJudge0Results(tokens: string[]): Promise<Judge0Response | null> {
        if (!tokens || tokens.length === 0) return null;
        
        try {
            const tokensString: string = tokens.join(',');
            const response = await axios.get<Judge0Response>('/api/judge0', {
                params: { 
                    tokens: tokensString,
                    base64_encoded: 'true'
                }
            });
            
            return response.data;
        } catch (error) {
            console.error("Error fetching Judge0 results:", error);
            return null;
        }
    }

    async function submit() {
        try {
          const response = await axios.post("/api/submission", {
            code: code[language],
            languageId: LANGUAGE_MAPPING[language].internal,
            problemId: problem.id,
          });
      
          console.log("Submission Response:", response.data);
      
          // Handle the response (tokens and results)
          const { tokens, results } = response.data;
          setSubmissionTokens(tokens);
          setTestcases(processJudge0Results(results)); // Process and display results
        } catch (error) {
          console.error("Submission Error:", error);
          toast.error("Submission failed. Please try again.");
          setStatus(SubmitStatus.FAILED);
        }
      }
    
    return (
        <div>
            <Label htmlFor="language">Language</Label>
            <Select
                value={language}
                defaultValue="cpp"
                onValueChange={(value) => setLanguage(value)}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    {Object.keys(LANGUAGE_MAPPING).map((language) => (
                        <SelectItem key={language} value={language}>
                            {LANGUAGE_MAPPING[language]?.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="pt-4 rounded-md">
                <Editor
                    height={"60vh"}
                    value={code[language]}
                    theme="vs-dark"
                    onMount={() => {}}
                    options={{
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                    }}
                    language={LANGUAGE_MAPPING[language]?.monaco}
                    onChange={(value) => {
                        if (value !== undefined) {
                            setCode({ ...code, [language]: value || "" });
                        }
                    }}
                    defaultLanguage="javascript"
                />
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
            <RenderTestcase testcases={testcases} />
        </div>
    );
}

function renderResult(status: string) {
    switch (status) {
        case "AC":
            return <CheckIcon className="h-6 w-6 text-green-500" />;
        case "FAIL":
            return <XCircleIcon className="h-6 w-6 text-red-500" />;
        case "TLE":
            return <ClockIcon className="h-6 w-6 text-red-500" />;
        case "COMPILATION_ERROR":
            return <XCircleIcon className="h-6 w-6 text-red-500" />;
        case "PENDING":
            return <ClockIcon className="h-6 w-6 text-red-500" />;
        default:
            return <div className="text-gray-500"></div>;
    }
}

function RenderTestcase({ testcases }: { testcases: any[] }) {
    if (!testcases.length) return null;
    
    return (
        <div className="mt-4">
            <div className="text-sm font-medium">Test Cases</div>
            <div className="space-y-2">
                {testcases.map((testcase, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <div>Test case {index + 1}</div>
                        {renderResult(testcase.status)}
                        {testcase.error && (
                            <div className="text-xs text-red-500 ml-2">{testcase.error}</div>
                        )}
                        {testcase.compile_output && (
                            <div className="text-xs text-orange-500 ml-2">Compile error: {testcase.compile_output}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
