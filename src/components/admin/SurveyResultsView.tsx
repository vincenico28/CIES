import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, FileText, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SurveyResultsViewProps {
  surveyId: string;
  surveyTitle: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: { choices?: string[] } | null;
  order_index: number;
}

interface Response {
  id: string;
  user_id: string;
  submitted_at: string;
}

interface Answer {
  question_id: string;
  answer_text: string | null;
  answer_value: unknown;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

export function SurveyResultsView({ surveyId, surveyTitle }: SurveyResultsViewProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [surveyId]);

  const fetchResults = async () => {
    try {
      // Fetch questions
      const { data: questionsData } = await supabase
        .from("survey_questions")
        .select("*")
        .eq("survey_id", surveyId)
        .order("order_index");

      // Fetch responses
      const { data: responsesData } = await supabase
        .from("survey_responses")
        .select("*")
        .eq("survey_id", surveyId);

      // Fetch answers if we have responses
      if (responsesData && responsesData.length > 0) {
        const responseIds = responsesData.map(r => r.id);
        const { data: answersData } = await supabase
          .from("survey_answers")
          .select("*")
          .in("response_id", responseIds);

        if (answersData) {
          setAnswers(answersData);
        }
      }

      if (questionsData) {
        setQuestions(
          questionsData.map((q) => ({
            ...q,
            options: q.options as { choices?: string[] } | null,
          }))
        );
      }
      if (responsesData) setResponses(responsesData);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionStats = (question: Question) => {
    const questionAnswers = answers.filter(a => a.question_id === question.id);
    
    if (question.question_type === "radio" || question.question_type === "yesno") {
      const choices = question.question_type === "yesno" 
        ? ["Yes", "No"] 
        : (question.options?.choices || []);
      
      const counts: Record<string, number> = {};
      choices.forEach(c => { counts[c] = 0; });
      
      questionAnswers.forEach(a => {
        const answer = a.answer_text || "";
        if (counts[answer] !== undefined) {
          counts[answer]++;
        }
      });
      
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }
    
    if (question.question_type === "checkbox") {
      const choices = question.options?.choices || [];
      const counts: Record<string, number> = {};
      choices.forEach(c => { counts[c] = 0; });
      
      questionAnswers.forEach(a => {
        const selected = a.answer_value as string[] || [];
        selected.forEach(s => {
          if (counts[s] !== undefined) {
            counts[s]++;
          }
        });
      });
      
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }
    
    if (question.question_type === "rating") {
      const counts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      
      questionAnswers.forEach(a => {
        const rating = a.answer_text || "";
        if (counts[rating] !== undefined) {
          counts[rating]++;
        }
      });
      
      return Object.entries(counts).map(([name, value]) => ({ name: `${name} Star${name !== "1" ? "s" : ""}`, value }));
    }
    
    // For text/textarea, return the answers themselves
    return questionAnswers.map(a => ({ text: a.answer_text || "" }));
  };

  const calculateAvgRating = (question: Question) => {
    const questionAnswers = answers.filter(a => a.question_id === question.id);
    if (questionAnswers.length === 0) return 0;
    
    const sum = questionAnswers.reduce((acc, a) => {
      return acc + (parseInt(a.answer_text || "0") || 0);
    }, 0);
    
    return (sum / questionAnswers.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{responses.length}</p>
                <p className="text-xs text-muted-foreground">Total Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{questions.length}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {responses.length > 0 
                    ? new Date(responses[responses.length - 1].submitted_at).toLocaleDateString()
                    : "—"
                  }
                </p>
                <p className="text-xs text-muted-foreground">Last Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {responses.length > 0 && questions.length > 0 
                    ? Math.round((answers.length / (responses.length * questions.length)) * 100) 
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Results */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-1">No questions found</h3>
            <p className="text-sm text-muted-foreground">
              This survey doesn't have any questions yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => {
            const stats = getQuestionStats(question);
            const isChartable = ["radio", "yesno", "checkbox", "rating"].includes(question.question_type);
            const isTextBased = ["text", "textarea"].includes(question.question_type);
            
            return (
              <Card key={question.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <CardTitle className="text-base font-medium">{question.question_text}</CardTitle>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {question.question_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {responses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No responses yet
                    </p>
                  ) : isChartable ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Bar Chart */}
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats as { name: string; value: number }[]}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))", 
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px"
                              }} 
                            />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Pie Chart */}
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats as { name: string; value: number }[]}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              labelLine={false}
                            >
                              {(stats as { name: string; value: number }[]).map((_, i) => (
                                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))", 
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px"
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {question.question_type === "rating" && (
                        <div className="md:col-span-2 text-center">
                          <p className="text-sm text-muted-foreground">
                            Average Rating: <span className="text-foreground font-semibold text-lg">{calculateAvgRating(question)}</span> / 5
                          </p>
                        </div>
                      )}
                    </div>
                  ) : isTextBased ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(stats as { text: string }[]).length > 0 ? (
                        (stats as { text: string }[]).map((item, i) => (
                          <div key={i} className="p-3 bg-muted/50 rounded-lg text-sm text-foreground">
                            {item.text || <span className="text-muted-foreground italic">No response</span>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No text responses yet
                        </p>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}