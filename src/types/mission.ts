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

export interface Mission {
  id: string;
  isUrgent: boolean;
  serviceType: string;
  artistName: string;
  isConfidential: boolean;
  genres: string[];
  beatType?: string;
  duration: string;
  price: string;
  location: string;
  candidatesCount: number;
  expiresAt: Date | string | number;
  createdAt: Date | string | number;
  status: MissionStatus;
}
