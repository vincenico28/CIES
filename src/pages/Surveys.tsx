import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Calendar, Users, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  required: boolean | null;
  order_index: number;
}

interface SurveyResponse {
  survey_id: string;
}

export default function Surveys() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [completedSurveyIds, setCompletedSurveyIds] = useState<string[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSurveys();
    }
  }, [user]);

  const fetchSurveys = async () => {
    try {
      // Fetch active surveys
      const { data: surveysData } = await supabase
        .from("surveys")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (surveysData) {
        setSurveys(surveysData);
        
        // Fetch response counts for each survey
        const counts: Record<string, number> = {};
        for (const survey of surveysData) {
          const { count } = await supabase
            .from("survey_responses")
            .select("*", { count: "exact", head: true })
            .eq("survey_id", survey.id);
          counts[survey.id] = count || 0;
        }
        setResponseCounts(counts);
      }

      // Fetch user's completed surveys
      const { data: responsesData } = await supabase
        .from("survey_responses")
        .select("survey_id")
        .eq("user_id", user!.id);

      if (responsesData) {
        setCompletedSurveyIds(responsesData.map(r => r.survey_id));
      }
    } catch (error) {
      console.error("Error fetching surveys:", error);
    } finally {
      setLoadingSurveys(false);
    }
  };

  const openSurvey = async (survey: Survey) => {
    setSelectedSurvey(survey);
    setAnswers({});
    
    // Fetch questions for this survey
    const { data: questionsData } = await supabase
      .from("survey_questions")
      .select("*")
      .eq("survey_id", survey.id)
      .order("order_index", { ascending: true });

    if (questionsData) {
      const mappedQuestions = questionsData.map(q => ({
        ...q,
        // Handle options stored as { choices: [...] } object or as array
        options: q.options 
          ? (typeof q.options === 'object' && 'choices' in (q.options as object) 
              ? ((q.options as { choices: string[] }).choices) 
              : Array.isArray(q.options) ? q.options as string[] : null)
          : null
      }));
      setQuestions(mappedQuestions);
    }
    
    setDialogOpen(true);
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, option] };
      } else {
        return { ...prev, [questionId]: current.filter(o => o !== option) };
      }
    });
  };

  const submitSurvey = async () => {
    if (!selectedSurvey || !user) return;

    // Validate required questions
    const unansweredRequired = questions.filter(
      q => q.required && (!answers[q.id] || (Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0))
    );

    if (unansweredRequired.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing answers",
        description: "Please answer all required questions.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create survey response
      const { data: responseData, error: responseError } = await supabase
        .from("survey_responses")
        .insert({
          survey_id: selectedSurvey.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Create answers
      const answersToInsert = Object.entries(answers).map(([questionId, value]) => ({
        response_id: responseData.id,
        question_id: questionId,
        answer_text: Array.isArray(value) ? value.join(", ") : value,
        answer_value: value,
      }));

      const { error: answersError } = await supabase
        .from("survey_answers")
        .insert(answersToInsert);

      if (answersError) throw answersError;

      toast({
        title: "Survey submitted",
        description: "Thank you for participating in the survey!",
      });

      setDialogOpen(false);
      fetchSurveys();
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit survey. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  const activeSurveys = surveys.filter(s => !completedSurveyIds.includes(s.id));
  const completedSurveys = surveys.filter(s => completedSurveyIds.includes(s.id));

  return (
    <MainLayout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="font-display text-3xl font-bold text-foreground">Public Consultations & Surveys</h1>
            <p className="text-muted-foreground mt-2">
              Your voice matters! Participate in community surveys and help shape the future of our barangay.
            </p>
          </div>

          {loadingSurveys ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Active Surveys */}
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                  </span>
                  Active Surveys
                </h2>
                
                {activeSurveys.length > 0 ? (
                  <div className="grid gap-6">
                    {activeSurveys.map((survey, index) => (
                      <motion.div
                        key={survey.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <ClipboardList className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                                  {survey.title}
                                </h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                  {survey.description || "Help us gather community feedback on important topics."}
                                </p>
                                <div className="flex flex-wrap gap-4 text-sm">
                                  {survey.end_date && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Calendar className="h-4 w-4" />
                                      <span>Ends: {new Date(survey.end_date).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>{responseCounts[survey.id] || 0} participants</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                              Active
                            </span>
                            <Button onClick={() => openSurvey(survey)}>
                              Take Survey
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-xl border border-border p-8 text-center">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-1">No active surveys</h3>
                    <p className="text-sm text-muted-foreground">
                      Check back later for new community surveys and consultations.
                    </p>
                  </div>
                )}
              </section>

              {/* Completed Surveys */}
              {completedSurveys.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    Completed Surveys
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {completedSurveys.map((survey, index) => (
                      <motion.div
                        key={survey.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="bg-muted/50 rounded-xl p-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-accent" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{survey.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span>{responseCounts[survey.id] || 0} participants</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                            Completed
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center"
          >
            <Clock className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-display font-semibold text-lg text-foreground mb-2">
              Stay Updated on New Surveys
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              Enable notifications to be the first to know when new community surveys and consultations are available.
            </p>
            <Button variant="outline" onClick={() => navigate("/notifications")}>
              View Notifications
            </Button>
          </motion.div>
        </motion.div>

        {/* Survey Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{selectedSurvey?.title}</DialogTitle>
              {selectedSurvey?.description && (
                <p className="text-muted-foreground text-sm mt-1">{selectedSurvey.description}</p>
              )}
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <Label className="text-base">
                    {index + 1}. {question.question_text}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </Label>

                  {(question.question_type === "text" || question.question_type === "textarea") && (
                    <Textarea
                      placeholder="Type your answer..."
                      value={(answers[question.id] as string) || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      rows={question.question_type === "textarea" ? 4 : 2}
                    />
                  )}

                  {(question.question_type === "radio" || question.question_type === "single_choice") && question.options && (
                    <RadioGroup
                      value={(answers[question.id] as string) || ""}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {(question.question_type === "checkbox" || question.question_type === "multiple_choice") && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${question.id}-${optIndex}`}
                            checked={((answers[question.id] as string[]) || []).includes(option)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(question.id, option, checked as boolean)
                            }
                          />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.question_type === "yes_no" && (
                    <RadioGroup
                      value={(answers[question.id] as string) || ""}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                        <Label htmlFor={`${question.id}-yes`} className="font-normal">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`${question.id}-no`} />
                        <Label htmlFor={`${question.id}-no`} className="font-normal">No</Label>
                      </div>
                    </RadioGroup>
                  )}

                  {question.question_type === "rating" && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          type="button"
                          variant={(answers[question.id] as string) === String(rating) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAnswerChange(question.id, String(rating))}
                        >
                          {rating}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitSurvey} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Survey"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
