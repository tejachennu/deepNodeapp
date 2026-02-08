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
        console.log('🔐 LOGIN DEBUG:');
        console.log('📍 API Base URL:', api.defaults.baseURL);
        console.log('📧 Email:', credentials.email);
        console.log('🔑 Password:', credentials.password ? '****' : 'empty');

        try {
            console.log('📤 Sending login request...');
            const response = await api.post('/auth/login', credentials);
            console.log('📥 Response status:', response.status);
            console.log('📥 Response data:', JSON.stringify(response.data, null, 2));

            if (response.data.success && response.data.data?.token) {
                console.log('✅ Login successful, storing auth data...');
                await this.storeAuthData(response.data.data.token, response.data.data.user);
            } else {
                console.log('❌ Login failed:', response.data.message);
            }
            return response.data;
        } catch (error: any) {
            console.log('❌ LOGIN ERROR:');
            console.log('   Error message:', error.message);
            console.log('   Error response:', error.response?.data);
            console.log('   Error status:', error.response?.status);
            console.log('   Full error:', JSON.stringify(error, null, 2));
            throw error;
        }
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
