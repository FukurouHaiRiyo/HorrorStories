-- Function to vacuum and analyze tables
CREATE OR REPLACE FUNCTION vacuum_analyze_tables()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_name text;
  result text := 'VACUUM ANALYZE completed for tables: ';
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'VACUUM ANALYZE ' || quote_ident(table_name);
    result := result || table_name || ', ';
  END LOOP;
  
  -- Remove trailing comma and space
  result := substring(result, 1, length(result) - 2);
  
  RETURN result;
END;
$$;

-- Function to analyze tables
CREATE OR REPLACE FUNCTION analyze_tables()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_name text;
  result text := 'ANALYZE completed for tables: ';
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'ANALYZE ' || quote_ident(table_name);
    result := result || table_name || ', ';
  END LOOP;
  
  -- Remove trailing comma and space
  result := substring(result, 1, length(result) - 2);
  
  RETURN result;
END;
$$;

-- Function to reindex tables
CREATE OR REPLACE FUNCTION reindex_tables()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_name text;
  result text := 'REINDEX completed for tables: ';
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'REINDEX TABLE ' || quote_ident(table_name);
    result := result || table_name || ', ';
  END LOOP;
  
  -- Remove trailing comma and space
  result := substring(result, 1, length(result) - 2);
  
  RETURN result;
END;
$$;
