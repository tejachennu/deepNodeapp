import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// For Android Emulator use: http://10.0.2.2:3000/api
// For iOS Simulator/real device use your computer's local IP (e.g., http://192.168.1.x:3000/api)
// Find your IP: Windows (ipconfig), Mac (ifconfig or System Preferences > Network)
const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token storage keys
export const TOKEN_KEY = '@auth_token';
export const USER_KEY = '@user_data';

// Request interceptor - add auth token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired - clear storage
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        }
        return Promise.reject(error);
    }
);

export default api;
