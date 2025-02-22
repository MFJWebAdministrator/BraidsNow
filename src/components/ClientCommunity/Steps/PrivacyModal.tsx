import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PrivacyContent } from './PrivacyContent';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-normal text-[#3F0052]">
            Privacy Policy
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 overflow-y-auto max-h-[calc(80vh-10rem)] pr-4">
          <PrivacyContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
