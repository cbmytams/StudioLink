export interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: 'studio' | 'pro';
  content: string;
  fileAttachment: {
    name: string;
    size: string;
    type: 'audio' | 'pdf' | 'zip';
  } | null;
  isRead: boolean;
  createdAt: Date;
}

export const mockMessages: Message[] = [
  {
    id: "msg-1",
    sessionId: "session-lenzo",
    senderId: "studio-1",
    senderType: "studio",
    content: "Salut Alexandre ! Content de t'avoir sélectionné. On se voit vendredi 10h ?",
    fileAttachment: null,
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: "msg-2",
    sessionId: "session-lenzo",
    senderId: "pro-1",
    senderType: "pro",
    content: "Parfait pour moi ! Je serai là à 9h45 pour m'installer.",
    fileAttachment: null,
    isRead: true,
    createdAt: new Date(Date.now() - 105 * 60 * 1000)
  },
  {
    id: "msg-3",
    sessionId: "session-lenzo",
    senderId: "studio-1",
    senderType: "studio",
    content: "Top. J'ai joint les stems séparés dans l'espace fichiers.",
    fileAttachment: null,
    isRead: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000)
  },
  {
    id: "msg-4",
    sessionId: "session-lenzo",
    senderId: "pro-1",
    senderType: "pro",
    content: "Reçu, je les écoute ce soir pour arriver préparé.",
    fileAttachment: null,
    isRead: true,
    createdAt: new Date(Date.now() - 45 * 60 * 1000)
  },
  {
    id: "msg-5",
    sessionId: "session-lenzo",
    senderId: "studio-1",
    senderType: "studio",
    content: "Tu préfères qu'on commence par les voix ou les instrus ?",
    fileAttachment: null,
    isRead: true,
    createdAt: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    id: "msg-6",
    sessionId: "session-lenzo",
    senderId: "pro-1",
    senderType: "pro",
    content: "Toujours par les voix pour moi, ça donne le ton à tout le reste.",
    fileAttachment: null,
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000)
  }
];
