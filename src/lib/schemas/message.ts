import * as z from 'zod';

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
});

export type MessageForm = z.infer<typeof messageSchema>;

export interface Message {
  id: string;
  threadId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  participants: string[];
  readBy: string[];
  createdAt: string;
}

export interface MessageThread {
  id: string;
  participants: string[];
  participantDetails: {
    [key: string]: {
      name: string;
      image?: string;
    }
  };
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  updatedAt: string;
}