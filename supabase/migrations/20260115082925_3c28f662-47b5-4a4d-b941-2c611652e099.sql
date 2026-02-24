-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('suggestion', 'complaint', 'grievance', 'inquiry')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID,
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create surveys table
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create survey questions table
CREATE TABLE public.survey_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'text', 'rating', 'yes_no')),
  options JSONB,
  required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create survey responses table
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(survey_id, user_id)
);

-- Create survey answers table
CREATE TABLE public.survey_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'alert', 'success')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'residents', 'staff', 'specific')),
  target_user_ids UUID[],
  is_read_by UUID[] DEFAULT '{}',
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "Users can create feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all feedback" ON public.feedback FOR SELECT USING (is_staff_or_higher(auth.uid()));
CREATE POLICY "Staff can update feedback" ON public.feedback FOR UPDATE USING (is_staff_or_higher(auth.uid()));

-- Surveys policies
CREATE POLICY "Anyone can view active surveys" ON public.surveys FOR SELECT USING (status = 'active' OR is_staff_or_higher(auth.uid()));
CREATE POLICY "Staff can manage surveys" ON public.surveys FOR ALL USING (is_staff_or_higher(auth.uid()));

-- Survey questions policies
CREATE POLICY "Anyone can view questions of active surveys" ON public.survey_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_id AND (status = 'active' OR is_staff_or_higher(auth.uid())))
);
CREATE POLICY "Staff can manage questions" ON public.survey_questions FOR ALL USING (is_staff_or_higher(auth.uid()));

-- Survey responses policies
CREATE POLICY "Users can submit responses" ON public.survey_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their responses" ON public.survey_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all responses" ON public.survey_responses FOR SELECT USING (is_staff_or_higher(auth.uid()));

-- Survey answers policies
CREATE POLICY "Users can submit answers" ON public.survey_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.survey_responses WHERE id = response_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view their answers" ON public.survey_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.survey_responses WHERE id = response_id AND user_id = auth.uid())
);
CREATE POLICY "Staff can view all answers" ON public.survey_answers FOR SELECT USING (is_staff_or_higher(auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view notifications" ON public.notifications FOR SELECT USING (
  target_audience = 'all' 
  OR (target_audience = 'specific' AND auth.uid() = ANY(target_user_ids))
  OR is_staff_or_higher(auth.uid())
);
CREATE POLICY "Staff can manage notifications" ON public.notifications FOR ALL USING (is_staff_or_higher(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();