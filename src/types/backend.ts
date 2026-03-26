export type UserType = 'studio' | 'pro';

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
  | 'closed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
export type InvitationStatus = 'available' | 'used';
export type SessionStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type ChatFileType = 'audio' | 'document' | 'image';
export type MissionFileType = 'reference' | 'delivery';

export type NotificationType =
  | 'new_application'
  | 'application_accepted'
  | 'application_selected'
  | 'application_rejected'
  | 'new_message'
  | 'delivery_uploaded'
  | 'session_completed'
  | 'mission_completed'
  | 'new_rating';

export type SavedItemType = 'mission' | 'pro' | 'studio';

export interface NotificationPreferences {
  new_application: boolean;
  messages: boolean;
  status_updates: boolean;
}

export interface Profile {
  id: string;
  email: string;
  user_type: UserType;
  onboarding_complete: boolean;
  onboarding_step: number;
  avatar_url: string | null;
  display_name: string | null;
  full_name?: string | null;
  company_name?: string | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  notification_preferences?: NotificationPreferences | null;
  created_at: string;
  updated_at?: string;
}

export interface AvailabilitySlot {
  day: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';
  start: string;
  end: string;
}

export interface StudioProfileRecord {
  profile_id: string;
  name: string | null;
  address: string | null;
  district: string | null;
  phone: string | null;
  description: string | null;
  equipment: string[];
  website: string | null;
  instagram: string | null;
  updated_at: string;
}

export interface ProProfileRecord {
  profile_id: string;
  name: string | null;
  bio: string | null;
  phone: string | null;
  services: string[];
  genres: string[];
  instruments: string[];
  min_rate: number;
  show_rate: boolean;
  links: { platform: string; url: string }[];
  is_available: boolean;
  availability_slots?: AvailabilitySlot[];
  updated_at: string;
}

export interface MissionRecord {
  id: string;
  studio_id: string;
  is_urgent: boolean;
  service_type: string;
  artist_name: string | null;
  is_confidential: boolean;
  genres: string[];
  beat_type: string | null;
  duration: string | null;
  price: string | null;
  location: string | null;
  candidates_count: number;
  expires_at: string | null;
  status: MissionStatus;
  created_at: string;
  updated_at?: string;
}

export interface ApplicationRecord {
  id: string;
  mission_id: string;
  pro_id: string;
  cover_letter: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  message?: string | null;
  applied_at?: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface ReviewRecord {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  mission_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export type PortfolioItem = {
  id: string;
  pro_id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  created_at: string;
};

export interface SavedItemRecord {
  id: string;
  user_id: string;
  item_id: string;
  item_type: SavedItemType;
  created_at: string;
}

export interface ConversationRecord {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
}

export interface SessionRecord {
  id: string;
  mission_id: string;
  studio_id: string;
  pro_id: string;
  application_id: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface RatingRecord {
  id: string;
  session_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface MissionFileRecord {
  id: string;
  mission_id: string;
  session_id: string | null;
  uploaded_by: string;
  file_type: MissionFileType;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface MessageRecord {
  id: string;
  session_id: string | null;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name?: string | null;
  file_type?: ChatFileType | null;
  is_read: boolean;
  created_at: string;
  conversation_id?: string | null;
  read?: boolean;
  read_at?: string | null;
}

export interface InvitationValidationResult {
  is_valid: boolean;
  code_type: UserType | null;
  message: string;
}

export interface CreateMissionInput {
  service_type: string;
  artist_name?: string | null;
  is_confidential?: boolean;
  genres?: string[];
  beat_type?: string | null;
  duration?: string | null;
  price?: string | null;
  location?: string | null;
  expires_at?: string | null;
  is_urgent?: boolean;
  status?: MissionStatus;
}

export interface CreateApplicationInput {
  mission_id: string;
  cover_letter?: string;
}

export interface CreateReviewInput {
  reviewee_id: string;
  mission_id: string;
  rating: number;
  comment?: string;
}
