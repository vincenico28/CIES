-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('resident', 'staff', 'captain', 'admin', 'super_admin');

-- Create enum for certificate types
CREATE TYPE public.certificate_type AS ENUM ('birth', 'marriage', 'death', 'residency', 'indigency', 'clearance');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('pending', 'processing', 'approved', 'rejected', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  suffix TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  barangay TEXT,
  city TEXT,
  province TEXT,
  zip_code TEXT,
  birth_date DATE,
  gender TEXT,
  civil_status TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'resident',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create certificate_requests table
CREATE TABLE public.certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  certificate_type certificate_type NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  purpose TEXT NOT NULL,
  
  -- Common fields
  requestor_name TEXT NOT NULL,
  requestor_address TEXT,
  requestor_contact TEXT,
  
  -- Birth certificate fields
  child_name TEXT,
  child_birth_date DATE,
  child_birth_place TEXT,
  father_name TEXT,
  mother_name TEXT,
  
  -- Marriage certificate fields
  husband_name TEXT,
  wife_name TEXT,
  marriage_date DATE,
  marriage_place TEXT,
  
  -- Death certificate fields
  deceased_name TEXT,
  death_date DATE,
  death_place TEXT,
  cause_of_death TEXT,
  
  -- Processing fields
  remarks TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  certificate_number TEXT,
  
  -- File attachments
  supporting_documents TEXT[],
  certificate_file_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_requests ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is staff or higher
CREATE OR REPLACE FUNCTION public.is_staff_or_higher(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('staff', 'captain', 'admin', 'super_admin')
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_staff_or_higher(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Certificate requests policies
CREATE POLICY "Users can view their own requests"
ON public.certificate_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
ON public.certificate_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending requests"
ON public.certificate_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Staff can view all requests"
ON public.certificate_requests FOR SELECT
USING (public.is_staff_or_higher(auth.uid()));

CREATE POLICY "Staff can update requests"
ON public.certificate_requests FOR UPDATE
USING (public.is_staff_or_higher(auth.uid()));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  );
  
  -- Assign default resident role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'resident');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificate_requests_updated_at
  BEFORE UPDATE ON public.certificate_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();