import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MessageSquare, Send, ThumbsUp, ThumbsDown, AlertTriangle, HelpCircle, Clock, CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/shared/FileUpload";

const feedbackSchema = z.object({
  type: z.string().min(1, "Please select a type"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Please provide more details (at least 20 characters)"),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackItem {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  created_at: string;
  responded_at: string | null;
  attachment_url: string | null;
}

const feedbackTypes = [
  { value: "suggestion", label: "Suggestion", icon: ThumbsUp, color: "bg-accent/10 text-accent" },
  { value: "complaint", label: "Complaint", icon: ThumbsDown, color: "bg-warning/10 text-warning" },
  { value: "grievance", label: "Grievance", icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
  { value: "inquiry", label: "Inquiry", icon: HelpCircle, color: "bg-info/10 text-info" },
];

const statusConfig = {
  pending: { icon: Clock, color: "bg-warning/10 text-warning", label: "Pending" },
  in_progress: { icon: MessageCircle, color: "bg-info/10 text-info", label: "In Progress" },
  resolved: { icon: CheckCircle, color: "bg-accent/10 text-accent", label: "Resolved" },
};

export default function Feedback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "",
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFeedback();
    }
  }, [user]);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (data && !error) {
        setFeedbackList(data);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const onSubmit = async (data: FeedbackFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        category: data.type,
        subject: data.subject,
        message: data.message,
        attachment_url: attachmentUrl,
      });

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback. We will review it shortly.",
      });
      
      form.reset();
      setSelectedType("");
      setAttachmentUrl(null);
      setAttachmentName(null);
      fetchFeedback();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
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

  return (
    <MainLayout>
      <div className="container py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-foreground">Feedback & Grievance Portal</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              We value your input. Share your suggestions, report issues, or submit grievances. Your voice helps us improve our services.
            </p>
          </div>

          {/* Feedback Type Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {feedbackTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;
              return (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedType(type.value);
                    form.setValue("type", type.value);
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className={`h-12 w-12 rounded-xl ${type.color} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-foreground">{type.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback Form */}
          <div className="bg-card rounded-xl border border-border p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display text-lg font-semibold">Submit Your Feedback</h2>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type">Feedback Type *</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value) => {
                    form.setValue("type", value);
                    setSelectedType(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {feedbackTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your feedback"
                  {...form.register("subject")}
                />
                {form.formState.errors.subject && (
                  <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Please provide detailed information about your feedback, suggestion, or concern..."
                  rows={6}
                  {...form.register("message")}
                />
                {form.formState.errors.message && (
                  <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Attachment (optional)</Label>
                <FileUpload
                  userId={user?.id || ""}
                  onUploadComplete={(url, name) => {
                    setAttachmentUrl(url);
                    setAttachmentName(name);
                  }}
                  onRemove={() => {
                    setAttachmentUrl(null);
                    setAttachmentName(null);
                  }}
                  currentFile={attachmentUrl && attachmentName ? { url: attachmentUrl, name: attachmentName } : null}
                  bucketFolder="feedback"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  <Send className="h-5 w-5 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </form>
          </div>

          {/* Previous Feedback */}
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Your Previous Feedback</h2>
            {loadingFeedback ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : feedbackList.length > 0 ? (
              <div className="space-y-4">
                {feedbackList.map((item) => {
                  const typeConfig = feedbackTypes.find(t => t.value === item.category);
                  const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const TypeIcon = typeConfig?.icon || MessageSquare;
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card rounded-xl border border-border p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`h-10 w-10 rounded-lg ${typeConfig?.color || "bg-muted"} flex items-center justify-center shrink-0`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-foreground">{item.subject}</h3>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.message}</p>
                            <p className="text-xs text-muted-foreground">
                              Submitted: {new Date(item.created_at).toLocaleDateString()}
                            </p>
                            {item.attachment_url && (
                              <a 
                                href={item.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                              >
                                <MessageSquare className="h-3 w-3" />
                                View Attachment
                              </a>
                            )}
                            {item.response && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs font-medium text-foreground mb-1">Response:</p>
                                <p className="text-sm text-muted-foreground">{item.response}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-1">No feedback yet</h3>
                <p className="text-sm text-muted-foreground">
                  Submit your first feedback using the form above
                </p>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Your feedback will be reviewed within 3-5 business days</li>
                <li>• You can track the status of your submissions above</li>
                <li>• Urgent grievances are prioritized and addressed promptly</li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">Need immediate assistance?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                For urgent matters, you can visit the Barangay Hall or contact us directly.
              </p>
              <p className="text-sm font-medium text-foreground">
                📞 (02) 8XXX-XXXX<br />
                📍 Barangay Hall, Main Street
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
