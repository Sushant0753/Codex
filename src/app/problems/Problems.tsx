'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function Problems() {
  const [problems, setProblems] = useState([
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
  ]);
  useEffect(() => {
    // Load problems
    const loadProblems = async () => {
      try {
        const fetchedProblems = await getProblems();
        if (fetchedProblems && fetchedProblems.length > 0) {
          setProblems(fetchedProblems);
        }
      } catch (error) {
        console.error("Error fetching problems:", error);
      }
    };
    
    loadProblems();
  }, []);

  type Difficulty = 'Easy' | 'Medium' | 'Hard';
  
  const difficultyColors: Record<Difficulty, string> = {
    'Easy': 'text-green-500 dark:text-green-400',
    'Medium': 'text-yellow-500 dark:text-yellow-400',
    'Hard': 'text-red-500 dark:text-red-400'
  };
  
  return (
    <section className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white py-24 transition-colors duration-200">
      <Navbar />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="w-96 h-96 bg-blue-300 dark:bg-blue-500 opacity-5 dark:opacity-10 blur-3xl absolute top-1/3 left-1/2 transform -translate-x-1/2"></div>
        <div className="w-80 h-80 bg-purple-300 dark:bg-purple-500 opacity-5 dark:opacity-10 blur-3xl absolute top-2/3 left-1/4 transform -translate-x-1/2"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">Problems</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Challenge yourself with our collection of algorithmic problems and sharpen your coding skills</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
        >
          <Table>
            <TableHeader className="bg-gray-100 dark:bg-gray-700">
              <TableRow>
                <TableHead className="text-gray-700 dark:text-gray-200">Title</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-200">Description</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-200">Difficulty</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-200">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problems.map((problem) => (
                <TableRow key={problem.id} className="border-b border-gray-200 dark:border-gray-700">
                  <TableCell className="font-medium text-gray-800 dark:text-gray-100">{problem.title}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-300">{problem.description}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${difficultyColors[problem.difficulty as Difficulty]}`}>
                      {problem.difficulty}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/problems/${problem.id}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        View Problem
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </section>
  );
}