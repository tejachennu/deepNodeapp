import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services/auth';

export default function ForgotPasswordScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSendOTP = async () => {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setErrors({ email: 'Please enter a valid email' });
            return;
        }

        setLoading(true);
        try {
            await authService.forgotPassword(email);
            Alert.alert('OTP Sent', 'If an account exists with this email, you will receive a reset code.');
            setStep('reset');
        } catch (err) {
            Alert.alert('Error', 'Failed to send reset code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const newErrors: Record<string, string> = {};

        if (!otp || otp.length !== 6) {
            newErrors.otp = 'Please enter the 6-digit code';
        }
        if (!newPassword || newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        }
        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const result = await authService.resetPassword(email, otp, newPassword);
            if (result.success) {
                Alert.alert('Success', 'Your password has been reset successfully.', [
                    { text: 'OK', onPress: () => router.replace('/(auth)/login') },
                ]);
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
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
                onPress={() => (step === 'reset' ? setStep('email') : router.back())}
            >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons
                        name={step === 'email' ? 'key-outline' : 'lock-open-outline'}
                        size={48}
                        color={colors.primary}
                    />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                    {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {step === 'email'
                        ? 'Enter your email and we\'ll send you a reset code'
                        : 'Enter the code sent to your email and create a new password'}
                </Text>
            </View>

            {/* Forms */}
            {step === 'email' ? (
                <View style={styles.form}>
                    <Input
                        label="Email"
                        placeholder="Enter your email"
                        leftIcon="mail-outline"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={(v) => {
                            setEmail(v);
                            if (errors.email) setErrors({});
                        }}
                        error={errors.email}
                    />
                    <Button
                        title="Send Reset Code"
                        onPress={handleSendOTP}
                        loading={loading}
                        fullWidth
                        style={{ marginTop: 8 }}
                    />
                </View>
            ) : (
                <View style={styles.form}>
                    <Input
                        label="Verification Code"
                        placeholder="Enter 6-digit code"
                        leftIcon="keypad-outline"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={(v) => {
                            setOtp(v);
                            if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
                        }}
                        error={errors.otp}
                    />
                    <Input
                        label="New Password"
                        placeholder="Create new password"
                        leftIcon="lock-closed-outline"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={(v) => {
                            setNewPassword(v);
                            if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                        }}
                        error={errors.newPassword}
                    />
                    <Input
                        label="Confirm Password"
                        placeholder="Confirm new password"
                        leftIcon="lock-closed-outline"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={(v) => {
                            setConfirmPassword(v);
                            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                        }}
                        error={errors.confirmPassword}
                    />
                    <Button
                        title="Reset Password"
                        onPress={handleResetPassword}
                        loading={loading}
                        fullWidth
                        style={{ marginTop: 8 }}
                    />
                </View>
            )}

            {/* Back to Login */}
            <TouchableOpacity
                style={styles.backToLogin}
                onPress={() => router.replace('/(auth)/login')}
            >
                <Ionicons name="arrow-back" size={16} color={colors.primary} />
                <Text style={[styles.backToLoginText, { color: colors.primary }]}>
                    Back to Login
                </Text>
            </TouchableOpacity>
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
        lineHeight: 22,
    },
    form: {
        marginBottom: 24,
    },
    backToLogin: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 32,
    },
    backToLoginText: {
        fontSize: 15,
        fontWeight: '500',
    },
});
