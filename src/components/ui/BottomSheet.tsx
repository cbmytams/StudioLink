import React, { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileFixedBottomStyle, useMobileFixedFillStyle } from '@/hooks/useVisualViewport';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export function BottomSheet({ isOpen, onClose, title, headerAction, children, className, fullHeight }: BottomSheetProps) {
  const mobileOverlayStyle = useMobileFixedFillStyle();
  const mobilePanelStyle = useMobileFixedBottomStyle();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  // Prevent body scroll when sheet is visible
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#f4ece4]/75 backdrop-blur-sm"
            style={mobileOverlayStyle}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 bg-[#f4ece4] rounded-t-3xl shadow-2xl overflow-y-auto flex flex-col",
              fullHeight ? "h-[80dvh]" : "max-h-[80dvh]",
              className
            )}
            style={mobilePanelStyle}
          >
            <div className="sticky top-0 bg-[#f4ece4]/80 backdrop-blur-md z-10 px-6 py-4 border-b border-black/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {title ? <h2 id={titleId} className="text-lg font-semibold truncate">{title}</h2> : <div />}
                {headerAction}
              </div>
              <button
                type="button"
                aria-label="Fermer le panneau"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
