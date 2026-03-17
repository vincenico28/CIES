-- Create enum for ID verification status
CREATE TYPE public.id_verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Add ID verification columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_verification_status public.id_verification_status DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_expiry_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_verified_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_rejection_reason TEXT;

-- Create storage policies for ID documents in attachments bucket
CREATE POLICY "Users can upload their own ID documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow staff to view all ID documents
CREATE POLICY "Staff can view all ID documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND public.is_staff_or_higher(auth.uid())
);
