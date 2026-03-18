import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // Prevent body scroll when sheet is visible
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 bg-[#f4ece4] rounded-t-3xl shadow-2xl overflow-y-auto flex flex-col",
              fullHeight ? "h-[80vh]" : "max-h-[80vh]",
              className
            )}
          >
            <div className="sticky top-0 bg-[#f4ece4]/80 backdrop-blur-md z-10 px-6 py-4 border-b border-black/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {title ? <h2 className="text-lg font-semibold truncate">{title}</h2> : <div />}
                {headerAction}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
