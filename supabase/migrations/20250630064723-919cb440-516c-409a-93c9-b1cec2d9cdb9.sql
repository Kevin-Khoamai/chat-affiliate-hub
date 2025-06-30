
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;
DROP POLICY IF EXISTS "Users can view groups they're members of" ON public.chat_groups;

-- Create a security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$;

-- Create a security definer function to get user's groups
CREATE OR REPLACE FUNCTION public.get_user_groups(_user_id uuid)
RETURNS TABLE(group_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT gm.group_id
  FROM public.group_members gm
  WHERE gm.user_id = _user_id;
$$;

-- Recreate the policies using the security definer functions
CREATE POLICY "Users can view group memberships" ON public.group_members
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    public.is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Users can view groups they're members of" ON public.chat_groups
  FOR SELECT 
  USING (
    id IN (SELECT group_id FROM public.get_user_groups(auth.uid()))
  );
