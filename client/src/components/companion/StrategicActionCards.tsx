import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface RecommendationGroup {
  title: string;
  items: string[];
  type: "shortTerm" | "mediumTerm" | "longTerm";
  color: string;
}

interface StrategicActionCardsProps {
  recommendations: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
    priorityActions: string;
  };
  onSelectRecommendation: (recommendation: string, type: "shortTerm" | "mediumTerm" | "longTerm") => void;
}

export default function StrategicActionCards({ recommendations, onSelectRecommendation }: StrategicActionCardsProps) {
  // Group recommendations for display
  const recommendationGroups: RecommendationGroup[] = [
    {
      title: "Short-term Actions",
      items: recommendations.shortTerm,
      type: "shortTerm",
      color: "border-green-500 bg-green-50"
    },
    {
      title: "Medium-term Actions",
      items: recommendations.mediumTerm,
      type: "mediumTerm",
      color: "border-blue-500 bg-blue-50"
    },
    {
      title: "Long-term Actions",
      items: recommendations.longTerm,
      type: "longTerm",
      color: "border-purple-500 bg-purple-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Priority Actions Banner */}
      {recommendations.priorityActions && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
          <h3 className="text-lg font-semibold text-amber-700 mb-2">Priority Actions</h3>
          <p className="text-amber-800">{recommendations.priorityActions}</p>
        </div>
      )}

      {/* Action Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendationGroups.map((group) => (
          <Card key={group.title} className={`border-t-4 ${group.color} shadow-sm hover:shadow transition-shadow`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="list-disc list-inside space-y-2">
                {group.items.map((item, index) => (
                  <li key={index} className="text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-0">
              {group.items.length > 0 && (
                <Button 
                  variant="secondary" 
                  className="w-full justify-between text-sm mt-2 border border-slate-200"
                  onClick={() => onSelectRecommendation(group.items.join('\n- '), group.type)}
                  aria-label={`Save ${group.title} to use in proposal`}
                >
                  <span>Save for Proposal</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}