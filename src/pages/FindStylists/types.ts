export interface SearchParams {
    businessName: string;
    braidStyle: string;
    location: string;
    servicePreference: string[];
    minDepositAmount: number;
    maxDepositAmount: number;
}

export interface PaginationParams {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
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
    servicePreference: string[];
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
