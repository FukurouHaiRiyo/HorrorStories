export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      stories: {
        Row: {
          id: string
          title: string
          content: string
          category_id: string
          created_at: string
          featured: boolean
          published: boolean
        }
        Insert: {
          id?: string
          title: string
          content: string
          category_id: string
          featured?: boolean
          published?: boolean
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category_id?: string
          featured?: boolean
          published?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analyze_tables: {
        Args: {}
        Returns: undefined
      }
      get_database_statistics: {
        Args: {}
        Returns: string
      }
      reindex_tables: {
        Args: {}
        Returns: undefined
      }
      run_analyze: {
        Args: {}
        Returns: undefined
      }
      run_reindex: {
        Args: {}
        Returns: undefined
      }
      run_vacuum: {
        Args: {}
        Returns: undefined
      }
      vacuum_analyze_tables: {
        Args: {}
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
