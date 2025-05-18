-- Indexes for the stories table
CREATE INDEX IF NOT EXISTS idx_stories_published ON public.stories(published);
CREATE INDEX IF NOT EXISTS idx_stories_featured ON public.stories(featured);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at);
CREATE INDEX IF NOT EXISTS idx_stories_view_count ON public.stories(view_count);
-- Composite index for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_stories_published_featured_created ON public.stories(published, featured, created_at);

-- Indexes for the profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Indexes for the likes table
CREATE INDEX IF NOT EXISTS idx_likes_story_id ON public.likes(story_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_value ON public.likes(value);
-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_likes_story_user ON public.likes(story_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_story_value ON public.likes(story_id, value);

-- Indexes for the comments table
CREATE INDEX IF NOT EXISTS idx_comments_story_id ON public.comments(story_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

-- Indexes for the categories table
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Indexes for the story_categories table
CREATE INDEX IF NOT EXISTS idx_story_categories_story_id ON public.story_categories(story_id);
CREATE INDEX IF NOT EXISTS idx_story_categories_category_id ON public.story_categories(category_id);
