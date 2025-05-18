-- Create a function to get trending stories based on a weighted score
CREATE OR REPLACE FUNCTION get_trending_stories(
    days_limit INT DEFAULT 7,
    results_limit INT DEFAULT 10
)
RETURNS TABLE (
    story_id UUID,
    title TEXT,
    excerpt TEXT,
    image_url TEXT,
    author_id UUID,
    created_at TIMESTAMPTZ,
    view_count INT,
    like_count BIGINT,
    comment_count BIGINT,
    trending_score NUMERIC
) AS $$
DECLARE
    date_threshold TIMESTAMPTZ := NOW() - (days_limit * INTERVAL '1 day');
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.excerpt,
        s.image_url,
        s.author_id,
        s.created_at,
        s.view_count,
        COALESCE(COUNT(DISTINCT CASE WHEN l.value = 1 THEN l.id END), 0) AS like_count,
        COALESCE(COUNT(DISTINCT c.id), 0) AS comment_count,
        -- Calculate trending score with weights
        (s.view_count * 1.0 + 
         COALESCE(COUNT(DISTINCT CASE WHEN l.value = 1 THEN l.id END), 0) * 5.0 + 
         COALESCE(COUNT(DISTINCT c.id), 0) * 10.0) *
        -- Apply time decay factor (more recent = higher score)
        (1.0 / (EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 86400.0 + 1.0)) AS trending_score
    FROM 
        public.stories s
    LEFT JOIN 
        public.likes l ON s.id = l.story_id
    LEFT JOIN 
        public.comments c ON s.id = c.story_id
    WHERE 
        s.published = true AND
        s.created_at >= date_threshold
    GROUP BY 
        s.id
    ORDER BY 
        trending_score DESC
    LIMIT results_limit;
END;
$$ LANGUAGE plpgsql;
