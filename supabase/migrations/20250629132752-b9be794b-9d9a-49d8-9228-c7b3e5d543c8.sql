
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  commission_rate DECIMAL(5,2) NOT NULL,
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create academy table
CREATE TABLE public.academy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_groups table
CREATE TABLE public.chat_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.chat_groups ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users ON DELETE CASCADE,
  group_id UUID REFERENCES public.chat_groups ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_hash TEXT,
  encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT message_target_check CHECK (
    (recipient_id IS NOT NULL AND group_id IS NULL) OR
    (recipient_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Campaigns policies (public read access)
CREATE POLICY "Anyone can view campaigns" ON public.campaigns FOR SELECT USING (true);

-- Academy policies (public read access)
CREATE POLICY "Anyone can view academy content" ON public.academy FOR SELECT USING (true);

-- Chat groups policies
CREATE POLICY "Users can view groups they're members of" ON public.chat_groups FOR SELECT 
  USING (
    id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create groups" ON public.chat_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group creators can update their groups" ON public.chat_groups FOR UPDATE USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Users can view group memberships" ON public.group_members FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT 
  USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    (group_id IS NOT NULL AND group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    ))
  );
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND (
      (recipient_id IS NOT NULL) OR
      (group_id IS NOT NULL AND group_id IN (
        SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
      ))
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.campaigns (name, description, commission_rate, performance_metrics) VALUES
  ('Summer Fashion Sale', 'High-converting fashion campaign targeting summer trends', 15.00, '{"conversion_rate": 23, "clicks": 1200, "sales": 89}'),
  ('Tech Gadgets Promo', 'Electronics and gadgets with excellent conversion rates', 12.00, '{"conversion_rate": 18, "clicks": 980, "sales": 67}'),
  ('Home & Garden', 'Home improvement and gardening products', 10.00, '{"conversion_rate": 8, "clicks": 750, "sales": 45}');

INSERT INTO public.academy (title, content, category, url) VALUES
  ('Affiliate Marketing Basics', 'Learn the fundamentals of affiliate marketing, including how to choose profitable niches, find quality products to promote, and build your audience.', 'Basics', '/academy/basics'),
  ('Conversion Optimization', 'Advanced techniques to boost your conversion rates including A/B testing, landing page optimization, and psychological triggers.', 'Advanced', '/academy/optimization'),
  ('Traffic Generation', 'Proven methods to drive quality traffic to your offers including SEO, social media marketing, and paid advertising strategies.', 'Marketing', '/academy/traffic'),
  ('Email Marketing for Affiliates', 'Build and nurture an email list that converts. Learn autoresponder sequences, segmentation, and email design best practices.', 'Marketing', '/academy/email-marketing'),
  ('Social Media Strategies', 'Leverage social platforms to promote affiliate offers effectively while building authentic relationships with your audience.', 'Marketing', '/academy/social-media');

-- Create default chat groups
INSERT INTO public.chat_groups (name, description) VALUES
  ('General Discussion', 'Open discussion for all affiliate marketers'),
  ('High Performers', 'Exclusive group for top-performing affiliates'),
  ('Beginners Hub', 'Support and guidance for newcomers'),
  ('Marketing Strategies', 'Share and discuss marketing techniques');

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for group members
ALTER TABLE public.group_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
