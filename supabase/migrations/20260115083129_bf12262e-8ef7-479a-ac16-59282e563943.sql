-- Fix RLS policies for user_roles table
-- Drop existing policies and recreate with proper security

-- First, drop the existing policies on user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create proper permissive policies for user_roles
-- Users can only view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins and super admins can manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Fix RLS policies for certificate_requests table
-- Drop existing policies
DROP POLICY IF EXISTS "Staff can update requests" ON public.certificate_requests;
DROP POLICY IF EXISTS "Staff can view all requests" ON public.certificate_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON public.certificate_requests;
DROP POLICY IF EXISTS "Users can update their pending requests" ON public.certificate_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.certificate_requests;

-- Create proper permissive policies for certificate_requests
-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.certificate_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Staff and higher can view all requests
CREATE POLICY "Staff can view all requests"
ON public.certificate_requests
FOR SELECT
TO authenticated
USING (is_staff_or_higher(auth.uid()));

-- Users can create their own requests
CREATE POLICY "Users can create requests"
ON public.certificate_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests"
ON public.certificate_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending'::request_status);

-- Staff can update any request
CREATE POLICY "Staff can update requests"
ON public.certificate_requests
FOR UPDATE
TO authenticated
USING (is_staff_or_higher(auth.uid()));