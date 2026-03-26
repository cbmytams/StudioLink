export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProfileType = 'studio' | 'pro' | 'admin'
export type InvitationType = 'studio' | 'pro'
export type MissionStatus =
  | 'draft'
  | 'open'
  | 'published'
  | 'selecting'
  | 'in_progress'
  | 'filled'
  | 'completed'
  | 'rated'
  | 'expired'
  | 'cancelled'
  | 'closed'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'
export type SessionStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type MissionFileType = 'reference' | 'delivery'

export interface NotificationPrefs {
  skills: string[]
  genres: string[]
  min_rate: number
}

export type PreferredDates = Json
export type PortfolioLinks = Json

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          type: ProfileType
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          city: string
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          type: ProfileType
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          city?: string
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          type?: ProfileType
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          city?: string
          is_verified?: boolean
          created_at?: string
        }
        Relationships: []
      }
      studios: {
        Row: {
          id: string
          profile_id: string
          studio_name: string
          address: string | null
          arrondissement: string | null
          description: string | null
          photos: string[]
          equipment: string[]
          website: string | null
          instagram: string | null
          rating_avg: number | null
          rating_count: number | null
        }
        Insert: {
          id?: string
          profile_id: string
          studio_name: string
          address?: string | null
          arrondissement?: string | null
          description?: string | null
          photos?: string[]
          equipment?: string[]
          website?: string | null
          instagram?: string | null
          rating_avg?: number | null
          rating_count?: number | null
        }
        Update: {
          id?: string
          profile_id?: string
          studio_name?: string
          address?: string | null
          arrondissement?: string | null
          description?: string | null
          photos?: string[]
          equipment?: string[]
          website?: string | null
          instagram?: string | null
          rating_avg?: number | null
          rating_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'studios_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      professionals: {
        Row: {
          id: string
          profile_id: string
          bio: string | null
          skills: string[]
          instruments: string[]
          genres: string[]
          min_rate: number | null
          portfolio_links: PortfolioLinks
          is_available: boolean
          notification_prefs: NotificationPrefs
          rating_avg: number | null
          rating_count: number | null
        }
        Insert: {
          id?: string
          profile_id: string
          bio?: string | null
          skills?: string[]
          instruments?: string[]
          genres?: string[]
          min_rate?: number | null
          portfolio_links?: PortfolioLinks
          is_available?: boolean
          notification_prefs?: NotificationPrefs
          rating_avg?: number | null
          rating_count?: number | null
        }
        Update: {
          id?: string
          profile_id?: string
          bio?: string | null
          skills?: string[]
          instruments?: string[]
          genres?: string[]
          min_rate?: number | null
          portfolio_links?: PortfolioLinks
          is_available?: boolean
          notification_prefs?: NotificationPrefs
          rating_avg?: number | null
          rating_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'professionals_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      invitations: {
        Row: {
          id: string
          code: string
          type: InvitationType
          created_by: string | null
          used_by: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          type: InvitationType
          created_by?: string | null
          used_by?: string | null
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: InvitationType
          created_by?: string | null
          used_by?: string | null
          expires_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invitations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invitations_used_by_fkey'
            columns: ['used_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      missions: {
        Row: {
          id: string
          studio_id: string
          title: string
          service_type: string
          artist_name: string | null
          is_confidential: boolean
          genre: string[]
          beat_type: string | null
          hours: number | null
          rate: number | null
          is_rate_negotiable: boolean
          description: string | null
          work_language: string
          is_urgent: boolean
          preferred_dates: PreferredDates
          max_candidates: number | null
          status: MissionStatus
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          studio_id: string
          title: string
          service_type: string
          artist_name?: string | null
          is_confidential?: boolean
          genre?: string[]
          beat_type?: string | null
          hours?: number | null
          rate?: number | null
          is_rate_negotiable?: boolean
          description?: string | null
          work_language?: string
          is_urgent?: boolean
          preferred_dates?: PreferredDates
          max_candidates?: number | null
          status?: MissionStatus
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          studio_id?: string
          title?: string
          service_type?: string
          artist_name?: string | null
          is_confidential?: boolean
          genre?: string[]
          beat_type?: string | null
          hours?: number | null
          rate?: number | null
          is_rate_negotiable?: boolean
          description?: string | null
          work_language?: string
          is_urgent?: boolean
          preferred_dates?: PreferredDates
          max_candidates?: number | null
          status?: MissionStatus
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'missions_studio_id_fkey'
            columns: ['studio_id']
            isOneToOne: false
            referencedRelation: 'studios'
            referencedColumns: ['id']
          },
        ]
      }
      applications: {
        Row: {
          id: string
          mission_id: string
          pro_id: string
          message: string
          cover_letter: string | null
          status: ApplicationStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mission_id: string
          pro_id: string
          message?: string
          cover_letter?: string | null
          status?: ApplicationStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mission_id?: string
          pro_id?: string
          message?: string
          cover_letter?: string | null
          status?: ApplicationStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'applications_mission_id_fkey'
            columns: ['mission_id']
            isOneToOne: false
            referencedRelation: 'missions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'applications_pro_id_fkey'
            columns: ['pro_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      sessions: {
        Row: {
          id: string
          mission_id: string
          studio_id: string
          pro_id: string
          application_id: string
          status: SessionStatus
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          mission_id: string
          studio_id: string
          pro_id: string
          application_id: string
          status?: SessionStatus
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          mission_id?: string
          studio_id?: string
          pro_id?: string
          application_id?: string
          status?: SessionStatus
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sessions_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sessions_mission_id_fkey'
            columns: ['mission_id']
            isOneToOne: false
            referencedRelation: 'missions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sessions_pro_id_fkey'
            columns: ['pro_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sessions_studio_id_fkey'
            columns: ['studio_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          data: Json
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          data?: Json
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          data?: Json
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      mission_files: {
        Row: {
          id: string
          mission_id: string
          session_id: string | null
          uploaded_by: string
          file_type: MissionFileType
          file_url: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          mission_id: string
          session_id?: string | null
          uploaded_by: string
          file_type: MissionFileType
          file_url: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          mission_id?: string
          session_id?: string | null
          uploaded_by?: string
          file_type?: MissionFileType
          file_url?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'mission_files_mission_id_fkey'
            columns: ['mission_id']
            isOneToOne: false
            referencedRelation: 'missions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mission_files_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mission_files_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          id: string
          session_id: string | null
          conversation_id: string | null
          sender_id: string
          content: string | null
          file_url: string | null
          file_name: string | null
          file_type: 'audio' | 'document' | 'image' | null
          is_read: boolean
          read: boolean | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          conversation_id?: string | null
          sender_id: string
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          file_type?: 'audio' | 'document' | 'image' | null
          is_read?: boolean
          read?: boolean | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          conversation_id?: string | null
          sender_id?: string
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          file_type?: 'audio' | 'document' | 'image' | null
          is_read?: boolean
          read?: boolean | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
        ]
      }
      ratings: {
        Row: {
          id: string
          session_id: string
          rater_id: string
          rated_id: string
          score: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          rater_id: string
          rated_id: string
          score: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          rater_id?: string
          rated_id?: string
          score?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ratings_rated_id_fkey'
            columns: ['rated_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ratings_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ratings_rater_id_fkey'
            columns: ['rater_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
