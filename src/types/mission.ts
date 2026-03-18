export type MissionStatus =
  | 'draft'
  | 'published'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

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
