// DEPRECATED — utiliser src/lib/notifications/notificationService.ts
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '@/lib/notifications/notificationService';

export { getNotifications, markAllAsRead, markAsRead } from '@/lib/notifications/notificationService';

export const notificationService = {
  getNotifications,
  markAsRead,
  markAllRead: markAllAsRead,
};
