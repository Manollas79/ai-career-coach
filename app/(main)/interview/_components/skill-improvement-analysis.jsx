"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function SkillImprovementAnalysis({ analysis }) {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="gradient-title text-3xl md:text-4xl">
            Skill Improvement Analysis
          </CardTitle>
          <CardDescription>
            Complete at least one quiz to unlock AI-powered insights about your
            strengths and focus areas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const {
    strengths = [],
    weakAreas = [],
    topicsToImprove = [],
    recommendedFocusAreas = [],
  } = analysis;

  const hasAnyInsights =
    strengths.length ||
    weakAreas.length ||
    topicsToImprove.length ||
    recommendedFocusAreas.length;

  if (!hasAnyInsights) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="gradient-title text-3xl md:text-4xl">
          Skill Improvement Analysis
        </CardTitle>
        <CardDescription>
          AI-generated insights based on your past quiz performance.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        {strengths.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Strengths</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {strengths.map((item, idx) => (
                <li key={`strength-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {weakAreas.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Weak Areas</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {weakAreas.map((item, idx) => (
                <li key={`weak-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {topicsToImprove.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Topics Requiring Improvement</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {topicsToImprove.map((item, idx) => (
                <li key={`topic-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {recommendedFocusAreas.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Recommended Focus Areas</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {recommendedFocusAreas.map((item, idx) => (
                <li key={`focus-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


