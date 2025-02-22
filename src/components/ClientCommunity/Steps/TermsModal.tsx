// src/components/ClientCommunity/Steps/TermsModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TermsContent } from './TermsContent';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-normal text-[#3F0052]">
            Terms & Conditions
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 overflow-y-auto max-h-[calc(80vh-10rem)] pr-4">
          <TermsContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
