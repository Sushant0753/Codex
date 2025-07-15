import {primsa} from "../../prisma/index.ts";

// export const getProblems = async () => {
//     const problems = await prisma.problem.findMany({
//         include:{
//             defaultCode: true
//         }
//     });
//     return problems;
// }

// In your db/problem.js file
export async function getProblems() {
    // Return dummy data for testing purposes
    return [
      {
        id: 1,
        title: 'Two Sum',
        description: 'Find two numbers that add up to a given target.',
        difficulty: 'Easy',
      },
      {
        id: 2,
        title: 'Reverse a String',
        description: 'Reverse the input string.',
        difficulty: 'Medium',
      },
      {
        id: 3,
        title: 'Longest Substring Without Repeating Characters',
        description: 'Find the longest substring without repeating characters.',
        difficulty: 'Hard',
      },
    ];
}
  


// const getProblem = async (id: number) => {
//     const problem = await prisma.problem.findUnique({
//         where: { id },
//         include: {
//             defaultCode: true
//         }
//     });
//     return problem;
// }

// export { getProblemById };


export const getProblem = async (id: number) => {
  const problems = [
      {
          id: 1,
          title: "Two Sum",
          description: "Find two numbers that add up to a given target.",
          difficulty: "Easy",
          defaultCode: "// Write your code here",
      },
      {
          id: 2,
          title: "Reverse a String",
          description: "Reverse the input string.",
          difficulty: "Medium",
          defaultCode: "// Write your code here",
      },
      {
          id: 3,
          title: "Longest Substring Without Repeating Characters",
          description: "Find the longest substring without repeating characters.",
          difficulty: "Hard",
          defaultCode: "// Write your code here",
      },
  ];

  return problems.find((problem) => problem.id === id) || null;
};
