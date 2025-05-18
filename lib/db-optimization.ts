import { getSupabaseBrowserClient } from "@/lib/supabase"

/**
 * Utility function to run database optimization scripts
 * This should be called from an admin page or setup script
 */
export async function runDatabaseOptimizations() {
  try {
    const supabase = getSupabaseBrowserClient()

    // Read the SQL files
    const createIndexesSQL = `
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
    `

    // Execute the SQL
    const { error: indexError } = await supabase.rpc("exec_sql", { sql: createIndexesSQL })

    if (indexError) {
      console.error("Error creating indexes:", indexError)
      return { success: false, error: indexError }
    }

    // Create the materialized view and functions
    const createViewSQL = `
    -- Create a materialized view for story statistics
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
    `

    const { error: viewError } = await supabase.rpc("exec_sql", { sql: createViewSQL })

    if (viewError) {
      console.error("Error creating materialized view:", viewError)
      return { success: false, error: viewError }
    }

    // Create the trending stories function
    const trendingFunctionSQL = `
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
    `

    const { error: trendingError } = await supabase.rpc("exec_sql", { sql: trendingFunctionSQL })

    if (trendingError) {
      console.error("Error creating trending function:", trendingError)
      return { success: false, error: trendingError }
    }

    // Create the related stories function
    const relatedFunctionSQL = `
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
    `

    const { error: relatedError } = await supabase.rpc("exec_sql", { sql: relatedFunctionSQL })

    if (relatedError) {
      console.error("Error creating related stories function:", relatedError)
      return { success: false, error: relatedError }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error running database optimizations:", error)
    return { success: false, error }
  }
}
