import { CheckIcon, XCircleIcon, ClockIcon } from "lucide-react"; 
import { formatDistance } from "date-fns";

export interface ISubmission {
    id: string;
    status: string;
    language: string;
    submittedAt: string;
    code: string;
}

export function SubmissionTable({ submissions }: { submissions: ISubmission[] }) {
    if (!submissions.length) {
        return <div className="text-center py-4">No submissions yet</div>;
    }

    return (
        <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Language</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {submissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    {renderStatusIcon(submission.status)}
                                    <span className="ml-2">{submission.status}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {submission.language}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatTimestamp(submission.submittedAt)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function renderStatusIcon(status: string) {
    switch (status) {
        case "AC":
            return <CheckIcon className="h-5 w-5 text-green-500" />;
        case "FAIL":
        case "WA":
            return <XCircleIcon className="h-5 w-5 text-red-500" />;
        case "TLE":
            return <ClockIcon className="h-5 w-5 text-yellow-500" />;
        case "COMPILATION_ERROR":
        case "CE":
            return <XCircleIcon className="h-5 w-5 text-orange-500" />;
        case "PENDING":
            return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
        default:
            return <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-700"></div>;
    }
}

function formatTimestamp(timestamp: string) {
    try {
        return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
    } catch (e) {
        return "Unknown";
    }
}