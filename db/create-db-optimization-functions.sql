-- Function to run VACUUM
CREATE OR REPLACE FUNCTION run_vacuum()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- VACUUM can't be executed directly in a function
  -- This is a placeholder. In reality, you would need to use pg_catalog.pg_stat_statements
  -- or have a separate process that runs VACUUM
  RAISE NOTICE 'VACUUM operation would be executed here';
END;
$$;

-- Function to run ANALYZE
CREATE OR REPLACE FUNCTION run_analyze()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ANALYZE;
END;
$$;

-- Function to run REINDEX
CREATE OR REPLACE FUNCTION run_reindex()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- REINDEX can't be executed directly in a function
  -- This is a placeholder. In reality, you would need to use pg_catalog.pg_stat_statements
  -- or have a separate process that runs REINDEX
  RAISE NOTICE 'REINDEX operation would be executed here';
END;
$$;

-- Function to get database statistics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'table_stats', (
      SELECT json_agg(json_build_object(
        'table_name', relname,
        'total_rows', n_live_tup,
        'dead_rows', n_dead_tup,
        'last_vacuum', last_vacuum,
        'last_analyze', last_analyze
      ))
      FROM pg_stat_user_tables
    ),
    'index_stats', (
      SELECT json_agg(json_build_object(
        'index_name', indexrelname,
        'table_name', relname,
        'index_size', pg_size_pretty(pg_relation_size(indexrelid))
      ))
      FROM pg_stat_user_indexes
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
