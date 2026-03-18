import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Info, Paperclip, ArrowUp, Mic, X, Music, FileText, FileArchive, MapPin, Clock, Euro, CheckCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { mockSessions } from '@/data/mockSessions';
import { mockMessages, Message } from '@/data/mockMessages';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userType, setUserType } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'messages' | 'files'>(
    searchParams.get('tab') === 'files' ? 'files' : 'messages'
  );
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [deliveries, setDeliveries] = useState([
    { id: 'del-1', name: 'Mix_Lenzo_V1.wav', size: '48 Mo', type: 'audio', date: 'Il y a 30 min' }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);

  const session = mockSessions.find(s => s.id === sessionId) || mockSessions[0];
  
  const interlocutorName = userType === 'studio' ? session.proName : session.studioName;
  const interlocutorAvatar = userType === 'studio' ? session.proAvatar : session.studioAvatar;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() && !selectedFile) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sessionId: session.id,
      senderId: userType === 'studio' ? session.studioId : session.proId,
      senderType: userType,
      content: inputValue,
      fileAttachment: selectedFile ? {
        name: selectedFile.name,
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} Mo`,
        type: selectedFile.name.endsWith('.pdf') ? 'pdf' : selectedFile.name.endsWith('.zip') ? 'zip' : 'audio'
      } : null,
      isRead: false,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setSelectedFile(null);

    // Simulate read receipt after 1.5s
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === newMessage.id ? { ...m, isRead: true } : m
      ));
    }, 1500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDeliverySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDeliveries(prev => [...prev, {
        id: `del-${Date.now()}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} Mo`,
        type: file.name.endsWith('.zip') ? 'zip' : 'audio',
        date: "À l'instant"
      }]);
    }
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Music size={16} className="text-orange-500" />;
      case 'pdf': return <FileText size={16} className="text-blue-500" />;
      case 'zip': return <FileArchive size={16} className="text-purple-500" />;
      default: return <FileText size={16} className="text-black/60" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ece4] relative">
      {/* Background gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full blur-3xl opacity-20 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-gradient-to-tr from-blue-300 to-white rounded-full blur-3xl opacity-30 mix-blend-multiply" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#f4ece4]/80 backdrop-blur-md border-b border-black/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <img src={interlocutorAvatar} alt={interlocutorName} className="w-10 h-10 rounded-full object-cover border border-black/10" />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{interlocutorName}</span>
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm w-fit mt-0.5">
                Session confirmée
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsInfoOpen(true)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <Info size={20} className="text-black/60" />
        </button>
      </header>

      {/* Tabs */}
      <div className="sticky top-[65px] z-20 bg-[#f4ece4]/80 backdrop-blur-md pt-3 pb-3 px-4 flex justify-center">
        <div className="flex items-center gap-1 p-1 bg-white/40 rounded-full border border-white/50">
          <button 
            onClick={() => setActiveTab('messages')}
            className={cn(
              "px-5 py-1.5 rounded-full text-sm font-medium transition-all",
              activeTab === 'messages' ? "bg-orange-500 text-white shadow-sm" : "text-black/60 hover:text-black"
            )}
          >
            💬 Messages
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={cn(
              "px-5 py-1.5 rounded-full text-sm font-medium transition-all",
              activeTab === 'files' ? "bg-orange-500 text-white shadow-sm" : "text-black/60 hover:text-black"
            )}
          >
            📁 Fichiers
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative z-10 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'messages' ? (
            <motion.div 
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto p-4 pb-40 flex flex-col gap-4"
            >
              <div className="flex justify-center my-4">
                <span className="text-xs font-medium text-black/40 bg-white/40 px-3 py-1 rounded-full border border-white/50">
                  Aujourd'hui
                </span>
              </div>

              {messages.map((msg) => {
                const isMe = msg.senderType === userType;
                return (
                  <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "self-end items-end" : "self-start items-start")}>
                    <div 
                      className={cn(
                        "px-4 py-2.5 shadow-sm",
                        isMe 
                          ? "bg-orange-500 text-white rounded-[18px] rounded-br-[4px]" 
                          : "bg-white/60 backdrop-blur-md border border-white/50 text-black rounded-[18px] rounded-bl-[4px]"
                      )}
                    >
                      {msg.fileAttachment && (
                        <div className={cn(
                          "flex items-center gap-3 p-2 rounded-xl mb-2",
                          isMe ? "bg-white/20" : "bg-white/50"
                        )}>
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                            {getFileIcon(msg.fileAttachment.type)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{msg.fileAttachment.name}</span>
                            <span className={cn("text-[10px]", isMe ? "text-white/70" : "text-black/50")}>
                              {msg.fileAttachment.size}
                            </span>
                          </div>
                        </div>
                      )}
                      {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-black/40 font-medium">{formatMessageTime(msg.createdAt)}</span>
                      {isMe && (
                        <CheckCheck size={12} className={msg.isRead ? "text-orange-500" : "text-black/30"} />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </motion.div>
          ) : (
            <motion.div 
              key="files"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto p-4 pb-40 flex flex-col gap-8"
            >
              {/* Section 1: Fichiers de mission */}
              <section>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Fichiers de mission</h2>
                  <p className="text-xs text-black/50 font-medium mt-0.5">Partagés par le studio à la création de la mission</p>
                </div>
                <div className="flex flex-col gap-3">
                  {/* Audio File */}
                  <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Music size={20} className="text-orange-500" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">Stems_Lenzo_Mix.mp3</span>
                        <span className="text-xs text-black/50">4.2 Mo</span>
                      </div>
                    </div>
                    <AudioPlayer src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" />
                  </div>

                  {/* PDF File */}
                  <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-blue-500" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-sm truncate">Notes_production.pdf</span>
                      <span className="text-xs text-black/50">120 Ko</span>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">Télécharger</Button>
                  </div>
                </div>
              </section>

              {/* Section 2: Livraisons */}
              <section>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">
                    {userType === 'pro' ? 'Mes livraisons' : `Fichiers livrés par ${session.proName}`}
                  </h2>
                </div>

                {userType === 'pro' && (
                  <>
                    <input 
                      type="file" 
                      ref={deliveryInputRef} 
                      className="hidden" 
                      accept=".wav,.mp3,.zip"
                      onChange={handleDeliverySelect}
                    />
                    <Button 
                      variant="primary" 
                      className="w-full mb-4"
                      onClick={() => deliveryInputRef.current?.click()}
                    >
                      Déposer une livraison
                    </Button>
                  </>
                )}

                {deliveries.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {deliveries.map(del => (
                      <div key={del.id} className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          del.type === 'audio' ? "bg-orange-500/10" : "bg-purple-500/10"
                        )}>
                          {getFileIcon(del.type)}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium text-sm truncate">{del.name}</span>
                          <div className="flex items-center gap-2 text-xs text-black/50">
                            <span>{del.size}</span>
                            <span>·</span>
                            <span>{del.date}</span>
                          </div>
                        </div>
                        {userType === 'pro' ? (
                          <button 
                            onClick={() => setDeliveries(prev => prev.filter(d => d.id !== del.id))}
                            className="p-2 text-black/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <X size={16} />
                          </button>
                        ) : (
                          <Button variant="ghost" size="sm" className="shrink-0">Télécharger</Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white/20 rounded-2xl border border-white/30 border-dashed">
                    <p className="text-sm text-black/50 font-medium">
                      {userType === 'pro' ? "Tu n'as pas encore déposé de fichiers." : `${session.proName} n'a pas encore déposé de fichiers.`}
                    </p>
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Bar (only visible in messages tab) */}
      <AnimatePresence>
        {activeTab === 'messages' && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 w-full bg-[#f4ece4]/90 backdrop-blur-xl border-t border-white/50 p-3 z-40"
          >
            <div className="max-w-3xl mx-auto">
              {/* File Preview */}
              <AnimatePresence>
                {selectedFile && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 10, height: 0 }}
                    className="mb-3"
                  >
                    <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                        {getFileIcon(selectedFile.name.endsWith('.pdf') ? 'pdf' : selectedFile.name.endsWith('.zip') ? 'zip' : 'audio')}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                        <span className="text-[10px] text-black/50">{(selectedFile.size / (1024 * 1024)).toFixed(1)} Mo</span>
                      </div>
                      <button 
                        onClick={() => setSelectedFile(null)}
                        className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
                      >
                        <X size={16} className="text-black/60" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect}
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-black/50 hover:text-black hover:bg-black/5 rounded-full transition-colors shrink-0 mb-0.5"
                >
                  <Paperclip size={20} />
                </button>
                
                <div className="flex-1 bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl min-h-[44px] flex items-center px-4 py-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Écris un message..."
                    className="w-full bg-transparent border-none outline-none text-sm placeholder:text-black/40"
                  />
                </div>

                {inputValue.trim() || selectedFile ? (
                  <button 
                    type="submit"
                    className="w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    <ArrowUp size={20} />
                  </button>
                ) : (
                  <button 
                    type="button"
                    className="w-11 h-11 rounded-full bg-black/5 text-black/40 flex items-center justify-center shrink-0"
                  >
                    <Mic size={20} />
                  </button>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Info BottomSheet */}
      <BottomSheet isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)}>
        <div className="p-6 flex flex-col gap-6">
          <h2 className="text-xl font-semibold">Récapitulatif de session</h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-bold text-xs uppercase">MIX</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-black/50 font-medium">Prestation</span>
                <span className="font-medium capitalize">{session.serviceType}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                <Music size={18} className="text-black/60" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-black/50 font-medium">Artiste</span>
                <span className="font-medium">{session.artistName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-black/60" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-black/50 font-medium">Date & Heure</span>
                <span className="font-medium">{session.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {session.timeStart} ({session.durationHours}h)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                <Euro size={18} className="text-black/60" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-black/50 font-medium">Rémunération</span>
                <span className="font-medium">{session.rate} €</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center shrink-0 mt-1">
                <MapPin size={18} className="text-black/60" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm text-black/50 font-medium">Lieu</span>
                <span className="font-medium mb-2">{session.studioAddress}</span>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-fit"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(session.studioAddress)}`, '_blank')}
                >
                  Ouvrir dans Maps
                </Button>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Dev Switcher */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-2 z-50 flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setUserType('studio')}
          className={cn(
            "px-2 py-1 text-[10px] rounded bg-black/10 font-medium",
            userType === 'studio' && "bg-black/80 text-white"
          )}
        >
          Vue Studio
        </button>
        <button 
          onClick={() => setUserType('pro')}
          className={cn(
            "px-2 py-1 text-[10px] rounded bg-black/10 font-medium",
            userType === 'pro' && "bg-black/80 text-white"
          )}
        >
          Vue Pro
        </button>
      </div>
    </div>
  );
}
