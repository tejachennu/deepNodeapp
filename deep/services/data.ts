import api from './api';

// Types
export interface Organization {
    organizationId: number;
    organizationName: string;
    organizationType: 'Orphanage' | 'School' | 'NGO' | 'Shelter Home';
    registrationNumber?: string;
    contactPersonName?: string;
    contactMobile?: string;
    contactEmail?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    totalBeneficiaries: number;
    isActive: boolean;
    memberCount?: number;
}

export interface Role {
    roleId: number;
    roleName: string;
    roleCode: string;
    description?: string;
    isActive: boolean;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: {
        organizations?: T[];
        users?: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

// Organization Service
export const organizationService = {
    async getAll(params?: { page?: number; limit?: number; search?: string; type?: string }) {
        const response = await api.get('/organizations', { params });
        return response.data;
    },

    async getById(id: number) {
        const response = await api.get(`/organizations/${id}`);
        return response.data;
    },

    async create(data: Partial<Organization>) {
        const response = await api.post('/organizations', data);
        return response.data;
    },

    async update(id: number, data: Partial<Organization>) {
        const response = await api.put(`/organizations/${id}`, data);
        return response.data;
    },

    async delete(id: number) {
        const response = await api.delete(`/organizations/${id}`);
        return response.data;
    },

    async getMembers(id: number) {
        const response = await api.get(`/organizations/${id}/members`);
        return response.data;
    },

    async getTypes() {
        const response = await api.get('/organizations/types');
        return response.data.data;
    },
};

// Role Service
export const roleService = {
    async getAll() {
        const response = await api.get('/roles');
        return response.data;
    },

    async getById(id: number) {
        const response = await api.get(`/roles/${id}`);
        return response.data;
    },
};

// User Service
export const userService = {
    async getAll(params?: { page?: number; limit?: number; search?: string; status?: string; roleId?: number }) {
        const response = await api.get('/users', { params });
        return response.data;
    },

    async getById(id: number) {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    async updateProfile(data: { fullName?: string; mobileNumber?: string; username?: string }) {
        const response = await api.put('/users/profile', data);
        return response.data;
    },

    async changePassword(currentPassword: string, newPassword: string) {
        const response = await api.post('/users/change-password', { currentPassword, newPassword });
        return response.data;
    },

    async assignRole(userId: number, roleId: number) {
        const response = await api.put(`/users/${userId}/role`, { roleId });
        return response.data;
    },

    async updateStatus(userId: number, status: 'Active' | 'Inactive' | 'Blocked') {
        const response = await api.patch(`/users/${userId}/status`, { status });
        return response.data;
    },
};
