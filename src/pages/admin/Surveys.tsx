import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  BarChart3,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SurveyQuestionBuilder } from "@/components/admin/SurveyQuestionBuilder";
import { SurveyResultsView } from "@/components/admin/SurveyResultsView";

interface Profile {
  first_name: string;
  last_name: string;
  email: string | null;
}

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  required: boolean;
  options: { choices?: string[] } | null;
  order_index: number;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-accent/10 text-accent",
  closed: "bg-warning/10 text-warning",
};

export default function AdminSurveys() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading, isStaffOrHigher } = useUserRole();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSurvey, setNewSurvey] = useState({ title: "", description: "" });
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [viewingResults, setViewingResults] = useState<Survey | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && user && !isStaffOrHigher) {
      toast({ title: "Access Denied", description: "You don't have permission to access this page.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [roleLoading, isStaffOrHigher, navigate, user]);

  useEffect(() => {
    if (user && isStaffOrHigher) {
      fetchData();
    }
  }, [user, isStaffOrHigher]);

  const fetchData = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (profileData) setProfile(profileData);

      const { data: surveysData } = await supabase
        .from("surveys")
        .select("*")
        .order("created_at", { ascending: false });

      if (surveysData) setSurveys(surveysData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const createSurvey = async () => {
    if (!newSurvey.title.trim()) {
      toast({ title: "Error", description: "Please enter a survey title", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("surveys")
        .insert({
          title: newSurvey.title,
          description: newSurvey.description || null,
          status: "draft",
          created_by: user!.id,
        });

      if (error) throw error;

      toast({ title: "Survey Created", description: "Your survey has been created as a draft" });
      setCreateDialogOpen(false);
      setNewSurvey({ title: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating survey:", error);
      toast({ title: "Error", description: "Failed to create survey", variant: "destructive" });
    }
  };

  const updateSurveyStatus = async (surveyId: string, newStatus: string) => {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "active") {
        updates.start_date = new Date().toISOString();
      } else if (newStatus === "closed") {
        updates.end_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("surveys")
        .update(updates)
        .eq("id", surveyId);

      if (error) throw error;

      toast({ title: "Status Updated", description: `Survey status changed to ${newStatus}` });
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update survey status", variant: "destructive" });
    }
  };

  const deleteSurvey = async (surveyId: string) => {
    try {
      const { error } = await supabase
        .from("surveys")
        .delete()
        .eq("id", surveyId);

      if (error) throw error;

      toast({ title: "Survey Deleted", description: "The survey has been deleted" });
      fetchData();
    } catch (error) {
      console.error("Error deleting survey:", error);
      toast({ title: "Error", description: "Failed to delete survey", variant: "destructive" });
    }
  };

  const openQuestionBuilder = async (survey: Survey) => {
    setEditingSurvey(survey);
    
    // Fetch existing questions
    const { data: questions } = await supabase
      .from("survey_questions")
      .select("*")
      .eq("survey_id", survey.id)
      .order("order_index");

    if (questions) {
      setSurveyQuestions(
        questions.map((q) => ({
          ...q,
          options: q.options as { choices?: string[] } | null,
        }))
      );
    } else {
      setSurveyQuestions([]);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
    navigate("/");
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar userRole={role} onSignOut={handleSignOut} />

      <main className="flex-1">
        <DashboardHeader
          profile={profile}
          userRole={role}
          title="Manage Surveys"
          subtitle="Create and manage community surveys"
          onSignOut={handleSignOut}
        />

        <div className="p-6 space-y-6">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {surveys.length} surveys total
            </span>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Create Survey
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Survey</DialogTitle>
                  <DialogDescription>
                    Create a new survey for community feedback
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Survey Title</Label>
                    <Input
                      id="title"
                      value={newSurvey.title}
                      onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                      placeholder="Enter survey title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newSurvey.description}
                      onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                      placeholder="Enter survey description (optional)"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={createSurvey}>Create Survey</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Surveys Grid */}
          {loadingData ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : surveys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map((survey) => (
                <div key={survey.id} className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {survey.status === "draft" && (
                          <>
                            <DropdownMenuItem onClick={() => openQuestionBuilder(survey)}>
                              <Settings2 className="h-4 w-4 mr-2" /> Edit Questions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateSurveyStatus(survey.id, "active")}>
                              <Play className="h-4 w-4 mr-2" /> Activate
                            </DropdownMenuItem>
                          </>
                        )}
                        {survey.status === "active" && (
                          <DropdownMenuItem onClick={() => updateSurveyStatus(survey.id, "closed")}>
                            <Pause className="h-4 w-4 mr-2" /> Close
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setViewingResults(survey)}>
                          <BarChart3 className="h-4 w-4 mr-2" /> View Results
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteSurvey(survey.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-medium text-foreground mb-2">{survey.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {survey.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={statusColors[survey.status]}>
                      {survey.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(survey.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No surveys yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first survey to gather community feedback
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Survey
              </Button>
            </div>
          )}
        </div>

        {/* Question Builder Sheet */}
        <Sheet open={!!editingSurvey} onOpenChange={(open) => !open && setEditingSurvey(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Survey Questions</SheetTitle>
              <SheetDescription>
                {editingSurvey?.title} - Add and manage questions for this survey
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              {editingSurvey && (
                <SurveyQuestionBuilder
                  surveyId={editingSurvey.id}
                  questions={surveyQuestions.map((q) => ({
                    id: q.id,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    required: q.required,
                    options: q.options?.choices || null,
                    order_index: q.order_index,
                  }))}
                  onQuestionsChange={() => {
                    setEditingSurvey(null);
                    fetchData();
                  }}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Results View Sheet */}
        <Sheet open={!!viewingResults} onOpenChange={(open) => !open && setViewingResults(null)}>
          <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Survey Results</SheetTitle>
              <SheetDescription>
                {viewingResults?.title} - View responses and analytics
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              {viewingResults && (
                <SurveyResultsView
                  surveyId={viewingResults.id}
                  surveyTitle={viewingResults.title}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}