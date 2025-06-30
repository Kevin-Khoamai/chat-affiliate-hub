
-- Drop all existing policies for chat_groups
DROP POLICY IF EXISTS "Users can view groups they're members of" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.chat_groups;

-- Drop all existing policies for group_members  
DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

-- Create new policies for chat_groups
CREATE POLICY "Authenticated users can view all chat groups" ON public.chat_groups
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can create groups" ON public.chat_groups 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups" ON public.chat_groups 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = created_by);

-- Create new policies for group_members
CREATE POLICY "Users can view all group memberships" ON public.group_members
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can join any group" ON public.group_members 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups they joined" ON public.group_members 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);
