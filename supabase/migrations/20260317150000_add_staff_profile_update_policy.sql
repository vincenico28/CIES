-- Add missing RLS policy to allow staff and higher roles to update ID verification fields
-- This fixes the issue where admin staff couldn't approve/reject ID documents

CREATE POLICY "Staff can update ID verification fields"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_staff_or_higher(auth.uid()))
WITH CHECK (public.is_staff_or_higher(auth.uid()));
