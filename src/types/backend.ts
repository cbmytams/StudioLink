export type UserType = 'studio' | 'pro';

export type MissionStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'selected' | 'rejected';
export type InvitationStatus = 'available' | 'used';

export type NotificationType =
  | 'new_application'
  | 'application_accepted'
  | 'application_selected'
  | 'application_rejected'
  | 'application_rejected'
  | 'new_message'
  | 'mission_completed';

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
  message: string | null;
  status: ApplicationStatus;
  applied_at: string;
  updated_at?: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
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

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  read: boolean;
  created_at: string;
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
  message: string;
  proposed_budget?: number;
}

export interface CreateReviewInput {
  reviewee_id: string;
  mission_id: string;
  rating: number;
  comment?: string;
}
