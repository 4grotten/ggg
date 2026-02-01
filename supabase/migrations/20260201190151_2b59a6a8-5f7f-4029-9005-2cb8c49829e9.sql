-- Create saved_contacts table for storing user contacts
CREATE TABLE public.saved_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Basic info
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  position TEXT,
  avatar_url TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Payment methods (JSON array)
  payment_methods JSONB DEFAULT '[]'::jsonb,
  
  -- Social links (JSON array)
  social_links JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_contacts ENABLE ROW LEVEL SECURITY;

-- Users can view their own contacts
CREATE POLICY "Users can view their own contacts"
ON public.saved_contacts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own contacts
CREATE POLICY "Users can create their own contacts"
ON public.saved_contacts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own contacts
CREATE POLICY "Users can update their own contacts"
ON public.saved_contacts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own contacts
CREATE POLICY "Users can delete their own contacts"
ON public.saved_contacts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_contacts_updated_at
BEFORE UPDATE ON public.saved_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for contact avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contact-avatars', 'contact-avatars', true);

-- Storage policies for contact avatars
CREATE POLICY "Contact avatars are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'contact-avatars');

CREATE POLICY "Users can upload contact avatars"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'contact-avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their contact avatars"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'contact-avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their contact avatars"
ON storage.objects
FOR DELETE
USING (bucket_id = 'contact-avatars' AND auth.uid() IS NOT NULL);