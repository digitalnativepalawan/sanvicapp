export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blog_stories: {
        Row: {
          author: string | null
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          id: string
          published: boolean
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          published?: boolean
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          published?: boolean
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          amenities: string[]
          categories: string[]
          category: string
          cover_image: string | null
          created_at: string
          description: string | null
          facebook: string | null
          featured: boolean
          id: string
          images: string[] | null
          instagram: string | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          season_status: string | null
          services: string[]
          tag: string | null
          visible: boolean
          website: string | null
          whatsapp: string | null
          zone: string | null
        }
        Insert: {
          amenities?: string[]
          categories?: string[]
          category: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          facebook?: string | null
          featured?: boolean
          id?: string
          images?: string[] | null
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          season_status?: string | null
          services?: string[]
          tag?: string | null
          visible?: boolean
          website?: string | null
          whatsapp?: string | null
          zone?: string | null
        }
        Update: {
          amenities?: string[]
          categories?: string[]
          category?: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          facebook?: string | null
          featured?: boolean
          id?: string
          images?: string[] | null
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          season_status?: string | null
          services?: string[]
          tag?: string | null
          visible?: boolean
          website?: string | null
          whatsapp?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          active: boolean
          challenge_type: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          reward_pebbles: number
          starts_at: string | null
          title: string
        }
        Insert: {
          active?: boolean
          challenge_type?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          reward_pebbles?: number
          starts_at?: string | null
          title: string
        }
        Update: {
          active?: boolean
          challenge_type?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          reward_pebbles?: number
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          business_id: string | null
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          post_type: string
          rating: number | null
          status: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string
          rating?: number | null
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string
          rating?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      game_spins: {
        Row: {
          id: string
          pebbles_won: number
          spun_at: string
          user_id: string
        }
        Insert: {
          id?: string
          pebbles_won?: number
          spun_at?: string
          user_id: string
        }
        Update: {
          id?: string
          pebbles_won?: number
          spun_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pebbles_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          pebbles_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          pebbles_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          pebbles_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          active: boolean
          business_id: string | null
          code: string
          created_at: string
          id: string
          reward_pebbles: number
        }
        Insert: {
          active?: boolean
          business_id?: string | null
          code: string
          created_at?: string
          id?: string
          reward_pebbles?: number
        }
        Update: {
          active?: boolean
          business_id?: string | null
          code?: string
          created_at?: string
          id?: string
          reward_pebbles?: number
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_scans: {
        Row: {
          id: string
          pebbles_awarded: number
          qr_code_id: string
          scanned_at: string
          user_id: string
        }
        Insert: {
          id?: string
          pebbles_awarded?: number
          qr_code_id: string
          scanned_at?: string
          user_id: string
        }
        Update: {
          id?: string
          pebbles_awarded?: number
          qr_code_id?: string
          scanned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_questions: {
        Row: {
          active: boolean
          correct_index: number
          created_at: string
          id: string
          options: Json
          question: string
          reward_pebbles: number
        }
        Insert: {
          active?: boolean
          correct_index: number
          created_at?: string
          id?: string
          options: Json
          question: string
          reward_pebbles?: number
        }
        Update: {
          active?: boolean
          correct_index?: number
          created_at?: string
          id?: string
          options?: Json
          question?: string
          reward_pebbles?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_key: string
          badge_name: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          badge_name: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          badge_name?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
