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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string
          cover_letter: string | null
          created_at: string | null
          id: string
          message: string | null
          mission_id: string
          pro_id: string
          proposed_rate: number | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          applied_at?: string
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          mission_id: string
          pro_id: string
          proposed_rate?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          applied_at?: string
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          mission_id?: string
          pro_id?: string
          proposed_rate?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_1?: string
          participant_2?: string
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          status: Database["public"]["Enums"]["invitation_status"]
          type: Database["public"]["Enums"]["user_type"]
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          type: Database["public"]["Enums"]["user_type"]
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          type?: Database["public"]["Enums"]["user_type"]
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          code: string
          created_at: string
          email: string | null
          expires_at: string | null
          id: string
          type: Database["public"]["Enums"]["user_type"]
          used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          type: Database["public"]["Enums"]["user_type"]
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          type?: Database["public"]["Enums"]["user_type"]
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean | null
          read: boolean | null
          read_at: string | null
          sender_id: string
          session_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          read?: boolean | null
          read_at?: string | null
          sender_id: string
          session_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          read?: boolean | null
          read_at?: string | null
          sender_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          mime_type: string | null
          mission_id: string
          session_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          mime_type?: string | null
          mission_id: string
          session_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          mission_id?: string
          session_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_files_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_files_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          applications_count: number | null
          artist_name: string | null
          beat_type: string | null
          candidates_count: number
          category: string | null
          city: string | null
          created_at: string
          daily_rate: number | null
          date: string | null
          description: string | null
          duration: string | null
          end_date: string | null
          expires_at: string | null
          genres: string[]
          id: string
          is_confidential: boolean
          is_urgent: boolean
          location: string | null
          price: string | null
          search_vector: unknown
          selected_pro_id: string | null
          service_type: string
          skills_required: string[]
          status: Database["public"]["Enums"]["mission_status"]
          studio_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          applications_count?: number | null
          artist_name?: string | null
          beat_type?: string | null
          candidates_count?: number
          category?: string | null
          city?: string | null
          created_at?: string
          daily_rate?: number | null
          date?: string | null
          description?: string | null
          duration?: string | null
          end_date?: string | null
          expires_at?: string | null
          genres?: string[]
          id?: string
          is_confidential?: boolean
          is_urgent?: boolean
          location?: string | null
          price?: string | null
          search_vector?: unknown
          selected_pro_id?: string | null
          service_type: string
          skills_required?: string[]
          status?: Database["public"]["Enums"]["mission_status"]
          studio_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          applications_count?: number | null
          artist_name?: string | null
          beat_type?: string | null
          candidates_count?: number
          category?: string | null
          city?: string | null
          created_at?: string
          daily_rate?: number | null
          date?: string | null
          description?: string | null
          duration?: string | null
          end_date?: string | null
          expires_at?: string | null
          genres?: string[]
          id?: string
          is_confidential?: boolean
          is_urgent?: boolean
          location?: string | null
          price?: string | null
          search_vector?: unknown
          selected_pro_id?: string | null
          service_type?: string
          skills_required?: string[]
          status?: Database["public"]["Enums"]["mission_status"]
          studio_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_selected_pro_id_fkey"
            columns: ["selected_pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_selected_pro_id_fkey"
            columns: ["selected_pro_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json
          id: string
          link: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          link?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          link?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          pro_id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          pro_id: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          pro_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_profiles: {
        Row: {
          availability_slots: Json | null
          bio: string | null
          genres: string[]
          instruments: string[]
          is_available: boolean
          links: Json
          min_rate: number
          name: string | null
          phone: string | null
          profile_id: string
          services: string[]
          show_rate: boolean
          updated_at: string
        }
        Insert: {
          availability_slots?: Json | null
          bio?: string | null
          genres?: string[]
          instruments?: string[]
          is_available?: boolean
          links?: Json
          min_rate?: number
          name?: string | null
          phone?: string | null
          profile_id: string
          services?: string[]
          show_rate?: boolean
          updated_at?: string
        }
        Update: {
          availability_slots?: Json | null
          bio?: string | null
          genres?: string[]
          instruments?: string[]
          is_available?: boolean
          links?: Json
          min_rate?: number
          name?: string | null
          phone?: string | null
          profile_id?: string
          services?: string[]
          show_rate?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_name: string | null
          contact_email: string | null
          created_at: string
          daily_rate: number | null
          display_name: string | null
          email: string
          full_name: string | null
          id: string
          is_public: boolean | null
          notification_preferences: Json | null
          onboarding_complete: boolean
          onboarding_completed: boolean | null
          onboarding_step: number
          rating_avg: number | null
          rating_count: number | null
          search_vector: unknown
          skills: string[]
          type: Database["public"]["Enums"]["user_type"] | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          daily_rate?: number | null
          display_name?: string | null
          email: string
          full_name?: string | null
          id: string
          is_public?: boolean | null
          notification_preferences?: Json | null
          onboarding_complete?: boolean
          onboarding_completed?: boolean | null
          onboarding_step?: number
          rating_avg?: number | null
          rating_count?: number | null
          search_vector?: unknown
          skills?: string[]
          type?: Database["public"]["Enums"]["user_type"] | null
          updated_at?: string
          user_type: Database["public"]["Enums"]["user_type"]
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          daily_rate?: number | null
          display_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_public?: boolean | null
          notification_preferences?: Json | null
          onboarding_complete?: boolean
          onboarding_completed?: boolean | null
          onboarding_step?: number
          rating_avg?: number | null
          rating_count?: number | null
          search_vector?: unknown
          skills?: string[]
          type?: Database["public"]["Enums"]["user_type"] | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rated_id: string
          rater_id: string
          score: number
          session_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rated_id: string
          rater_id: string
          score: number
          session_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rated_id?: string
          rater_id?: string
          score?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_rated_id_fkey"
            columns: ["rated_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_id_fkey"
            columns: ["rated_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          mission_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          mission_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          mission_id: string
          pro_id: string
          status: string
          studio_id: string
          updated_at: string | null
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id: string
          pro_id: string
          status?: string
          studio_id: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string
          pro_id?: string
          status?: string
          studio_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: true
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_profiles: {
        Row: {
          address: string | null
          description: string | null
          district: string | null
          equipment: string[]
          instagram: string | null
          name: string | null
          phone: string | null
          profile_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          description?: string | null
          district?: string | null
          equipment?: string[]
          instagram?: string | null
          name?: string | null
          phone?: string | null
          profile_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          description?: string | null
          district?: string | null
          equipment?: string[]
          instagram?: string | null
          name?: string | null
          phone?: string | null
          profile_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          daily_rate: number | null
          display_name: string | null
          id: string | null
          location: string | null
          rating_avg: number | null
          rating_count: number | null
          role: string | null
          skills: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          daily_rate?: number | null
          display_name?: never
          id?: string | null
          location?: string | null
          rating_avg?: number | null
          rating_count?: never
          role?: never
          skills?: never
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          daily_rate?: number | null
          display_name?: never
          id?: string | null
          location?: string | null
          rating_avg?: number | null
          rating_count?: never
          role?: never
          skills?: never
        }
        Relationships: []
      }
    }
    Functions: {
      accept_application: {
        Args: { p_application_id: string }
        Returns: {
          accepted_application_id: string
          accepted_mission_id: string
          accepted_pro_id: string
          accepted_status: Database["public"]["Enums"]["application_status"]
          session_id: string
        }[]
      }
      claim_invitation: {
        Args: { p_code: string; p_user_id: string }
        Returns: boolean
      }
      complete_session: { Args: { p_session_id: string }; Returns: undefined }
      consume_invitation_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      delete_user: { Args: never; Returns: undefined }
      extract_mission_amount: {
        Args: { p_daily_rate: number; p_price: string }
        Returns: number
      }
      get_applications_over_time: {
        Args: { p_role: string; p_user_id: string }
        Returns: {
          count: number
          day: string
        }[]
      }
      get_invitation_by_code: {
        Args: { p_code: string }
        Returns: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_type: string
          used: boolean
        }[]
      }
      get_or_create_session_for_mission: {
        Args: { p_mission_id: string }
        Returns: string
      }
      get_pro_dashboard: { Args: { p_pro_id: string }; Returns: Json }
      get_public_studio_missions: {
        Args: { p_studio_id: string }
        Returns: {
          budget_min: number
          city: string
          daily_rate: number
          id: string
          location: string
          status: string
          title: string
        }[]
      }
      get_studio_dashboard: { Args: { p_studio_id: string }; Returns: Json }
      has_application_for_mission: {
        Args: { p_mission_id: string; p_user_id: string }
        Returns: boolean
      }
      has_mission_application_access: {
        Args: { p_mission_id: string }
        Returns: boolean
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_admin_user_secure: { Args: never; Returns: boolean }
      mark_session_messages_as_read: {
        Args: { p_session_id: string }
        Returns: number
      }
      reject_application: {
        Args: { p_application_id: string }
        Returns: {
          rejected_application_id: string
          rejected_mission_id: string
          rejected_pro_id: string
          rejected_status: Database["public"]["Enums"]["application_status"]
        }[]
      }
      search_missions: {
        Args: {
          p_budget_max?: number
          p_budget_min?: number
          p_genre?: string
          p_limit?: number
          p_location?: string
          p_offset?: number
          p_query?: string
          p_status?: string
        }
        Returns: {
          applications_count: number
          category: string
          city: string
          created_at: string
          daily_rate: number
          date: string
          description: string
          genres: string[]
          id: string
          location: string
          price: string
          service_type: string
          status: string
          studio_id: string
          title: string
        }[]
      }
      search_pros: {
        Args: {
          p_limit?: number
          p_location?: string
          p_offset?: number
          p_query?: string
          p_skill?: string
        }
        Returns: {
          avatar_url: string
          bio: string
          daily_rate: number
          display_name: string
          id: string
          location: string
          rating_avg: number
          rating_count: number
          role: string
          skills: string[]
        }[]
      }
      validate_invitation_code: {
        Args: { p_code: string }
        Returns: {
          code_type: Database["public"]["Enums"]["user_type"]
          is_valid: boolean
          message: string
        }[]
      }
    }
    Enums: {
      application_status: "pending" | "selected" | "rejected" | "accepted"
      invitation_status: "available" | "used"
      mission_status:
        | "draft"
        | "published"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "open"
      user_type: "studio" | "pro"
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
    Enums: {
      application_status: ["pending", "selected", "rejected", "accepted"],
      invitation_status: ["available", "used"],
      mission_status: [
        "draft",
        "published",
        "in_progress",
        "completed",
        "cancelled",
        "open",
      ],
      user_type: ["studio", "pro"],
    },
  },
} as const
