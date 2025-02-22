import type { StylistService } from '@/lib/schemas/stylist-service';

export interface StylistProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  businessName: string;
  introduction: string;
  specialInstructions: string;
  policyAndProcedures: string;
  servicePreference: 'shop' | 'home' | 'mobile';
  washesHair: boolean;
  providesHair: boolean;
  stylesMensHair: boolean;
  stylesChildrensHair: boolean;
  depositAmount: number;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  profileImage: string;
  createdAt: string;
  userType: 'stylist';
  status: 'trial' | 'active' | 'suspended';
  trialEndsAt: string;
  services: StylistService[]; // Add services array
}
