-- Create storage bucket for document attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for attachments bucket
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Staff can view all attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND public.is_staff_or_higher(auth.uid())
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add attachment_url column to feedback table
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Add attachment_url column to certificate_requests table
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT;