export interface SearchParams {
  businessName: string;
  styles: string;
  location: string;
}

export interface StylistService {
  name: string;
  duration: {
    hours: number;
    minutes: number;
  };
  description?: string;
  price: number;
}

export interface Stylist {
  id: string;
  name: string;
  username: string;
  businessName: string;
  introduction: string;
  specialInstructions: string;
  policyAndProcedures: string;
  location: string;
  city: string;
  state: string;
  zipCode: string;
  servicePreference: 'shop' | 'home' | 'mobile';
  image: string;
  availability: string;
  depositAmount: number;
  washesHair: boolean;
  providesHair: boolean;
  stylesMensHair: boolean;
  stylesChildrensHair: boolean;
  price: {
    from: number;
    to: number;
  };
  socialMedia?: {
    instagram?: string;
    facebook?: string;
  };
  isFavorite?: boolean;
  services: StylistService[];
  schedule?: any;
}