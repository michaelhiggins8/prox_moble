-- Enable RLS on other_categories table (if not already enabled)
ALTER TABLE other_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own categories
CREATE POLICY "Users can view their own categories" ON other_categories
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own categories
CREATE POLICY "Users can insert their own categories" ON other_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own categories
CREATE POLICY "Users can update their own categories" ON other_categories
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own categories
CREATE POLICY "Users can delete their own categories" ON other_categories
  FOR DELETE USING (auth.uid() = user_id);
