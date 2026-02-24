-- Create function to check if user is captain or higher (excludes regular staff)
CREATE OR REPLACE FUNCTION public.is_captain_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('captain', 'admin', 'super_admin')
  )
$$;

-- Drop existing staff policies on feedback table
DROP POLICY IF EXISTS "Staff can view all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Staff can update feedback" ON public.feedback;

-- Create more restrictive policies - only captain/admin/super_admin can view all feedback
CREATE POLICY "Management can view all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (is_captain_or_higher(auth.uid()));

-- Only captain/admin/super_admin can respond to feedback
CREATE POLICY "Management can update feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (is_captain_or_higher(auth.uid()));