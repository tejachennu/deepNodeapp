import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/auth';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string; requiresVerification?: boolean }>;
    signup: (data: { email: string; password: string; fullName: string; mobileNumber?: string }) => Promise<{ success: boolean; message: string }>;
    verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const stored = await authService.getStoredAuth();
            if (stored.token && stored.user) {
                setToken(stored.token);
                setUser(stored.user);
                // Optionally refresh user data
                const profile = await authService.getProfile();
                if (profile) {
                    setUser(profile);
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });
            if (response.success && response.data) {
                setToken(response.data.token);
                setUser(response.data.user);
            }
            return {
                success: response.success,
                message: response.message,
                requiresVerification: response.requiresVerification
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
                requiresVerification: error.response?.data?.requiresVerification
            };
        }
    };

    const signup = async (data: { email: string; password: string; fullName: string; mobileNumber?: string }) => {
        try {
            const response = await authService.signup(data);
            return { success: response.success, message: response.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Signup failed' };
        }
    };

    const verifyOTP = async (email: string, otp: string) => {
        try {
            const response = await authService.verifyOTP(email, otp);
            if (response.success && response.data) {
                setToken(response.data.token);
                setUser(response.data.user);
            }
            return { success: response.success, message: response.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Verification failed' };
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setToken(null);
    };

    const refreshUser = async () => {
        const profile = await authService.getProfile();
        if (profile) {
            setUser(profile);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!token && !!user,
                login,
                signup,
                verifyOTP,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
