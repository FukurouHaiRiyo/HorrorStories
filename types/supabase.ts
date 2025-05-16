export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          title: string
          content: string
          excerpt: string | null
          image_url: string | null
          published: boolean
          featured: boolean
          view_count: number
          created_at: string
          updated_at: string
          author_id: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          excerpt?: string | null
          image_url?: string | null
          published?: boolean
          featured?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
          author_id: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          excerpt?: string | null
          image_url?: string | null
          published?: boolean
          featured?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
          author_id?: string
        }
      }
      story_categories: {
        Row: {
          story_id: string
          category_id: string
        }
        Insert: {
          story_id: string
          category_id: string
        }
        Update: {
          story_id?: string
          category_id?: string
        }
      }
      comments: {
        Row: {
          id: string
          content: string
          story_id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          story_id: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          story_id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          value: number
          story_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          value: number
          story_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          value?: number
          story_id?: string
          user_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Story = Database["public"]["Tables"]["stories"]["Row"] & {
  categories?: Category[]
  author?: Profile
  likes_count?: number
  comments_count?: number
}

export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type Comment = Database["public"]["Tables"]["comments"]["Row"] & {
  user?: Profile
}
export type Like = Database["public"]["Tables"]["likes"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
