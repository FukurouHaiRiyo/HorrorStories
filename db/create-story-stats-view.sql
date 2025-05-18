-- Create a materialized view for story statistics
-- This will denormalize and pre-calculate common statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS story_statistics AS
SELECT 
    s.id AS story_id,
    s.title,
    s.author_id,
    s.published,
    s.featured,
    s.view_count,
    s.created_at,
    COUNT(DISTINCT c.id) AS comment_count,
    COUNT(DISTINCT CASE WHEN l.value = 1 THEN l.id END) AS like_count,
    COUNT(DISTINCT CASE WHEN l.value = -1 THEN l.id END) AS dislike_count,
    ARRAY_AGG(DISTINCT sc.category_id) AS category_ids
FROM 
    public.stories s
LEFT JOIN 
    public.comments c ON s.id = c.story_id
LEFT JOIN 
    public.likes l ON s.id = l.story_id
LEFT JOIN 
    public.story_categories sc ON s.id = sc.story_id
WHERE 
    s.published = true
GROUP BY 
    s.id;

-- Create indexes on the materialized view
CREATE INDEX IF NOT EXISTS idx_story_statistics_story_id ON story_statistics(story_id);
CREATE INDEX IF NOT EXISTS idx_story_statistics_featured ON story_statistics(featured);
CREATE INDEX IF NOT EXISTS idx_story_statistics_view_count ON story_statistics(view_count);
CREATE INDEX IF NOT EXISTS idx_story_statistics_like_count ON story_statistics(like_count);
CREATE INDEX IF NOT EXISTS idx_story_statistics_created_at ON story_statistics(created_at);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_story_statistics()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY story_statistics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the materialized view when data changes
DROP TRIGGER IF EXISTS refresh_story_statistics_trigger ON public.stories;
CREATE TRIGGER refresh_story_statistics_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.stories
FOR EACH STATEMENT EXECUTE FUNCTION refresh_story_statistics();

DROP TRIGGER IF EXISTS refresh_story_statistics_trigger_comments ON public.comments;
CREATE TRIGGER refresh_story_statistics_trigger_comments
AFTER INSERT OR UPDATE OR DELETE ON public.comments
FOR EACH STATEMENT EXECUTE FUNCTION refresh_story_statistics();

DROP TRIGGER IF EXISTS refresh_story_statistics_trigger_likes ON public.likes;
CREATE TRIGGER refresh_story_statistics_trigger_likes
AFTER INSERT OR UPDATE OR DELETE ON public.likes
FOR EACH STATEMENT EXECUTE FUNCTION refresh_story_statistics();

DROP TRIGGER IF EXISTS refresh_story_statistics_trigger_categories ON public.story_categories;
CREATE TRIGGER refresh_story_statistics_trigger_categories
AFTER INSERT OR UPDATE OR DELETE ON public.story_categories
FOR EACH STATEMENT EXECUTE FUNCTION refresh_story_statistics();
