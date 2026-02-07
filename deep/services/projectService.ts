import api from './api';

// Types
export interface Project {
    ProjectId: number;
    ProjectName: string;
    ProjectCode: string;
    ShortDescription?: string;
    LongDescription?: string;
    ProjectType?: string;
    Location?: string;
    TargetAmount?: number;
    CollectedAmount?: number;
    StartDate?: string;
    EndDate?: string;
    Status: string;
    BannerImage?: string;
    OrganizationName?: string;
}

export interface Camp {
    CampId: number;
    CampName: string;
    CampDescription?: string;
    CampType?: string;
    CampAddress?: string;
    CampState?: string;
    CampCity?: string;
    PeopleExpected?: number;
    PeopleAttended?: number;
    CampStartDate?: string;
    CampEndDate?: string;
    CampStatus: string;
    ImageCount?: number;
    VideoCount?: number;
}

export interface Sponsor {
    ProjectSponsorId: number;
    SponsorType: string;
    SponsorName?: string;
    SponsorLogo?: string;
    Purpose?: string;
    SponsorshipType?: string;
    Amount?: number;
    Status: string;
    OrganizationName?: string;
}

export interface ProjectSpend {
    SpendId: number;
    SpendName: string;
    SpendType?: string;
    Amount: number;
    SpendDate?: string;
    Status: string;
    VendorName?: string;
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

    async createCamp(data: Partial<Camp> & { projectId: number }): Promise<Camp> {
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

    async createSponsor(data: Partial<Sponsor> & { projectId: number }): Promise<Sponsor> {
        const response = await api.post('/project-sponsors', data);
        return response.data.data?.sponsor;
    },

    // ==================== Spends ====================
    async getSpends(projectId: number): Promise<ProjectSpend[]> {
        const response = await api.get(`/project-spends?projectId=${projectId}`);
        return response.data.data?.spends || [];
    },

    async createSpend(data: Partial<ProjectSpend> & { projectId: number }): Promise<ProjectSpend> {
        const response = await api.post('/project-spends', data);
        return response.data.data?.spend;
    },
};

export default projectService;
