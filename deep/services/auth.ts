import api, { TOKEN_KEY, USER_KEY } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface User {
    userId: number;
    fullName: string;
    email: string;
    username?: string;
    mobileNumber?: string;
    role: string;
    roleCode: string;
    organizationId?: number;
    organizationName?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    email: string;
    password: string;
    fullName: string;
    username?: string;
    mobileNumber?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        user: User;
    };
    requiresVerification?: boolean;
}

// Auth Service Functions
export const authService = {
    // Signup
    async signup(data: SignupData): Promise<AuthResponse> {
        const response = await api.post('/auth/signup', data);
        return response.data;
    },

    // Verify OTP
    async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
        const response = await api.post('/auth/verify-otp', { email, otp });
        if (response.data.success && response.data.data?.token) {
            await this.storeAuthData(response.data.data.token, response.data.data.user);
        }
        return response.data;
    },

    // Resend OTP
    async resendOTP(email: string): Promise<AuthResponse> {
        const response = await api.post('/auth/resend-otp', { email });
        return response.data;
    },

    // Login
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post('/auth/login', credentials);
        if (response.data.success && response.data.data?.token) {
            await this.storeAuthData(response.data.data.token, response.data.data.user);
        }
        return response.data;
    },

    // Get profile
    async getProfile(): Promise<User | null> {
        try {
            const response = await api.get('/auth/profile');
            return response.data.data;
        } catch (error) {
            return null;
        }
    },

    // Forgot password
    async forgotPassword(email: string): Promise<AuthResponse> {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    // Reset password
    async resetPassword(email: string, otp: string, newPassword: string): Promise<AuthResponse> {
        const response = await api.post('/auth/reset-password', { email, otp, newPassword });
        return response.data;
    },

    // Store auth data
    async storeAuthData(token: string, user: User): Promise<void> {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    // Get stored auth data
    async getStoredAuth(): Promise<{ token: string | null; user: User | null }> {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        const userStr = await AsyncStorage.getItem(USER_KEY);
        return {
            token,
            user: userStr ? JSON.parse(userStr) : null,
        };
    },

    // Logout
    async logout(): Promise<void> {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    },
};
