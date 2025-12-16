import { getAssessments, getSkillImprovementAnalysis } from "@/actions/interview";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performace-chart";
import QuizList from "./_components/quiz-list";
import SkillImprovementAnalysis from "./_components/skill-improvement-analysis";

export default async function InterviewPrepPage() {
  const assessments = await getAssessments();
  const skillAnalysis = await getSkillImprovementAnalysis();

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradient-title">
          Interview Preparation
        </h1>
      </div>
      <div className="space-y-6">
        <StatsCards assessments={assessments} />
        <PerformanceChart assessments={assessments} />
        <SkillImprovementAnalysis analysis={skillAnalysis} />
        <QuizList assessments={assessments} />
      </div>
    </div>
  );
}
