import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function SignupScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { signup } = useAuth();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobileNumber: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateField = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Must include uppercase, lowercase, and number';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const result = await signup({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                mobileNumber: formData.mobileNumber || undefined,
            });

            if (result.success) {
                router.push({ pathname: '/(auth)/verify-otp', params: { email: formData.email } });
            } else {
                Alert.alert('Signup Failed', result.message);
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
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
                    <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Sign up to get started with your account
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Input
                        label="Full Name"
                        placeholder="Enter your full name"
                        leftIcon="person-outline"
                        value={formData.fullName}
                        onChangeText={(v) => updateField('fullName', v)}
                        error={errors.fullName}
                    />

                    <Input
                        label="Email"
                        placeholder="Enter your email"
                        leftIcon="mail-outline"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(v) => updateField('email', v)}
                        error={errors.email}
                    />

                    <Input
                        label="Mobile Number (Optional)"
                        placeholder="Enter your mobile number"
                        leftIcon="call-outline"
                        keyboardType="phone-pad"
                        value={formData.mobileNumber}
                        onChangeText={(v) => updateField('mobileNumber', v)}
                        error={errors.mobileNumber}
                    />

                    <Input
                        label="Password"
                        placeholder="Create a strong password"
                        leftIcon="lock-closed-outline"
                        secureTextEntry
                        value={formData.password}
                        onChangeText={(v) => updateField('password', v)}
                        error={errors.password}
                    />

                    <Input
                        label="Confirm Password"
                        placeholder="Confirm your password"
                        leftIcon="lock-closed-outline"
                        secureTextEntry
                        value={formData.confirmPassword}
                        onChangeText={(v) => updateField('confirmPassword', v)}
                        error={errors.confirmPassword}
                    />

                    {/* Password Strength Indicator */}
                    {formData.password && (
                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthBars}>
                                {[1, 2, 3, 4].map((i) => {
                                    const strength = getPasswordStrength(formData.password);
                                    return (
                                        <View
                                            key={i}
                                            style={[
                                                styles.strengthBar,
                                                {
                                                    backgroundColor:
                                                        i <= strength.level
                                                            ? strength.color
                                                            : colors.border,
                                                },
                                            ]}
                                        />
                                    );
                                })}
                            </View>
                            <Text style={[styles.strengthText, { color: getPasswordStrength(formData.password).color }]}>
                                {getPasswordStrength(formData.password).label}
                            </Text>
                        </View>
                    )}

                    <Button
                        title="Create Account"
                        onPress={handleSignup}
                        loading={loading}
                        fullWidth
                        style={{ marginTop: 16 }}
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Already have an account?{' '}
                    </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function getPasswordStrength(password: string) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: '#EF4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#F59E0B' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#10B981' };
    return { level: 4, label: 'Strong', color: '#059669' };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 50,
        paddingBottom: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    form: {
        marginBottom: 24,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -8,
        marginBottom: 8,
    },
    strengthBars: {
        flexDirection: 'row',
        gap: 4,
        flex: 1,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 12,
        minWidth: 50,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 'auto',
    },
    footerText: {
        fontSize: 15,
    },
    footerLink: {
        fontSize: 15,
        fontWeight: '600',
    },
});
