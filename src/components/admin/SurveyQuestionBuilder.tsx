import { useState } from "react";
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SurveyQuestion {
  id?: string;
  question_text: string;
  question_type: string;
  required: boolean;
  options: string[] | null;
  order_index: number;
}

interface SurveyQuestionBuilderProps {
  surveyId: string;
  questions: SurveyQuestion[];
  onQuestionsChange: () => void;
}

const questionTypes = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "radio", label: "Multiple Choice (Single)" },
  { value: "checkbox", label: "Multiple Choice (Multiple)" },
  { value: "rating", label: "Rating (1-5)" },
  { value: "yes_no", label: "Yes/No" },
];

export function SurveyQuestionBuilder({
  surveyId,
  questions,
  onQuestionsChange,
}: SurveyQuestionBuilderProps) {
  const { toast } = useToast();
  const [localQuestions, setLocalQuestions] = useState<SurveyQuestion[]>(
    questions.length > 0
      ? questions
      : [{ question_text: "", question_type: "text", required: true, options: null, order_index: 0 }]
  );
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setLocalQuestions([
      ...localQuestions,
      {
        question_text: "",
        question_type: "text",
        required: true,
        options: null,
        order_index: localQuestions.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (localQuestions.length === 1) {
      toast({ title: "Error", description: "Survey must have at least one question", variant: "destructive" });
      return;
    }
    const updated = localQuestions.filter((_, i) => i !== index).map((q, i) => ({
      ...q,
      order_index: i,
    }));
    setLocalQuestions(updated);
  };

  const updateQuestion = (index: number, field: keyof SurveyQuestion, value: unknown) => {
    const updated = [...localQuestions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Initialize options array for choice-based questions
    if (field === "question_type" && (value === "radio" || value === "checkbox")) {
      if (!updated[index].options || updated[index].options.length === 0) {
        updated[index].options = ["Option 1", "Option 2"];
      }
    }
    
    setLocalQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...localQuestions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex] = value;
      setLocalQuestions(updated);
    }
  };

  const addOption = (questionIndex: number) => {
    const updated = [...localQuestions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options!.push(`Option ${updated[questionIndex].options!.length + 1}`);
      setLocalQuestions(updated);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...localQuestions];
    if (updated[questionIndex].options && updated[questionIndex].options!.length > 2) {
      updated[questionIndex].options!.splice(optionIndex, 1);
      setLocalQuestions(updated);
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === localQuestions.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...localQuestions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((q, i) => (q.order_index = i));
    setLocalQuestions(updated);
  };

  const saveQuestions = async () => {
    // Validate questions
    for (const q of localQuestions) {
      if (!q.question_text.trim()) {
        toast({ title: "Error", description: "All questions must have text", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      // Delete existing questions for this survey
      const { error: deleteError } = await supabase
        .from("survey_questions")
        .delete()
        .eq("survey_id", surveyId);

      if (deleteError) throw deleteError;

      // Insert new questions
      const questionsToInsert = localQuestions.map((q, index) => ({
        survey_id: surveyId,
        question_text: q.question_text,
        question_type: q.question_type,
        required: q.required,
        options: q.options ? { choices: q.options } : null,
        order_index: index,
      }));

      const { error: insertError } = await supabase
        .from("survey_questions")
        .insert(questionsToInsert);

      if (insertError) throw insertError;

      toast({ title: "Success", description: "Questions saved successfully" });
      onQuestionsChange();
    } catch (error) {
      console.error("Error saving questions:", error);
      toast({ title: "Error", description: "Failed to save questions", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {localQuestions.map((question, index) => (
        <Card key={index} className="relative">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Question {index + 1}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveQuestion(index, "up")}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveQuestion(index, "down")}
                  disabled={index === localQuestions.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Textarea
                  value={question.question_text}
                  onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                  placeholder="Enter your question..."
                  rows={2}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={question.question_type}
                    onValueChange={(value) => updateQuestion(index, "question_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked) => updateQuestion(index, "required", checked)}
                  />
                  <Label className="text-sm">Required</Label>
                </div>
              </div>
            </div>

            {/* Options for choice-based questions */}
            {(question.question_type === "radio" || question.question_type === "checkbox") && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  {question.options?.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index, optionIndex)}
                        disabled={question.options!.length <= 2}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(index)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Option
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-2" /> Add Question
        </Button>
        <Button onClick={saveQuestions} disabled={saving}>
          {saving ? "Saving..." : "Save Questions"}
        </Button>
      </div>
    </div>
  );
}
