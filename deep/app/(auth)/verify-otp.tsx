import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Button, OTPInput } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';

export default function VerifyOTPScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { verifyOTP } = useAuth();
    const { email } = useLocalSearchParams<{ email: string }>();

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [error, setError] = useState('');

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const result = await verifyOTP(email!, otp);
            if (result.success) {
                router.replace('/(tabs)');
            } else {
                setError(result.message);
                setOtp('');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await authService.resendOTP(email!);
            Alert.alert('OTP Sent', 'A new verification code has been sent to your email.');
            setCountdown(60);
        } catch (err) {
            Alert.alert('Error', 'Failed to resend OTP. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="mail-open-outline" size={48} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Verify Email</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    We've sent a verification code to
                </Text>
                <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
            </View>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
                <OTPInput
                    value={otp}
                    onChange={(value) => {
                        setOtp(value);
                        if (error) setError('');
                    }}
                    error={error}
                />
            </View>

            {/* Verify Button */}
            <Button
                title="Verify Email"
                onPress={handleVerify}
                loading={loading}
                disabled={otp.length !== 6}
                fullWidth
                style={{ marginTop: 32 }}
            />

            {/* Resend */}
            <View style={styles.resendContainer}>
                <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                    Didn't receive the code?{' '}
                </Text>
                {countdown > 0 ? (
                    <Text style={[styles.countdown, { color: colors.textMuted }]}>
                        Resend in {countdown}s
                    </Text>
                ) : (
                    <TouchableOpacity onPress={handleResend} disabled={resending}>
                        <Text style={[styles.resendLink, { color: colors.primary }]}>
                            {resending ? 'Sending...' : 'Resend Code'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 50,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    email: {
        fontSize: 16,
        fontWeight: '600',
    },
    otpContainer: {
        alignItems: 'center',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    resendText: {
        fontSize: 14,
    },
    countdown: {
        fontSize: 14,
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '600',
    },
});
