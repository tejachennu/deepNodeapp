import api from './api';

// Types
export interface Campaign {
    CampaignId: number;
    ProjectId: number;
    CampaignName: string;
    CampaignCode: string;
    CampaignType?: string;
    Description?: string;
    ImageUrls?: string[];
    VideoUrls?: string[];
    TargetAmount: number;
    CollectedAmount: number;
    DonorCount?: number;
    StartDate?: string;
    EndDate?: string;
    Status: string;
    IsPublic: boolean;
    RazorpayEnabled: boolean;
    ProjectName?: string;
}

export interface Donation {
    DonationId: number;
    CampaignId: number;
    DonorName: string;
    Amount: number;
    Currency: string;
    DonationType: string;
    PaymentMode: string;
    Status: string;
    DonationDate?: string;
    Purpose?: string;
    ReceiptNumber?: string;
    CampaignName?: string;
}

export interface BeneficiaryDonation {
    BeneficiaryDonationId: number;
    ProjectId: number;
    Title: string;
    Description?: string;
    DonationType: string;
    Amount: number;
    ReceivedItemName?: string;
    BeneficiaryName?: string;
    Status: string;
    DonationDate?: string;
}

// Campaign Service
export const campaignService = {
    // Get all campaigns
    async getAll(filters?: { status?: string; isPublic?: boolean }): Promise<Campaign[]> {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));

        const response = await api.get(`/campaigns?${params}`);
        return response.data.data?.campaigns || [];
    },

    // Get public campaigns
    async getPublic(): Promise<Campaign[]> {
        const response = await api.get('/campaigns/public');
        return response.data.data?.campaigns || [];
    },

    // Get campaign by ID (public endpoint - no auth required)
    async getById(id: number): Promise<Campaign> {
        const response = await api.get(`/campaigns/public/${id}`);
        return response.data.data?.campaign;
    },

    // Get campaign for donation page
    async getDonationPage(id: number): Promise<Campaign> {
        const response = await api.get(`/campaigns/${id}/donate`);
        return response.data.data?.campaign;
    },

    // Create campaign (admin)
    async create(data: Partial<Campaign>): Promise<Campaign> {
        const response = await api.post('/campaigns', data);
        return response.data.data?.campaign;
    },

    // Update campaign
    async update(id: number, data: Partial<Campaign>): Promise<Campaign> {
        const response = await api.put(`/campaigns/${id}`, data);
        return response.data.data?.campaign;
    },
};

// Donation Service
export const donationService = {
    // Create Razorpay order (initiate donation)
    async createOrder(data: {
        campaignId: number;
        amount: number;
        donorName: string;
        phoneNumber?: string;
        emailId?: string;
        panNumber?: string;
        purpose?: string;
    }): Promise<{ orderId: string; amount: number; donationId: number; razorpayKeyId: string }> {
        const response = await api.post('/donations/create-order', data);
        return response.data.data;
    },

    // Verify payment
    async verifyPayment(data: {
        donationId: number;
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }): Promise<Donation> {
        const response = await api.post('/donations/verify-payment', data);
        return response.data.data?.donation;
    },

    // Get my donations
    async getMyDonations(): Promise<Donation[]> {
        const response = await api.get('/donations/my-donations');
        return response.data.data?.donations || [];
    },

    // Get all donations (admin)
    async getAll(filters?: { campaignId?: number; status?: string }): Promise<Donation[]> {
        const params = new URLSearchParams();
        if (filters?.campaignId) params.append('campaignId', filters.campaignId.toString());
        if (filters?.status) params.append('status', filters.status);

        const response = await api.get(`/donations?${params}`);
        return response.data.data?.donations || [];
    },

    // Create offline donation (admin)
    async createOffline(data: Partial<Donation>): Promise<Donation> {
        const response = await api.post('/donations/offline', data);
        return response.data.data?.donation;
    },
};

// Beneficiary Donation Service
export const beneficiaryService = {
    async getAll(projectId?: number): Promise<BeneficiaryDonation[]> {
        const params = projectId ? `?projectId=${projectId}` : '';
        const response = await api.get(`/beneficiary-donations${params}`);
        return response.data.data?.donations || [];
    },

    async getById(id: number): Promise<{ donation: BeneficiaryDonation; images: any[]; videos: any[] }> {
        const response = await api.get(`/beneficiary-donations/${id}`);
        return response.data.data;
    },

    async create(data: Partial<BeneficiaryDonation>): Promise<BeneficiaryDonation> {
        const response = await api.post('/beneficiary-donations', data);
        return response.data.data?.donation;
    },

    async update(id: number, data: Partial<BeneficiaryDonation>): Promise<BeneficiaryDonation> {
        const response = await api.put(`/beneficiary-donations/${id}`, data);
        return response.data.data?.donation;
    },
};

export default { campaignService, donationService, beneficiaryService };
