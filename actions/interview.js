"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createGroqModel } from "@/lib/groqClient";

const model = createGroqModel();

export async function generateQuiz(config) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
      experience: true,
    },
  });

  if (!user) throw new Error("User not found");

  const quizType =
    config?.type || "technical"; // technical | aptitude | verbal | analytical | behavioral
  const numQuestions = config?.numQuestions || 10;

  let difficulty = "intermediate";
  if (typeof user.experience === "number") {
    if (user.experience <= 1) difficulty = "beginner";
    else if (user.experience >= 5) difficulty = "advanced";
  }

  const prompt = `
    You are an AI that generates interview and aptitude quiz questions.

    Generate ${numQuestions} ${quizType} questions for a ${
      user.industry
    } professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  } at a ${difficulty} difficulty level.
    
    Each question MUST be multiple choice with exactly 4 options.

    The response MUST be valid JSON in the following format ONLY, with no additional text or markdown:
    {
      "type": "technical | aptitude | verbal | analytical | behavioral",
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }

    - Set "type" to "${quizType}".
    - Do NOT wrap the JSON in markdown code fences.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);

      improvementTip = tipResult.response.text().trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

export async function getSkillImprovementAnalysis() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const assessments = await db.assessment.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!assessments.length) {
    return null;
  }

  const questionSummaries = assessments
    .flatMap((assessment, aIndex) =>
      (assessment.questions || []).map((q, qIndex) => {
        const question = q.question || "";
        const isCorrect = q.isCorrect ? "correct" : "incorrect";
        const explanation = q.explanation || "";

        return `Assessment ${aIndex + 1}, Question ${qIndex + 1}:\nQuestion: "${question}"\nResult: ${isCorrect}\nExplanation: "${explanation}"`;
      })
    )
    .join("\n\n");

  const prompt = `
    You are an expert interview and career coach analyzing quiz performance data.

    Based on the following questions, whether they were answered correctly, and their explanations, infer:
    - The user's strong skills and topics
    - The user's weak skills and topics
    - Specific topics that require improvement
    - Recommended focus areas for upcoming interviews

    Quiz data:
    ${questionSummaries}

    Return ONLY a valid JSON object in this exact format, with no additional text or markdown:
    {
      "strengths": ["string"],
      "weakAreas": ["string"],
      "topicsToImprove": ["string"],
      "recommendedFocusAreas": ["string"]
    }

    - Keep each bullet concise and specific (e.g., "Good understanding of OOP concepts").
    - Focus on practical, actionable insights.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating skill improvement analysis:", error);
    return null;
  }
}

