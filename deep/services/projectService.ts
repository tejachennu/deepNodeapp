import api from './api';

// Types
export interface Project {
    ProjectId: number;
    ProjectName: string;
    ProjectCode: string;
    ProjectTitle?: string;
    ProjectDescription?: string;
    ShortDescription?: string;
    LongDescription?: string;
    Objective?: string;
    ProjectType?: string;
    Location?: string;
    Latitude?: number;
    Longitude?: number;
    TargetAmount?: number;
    CollectedAmount?: number;
    StartDate?: string;
    StartTime?: string;
    EndDate?: string;
    EndTime?: string;
    Status: string;
    BannerImage?: string;
    BannerUrl?: string;
    OrganizationName?: string;
    CreatedByName?: string;
}

export interface Camp {
    CampId: number;
    ProjectId: number;
    CampName: string;
    CampDescription?: string;
    CampType?: string;
    CampAddress?: string;
    CampState?: string;
    CampCity?: string;
    CampCountry?: string;
    PeopleExpected?: number;
    PeopleAttended?: number;
    CampStartDate?: string;
    CampEndDate?: string;
    CampStatus: string;
    Latitude?: number;
    Longitude?: number;
    ImageCount?: number;
    VideoCount?: number;
}

export interface Sponsor {
    ProjectSponsorId: number;
    ProjectId: number;
    SponsorId?: number;
    OrganizationId?: number;
    SponsorType: string;
    SponsorName?: string;
    SponsorEmail?: string;
    SponsorPhone?: string;
    SponsorAddress?: string;
    SponsorWebsite?: string;
    SponsorLogo?: string;
    Purpose?: string;
    SponsorshipType?: string;
    Amount?: number;
    Currency?: string;
    Description?: string;
    StartDate?: string;
    EndDate?: string;
    Status: string;
    IsPublic?: boolean;
    DisplayOrder?: number;
    OrganizationName?: string;
}

export interface ProjectSpend {
    SpendId: number;
    ProjectId: number;
    SpendName?: string;
    ExpenseName?: string;
    SpendType?: string;
    ExpenseType?: string;
    Amount: number;
    SpendDate?: string;
    SpentDate?: string;
    BillDate?: string;
    Status: string;
    VendorName?: string;
    VendorPhone?: string;
    PaymentMode?: string;
    BillImageUrl?: string;
    Notes?: string;
    ApprovedBy?: number;
    ApprovalDate?: string;
}

// Project Service
export const projectService = {
    // Get all projects
    async getAll(filters?: { status?: string; search?: string; limit?: number }): Promise<Project[]> {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const response = await api.get(`/projects?${params}`);
        return response.data.data?.projects || [];
    },

    // Get project by ID
    async getById(id: number): Promise<Project> {
        const response = await api.get(`/projects/${id}`);
        return response.data.data?.project;
    },

    // Get project stats
    async getStats(id: number): Promise<any> {
        const response = await api.get(`/projects/${id}/stats`);
        return response.data.data;
    },

    // Create project (admin only)
    async create(data: Partial<Project>): Promise<Project> {
        const response = await api.post('/projects', data);
        return response.data.data?.project;
    },

    // Update project
    async update(id: number, data: Partial<Project>): Promise<Project> {
        const response = await api.put(`/projects/${id}`, data);
        return response.data.data?.project;
    },

    // Delete project
    async delete(id: number): Promise<void> {
        await api.delete(`/projects/${id}`);
    },

    // ==================== Camps ====================
    async getCamps(projectId: number): Promise<{ camps: Camp[]; stats: any }> {
        const response = await api.get(`/camps/project/${projectId}`);
        return response.data.data;
    },

    async getCampById(id: number): Promise<{ camp: Camp; images: any[]; videos: any[] }> {
        const response = await api.get(`/camps/${id}`);
        return response.data.data;
    },

    async createCamp(data: {
        projectId: number;
        campName: string;
        campDescription?: string;
        campAddress?: string;
        campCity?: string;
        campState?: string;
        campCountry?: string;
        peopleExpected?: number;
        campStartDate?: string;
        campEndDate?: string;
        latitude?: number;
        longitude?: number;
    }): Promise<Camp> {
        const response = await api.post('/camps', data);
        return response.data.data?.camp;
    },

    async updateCamp(id: number, data: Partial<Camp>): Promise<Camp> {
        const response = await api.put(`/camps/${id}`, data);
        return response.data.data?.camp;
    },

    // ==================== Sponsors ====================
    async getSponsors(projectId: number): Promise<Sponsor[]> {
        const response = await api.get(`/project-sponsors?projectId=${projectId}`);
        return response.data.data?.sponsors || [];
    },

    async getPublicSponsors(projectId: number): Promise<Sponsor[]> {
        const response = await api.get(`/project-sponsors/project/${projectId}/public`);
        return response.data.data?.sponsors || [];
    },

    async createSponsor(data: {
        projectId: number;
        sponsorType?: string;
        sponsorId?: number;
        organizationId?: number;
        sponsorName?: string;
        sponsorEmail?: string;
        sponsorPhone?: string;
        sponsorAddress?: string;
        sponsorWebsite?: string;
        purpose?: string;
        sponsorshipType?: string;
        amount?: number;
        currency?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
        isPublic?: boolean;
    }): Promise<Sponsor> {
        const response = await api.post('/project-sponsors', data);
        return response.data.data?.sponsor;
    },

    async updateSponsor(id: number, data: Partial<Sponsor>): Promise<Sponsor> {
        const response = await api.put(`/project-sponsors/${id}`, data);
        return response.data.data?.sponsor;
    },

    async deleteSponsor(id: number): Promise<void> {
        await api.delete(`/project-sponsors/${id}`);
    },

    // ==================== Spends ====================
    async getSpends(projectId: number): Promise<ProjectSpend[]> {
        const response = await api.get(`/project-spends/project/${projectId}`);
        return response.data.data?.spends || [];
    },

    async getSpendById(id: number): Promise<ProjectSpend> {
        const response = await api.get(`/project-spends/${id}`);
        return response.data.data?.spend;
    },

    async createSpend(data: {
        projectId: number;
        expenseName: string;
        expenseType?: string;
        amount: number;
        vendorName?: string;
        vendorPhone?: string;
        paymentMode?: string;
        billDate?: string;
        spentDate?: string;
        notes?: string;
    }): Promise<ProjectSpend> {
        const response = await api.post('/project-spends', data);
        return response.data.data?.spend;
    },

    async updateSpend(id: number, data: Partial<ProjectSpend>): Promise<ProjectSpend> {
        const response = await api.put(`/project-spends/${id}`, data);
        return response.data.data?.spend;
    },

    async deleteSpend(id: number): Promise<void> {
        await api.delete(`/project-spends/${id}`);
    },

    async approveSpend(id: number): Promise<void> {
        await api.post(`/project-spends/${id}/approve`);
    },
};
