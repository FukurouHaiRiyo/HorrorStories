-- Create a function to get related stories based on shared categories
CREATE OR REPLACE FUNCTION get_related_stories(
    story_id_param UUID,
    limit_param INT DEFAULT 5
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
    relevance_score INT
) AS $$
BEGIN
    RETURN QUERY
    WITH story_categories AS (
        -- Get categories of the input story
        SELECT category_id FROM public.story_categories WHERE story_id = story_id_param
    ),
    related_stories AS (
        -- Find stories that share categories with the input story
        SELECT 
            sc.story_id,
            COUNT(DISTINCT sc.category_id) AS shared_categories
        FROM 
            public.story_categories sc
        JOIN 
            story_categories c ON sc.category_id = c.category_id
        WHERE 
            sc.story_id != story_id_param
        GROUP BY 
            sc.story_id
        ORDER BY 
            shared_categories DESC
        LIMIT limit_param
    )
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
        rs.shared_categories AS relevance_score
    FROM 
        public.stories s
    JOIN 
        related_stories rs ON s.id = rs.story_id
    LEFT JOIN 
        public.likes l ON s.id = l.story_id
    LEFT JOIN 
        public.comments c ON s.id = c.story_id
    WHERE 
        s.published = true
    GROUP BY 
        s.id, rs.shared_categories
    ORDER BY 
        rs.shared_categories DESC, s.view_count DESC;
END;
$$ LANGUAGE plpgsql;
