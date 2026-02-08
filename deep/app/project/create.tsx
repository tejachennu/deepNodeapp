import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { projectService } from '@/services/projectService';

const STATUS_OPTIONS = ['Planning', 'Active', 'On Hold', 'Completed'];

export default function CreateProjectScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        projectName: '',
        projectTitle: '',
        projectDescription: '',
        objective: '',
        location: '',
        status: 'Planning',
        startDate: '',
        endDate: '',
    });

    const updateForm = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        if (!form.projectName.trim()) {
            Alert.alert('Error', 'Project name is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            await projectService.create({
                projectName: form.projectName,
                projectTitle: form.projectTitle || form.projectName,
                projectDescription: form.projectDescription,
                objective: form.objective,
                location: form.location,
                status: form.status,
                startDate: form.startDate || undefined,
                endDate: form.endDate || undefined,
            });

            Alert.alert('Success', 'Project created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Create project error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Create Project',
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text,
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={[styles.container, { backgroundColor: colors.background }]}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Project Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>
                            Project Name <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border,
                                color: colors.text
                            }]}
                            placeholder="Enter project name"
                            placeholderTextColor={colors.placeholder}
                            value={form.projectName}
                            onChangeText={(v) => updateForm('projectName', v)}
                        />
                    </View>

                    {/* Project Title */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Project Title</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border,
                                color: colors.text
                            }]}
                            placeholder="Enter project title (optional)"
                            placeholderTextColor={colors.placeholder}
                            value={form.projectTitle}
                            onChangeText={(v) => updateForm('projectTitle', v)}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                        <TextInput
                            style={[styles.textArea, {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border,
                                color: colors.text
                            }]}
                            placeholder="Describe the project..."
                            placeholderTextColor={colors.placeholder}
                            value={form.projectDescription}
                            onChangeText={(v) => updateForm('projectDescription', v)}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Objective */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Objective</Text>
                        <TextInput
                            style={[styles.textArea, {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border,
                                color: colors.text
                            }]}
                            placeholder="What are the goals of this project?"
                            placeholderTextColor={colors.placeholder}
                            value={form.objective}
                            onChangeText={(v) => updateForm('objective', v)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Location */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Location</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border,
                                color: colors.text
                            }]}
                            placeholder="Enter location"
                            placeholderTextColor={colors.placeholder}
                            value={form.location}
                            onChangeText={(v) => updateForm('location', v)}
                        />
                    </View>

                    {/* Status */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Status</Text>
                        <View style={styles.statusContainer}>
                            {STATUS_OPTIONS.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.statusOption,
                                        {
                                            backgroundColor: form.status === status
                                                ? colors.primary
                                                : colors.inputBackground,
                                            borderColor: form.status === status
                                                ? colors.primary
                                                : colors.border,
                                        }
                                    ]}
                                    onPress={() => updateForm('status', status)}
                                >
                                    <Text style={[
                                        styles.statusOptionText,
                                        { color: form.status === status ? '#FFFFFF' : colors.textSecondary }
                                    ]}>
                                        {status}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Dates */}
                    <View style={styles.dateRow}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.inputBackground,
                                    borderColor: colors.border,
                                    color: colors.text
                                }]}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.placeholder}
                                value={form.startDate}
                                onChangeText={(v) => updateForm('startDate', v)}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.inputBackground,
                                    borderColor: colors.border,
                                    color: colors.text
                                }]}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.placeholder}
                                value={form.endDate}
                                onChangeText={(v) => updateForm('endDate', v)}
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: colors.primary }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
                                <Text style={styles.submitText}>Create Project</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    required: { color: '#EF4444' },
    input: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
        fontSize: 16,
    },
    statusContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusOptionText: { fontSize: 14, fontWeight: '500' },
    dateRow: { flexDirection: 'row', gap: 12 },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        borderRadius: 12,
        marginTop: 12,
        gap: 8,
    },
    submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
