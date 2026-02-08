import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { projectService, Project, Camp, Sponsor, ProjectSpend } from '@/services/projectService';
import { isAdmin } from '@/utils/permissions';
import api from '@/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

type TabType = 'overview' | 'camps' | 'sponsors' | 'spends';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    Active: { bg: '#DCFCE7', text: '#166534' },
    Ongoing: { bg: '#DCFCE7', text: '#166534' },
    Planning: { bg: '#FEF3C7', text: '#92400E' },
    Planned: { bg: '#FEF3C7', text: '#92400E' },
    Completed: { bg: '#DBEAFE', text: '#1E40AF' },
    'On Hold': { bg: '#FEE2E2', text: '#991B1B' },
};

export default function ProjectDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { user } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [camps, setCamps] = useState<Camp[]>([]);
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [spends, setSpends] = useState<ProjectSpend[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Modal states
    const [editProjectModal, setEditProjectModal] = useState(false);
    const [addCampModal, setAddCampModal] = useState(false);
    const [addSponsorModal, setAddSponsorModal] = useState(false);
    const [addSpendModal, setAddSpendModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchingUser, setSearchingUser] = useState(false);

    // Date picker states
    const [showCampStartDate, setShowCampStartDate] = useState(false);
    const [showCampEndDate, setShowCampEndDate] = useState(false);
    const [showSpendDate, setShowSpendDate] = useState(false);
    const [showSponsorStartDate, setShowSponsorStartDate] = useState(false);
    const [showSponsorEndDate, setShowSponsorEndDate] = useState(false);

    // Form states
    const [projectForm, setProjectForm] = useState({
        projectName: '',
        projectDescription: '',
        objective: '',
        location: '',
        status: '',
    });
    const [campForm, setCampForm] = useState({
        campName: '',
        campDescription: '',
        campAddress: '',
        campCity: '',
        campState: '',
        campCountry: 'India',
        peopleExpected: '',
        campStartDate: new Date(),
        campEndDate: new Date(),
    });
    const [sponsorForm, setSponsorForm] = useState({
        sponsorPhone: '',
        sponsorId: null as number | null,
        sponsorName: '',
        sponsorEmail: '',
        sponsorType: 'INDIVIDUAL',
        sponsorshipType: 'FINANCIAL',
        amount: '',
        purpose: '',
        startDate: new Date(),
        endDate: new Date(),
        status: 'Active',
        isUserFound: false,
    });
    const [spendForm, setSpendForm] = useState({
        expenseName: '',
        expenseType: 'Material',
        amount: '',
        vendorName: '',
        vendorPhone: '',
        paymentMode: 'Cash',
        spentDate: new Date(),
        notes: '',
    });

    const canEdit = isAdmin(user?.roleCode || '');

    const fetchData = async () => {
        try {
            const projectData = await projectService.getById(Number(id));
            setProject(projectData);
            setProjectForm({
                projectName: projectData?.ProjectName || '',
                projectDescription: projectData?.ProjectDescription || projectData?.ShortDescription || '',
                objective: projectData?.Objective || '',
                location: projectData?.Location || '',
                status: projectData?.Status || '',
            });

            const campsData = await projectService.getCamps(Number(id));
            setCamps(campsData.camps || []);

            const sponsorsData = await projectService.getSponsors(Number(id));
            setSponsors(sponsorsData);

            if (canEdit) {
                const spendsData = await projectService.getSpends(Number(id));
                setSpends(spendsData);
            }
        } catch (error) {
            console.error('Failed to fetch project:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Search user by phone number for sponsor
    const searchUserByPhone = useCallback(async (phone: string) => {
        if (phone.length < 10) return;

        setSearchingUser(true);
        try {
            const response = await api.get(`/users/search-by-phone?phone=${phone}`);
            if (response.data.found && response.data.data) {
                const userData = response.data.data;
                setSponsorForm(prev => ({
                    ...prev,
                    sponsorId: userData.userId,
                    sponsorName: userData.fullName,
                    sponsorEmail: userData.email || '',
                    isUserFound: true,
                }));
            } else {
                setSponsorForm(prev => ({
                    ...prev,
                    sponsorId: null,
                    isUserFound: false,
                }));
            }
        } catch (error) {
            console.error('Error searching user:', error);
        } finally {
            setSearchingUser(false);
        }
    }, []);

    // Save handlers
    const handleSaveProject = async () => {
        setSaving(true);
        try {
            await projectService.update(Number(id), {
                projectName: projectForm.projectName,
                projectDescription: projectForm.projectDescription,
                objective: projectForm.objective,
                location: projectForm.location,
                status: projectForm.status,
            });
            Alert.alert('Success', 'Project updated successfully');
            setEditProjectModal(false);
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to update project');
        } finally {
            setSaving(false);
        }
    };

    const handleAddCamp = async () => {
        if (!campForm.campName) {
            Alert.alert('Error', 'Camp name is required');
            return;
        }
        setSaving(true);
        try {
            await projectService.createCamp({
                projectId: Number(id),
                campName: campForm.campName,
                campDescription: campForm.campDescription,
                campAddress: campForm.campAddress,
                campCity: campForm.campCity,
                campState: campForm.campState,
                campCountry: campForm.campCountry,
                peopleExpected: campForm.peopleExpected ? parseInt(campForm.peopleExpected) : undefined,
                campStartDate: campForm.campStartDate.toISOString().split('T')[0],
                campEndDate: campForm.campEndDate.toISOString().split('T')[0],
            });
            Alert.alert('Success', 'Camp added successfully');
            setAddCampModal(false);
            setCampForm({
                campName: '', campDescription: '', campAddress: '', campCity: '', campState: '',
                campCountry: 'India', peopleExpected: '', campStartDate: new Date(), campEndDate: new Date(),
            });
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to add camp');
        } finally {
            setSaving(false);
        }
    };

    const handleAddSponsor = async () => {
        if (!sponsorForm.sponsorName) {
            Alert.alert('Error', 'Sponsor name is required');
            return;
        }
        setSaving(true);
        try {
            await projectService.createSponsor({
                projectId: Number(id),
                sponsorType: sponsorForm.sponsorType,
                sponsorId: sponsorForm.sponsorId || undefined,
                sponsorName: sponsorForm.sponsorName,
                sponsorEmail: sponsorForm.sponsorEmail,
                sponsorPhone: sponsorForm.sponsorPhone,
                sponsorshipType: sponsorForm.sponsorshipType,
                amount: sponsorForm.amount ? parseFloat(sponsorForm.amount) : undefined,
                purpose: sponsorForm.purpose,
                startDate: sponsorForm.startDate.toISOString().split('T')[0],
                endDate: sponsorForm.endDate.toISOString().split('T')[0],
                status: sponsorForm.status,
            });
            Alert.alert('Success', 'Sponsor added successfully');
            setAddSponsorModal(false);
            setSponsorForm({
                sponsorPhone: '', sponsorId: null, sponsorName: '', sponsorEmail: '',
                sponsorType: 'INDIVIDUAL', sponsorshipType: 'FINANCIAL', amount: '', purpose: '',
                startDate: new Date(), endDate: new Date(), status: 'Active', isUserFound: false,
            });
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to add sponsor');
        } finally {
            setSaving(false);
        }
    };

    const handleAddSpend = async () => {
        if (!spendForm.expenseName || !spendForm.amount) {
            Alert.alert('Error', 'Expense name and amount are required');
            return;
        }
        setSaving(true);
        try {
            await projectService.createSpend({
                projectId: Number(id),
                expenseName: spendForm.expenseName,
                expenseType: spendForm.expenseType,
                amount: parseFloat(spendForm.amount),
                vendorName: spendForm.vendorName,
                vendorPhone: spendForm.vendorPhone,
                paymentMode: spendForm.paymentMode,
                spentDate: spendForm.spentDate.toISOString().split('T')[0],
                notes: spendForm.notes,
            });
            Alert.alert('Success', 'Expense added successfully');
            setAddSpendModal(false);
            setSpendForm({
                expenseName: '', expenseType: 'Material', amount: '', vendorName: '',
                vendorPhone: '', paymentMode: 'Cash', spentDate: new Date(), notes: '',
            });
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to add expense');
        } finally {
            setSaving(false);
        }
    };

    // FAB action based on active tab
    const handleFabPress = () => {
        switch (activeTab) {
            case 'overview':
                setEditProjectModal(true);
                break;
            case 'camps':
                setAddCampModal(true);
                break;
            case 'sponsors':
                setAddSponsorModal(true);
                break;
            case 'spends':
                setAddSpendModal(true);
                break;
        }
    };

    const getFabIcon = () => activeTab === 'overview' ? 'pencil' : 'add';

    const formatDate = (date: Date) => date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!project) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>Project not found</Text>
            </View>
        );
    }

    const statusStyle = STATUS_COLORS[project.Status] || STATUS_COLORS['Active'];
    const progress = project.TargetAmount && project.TargetAmount > 0
        ? Math.min((project.CollectedAmount || 0) / project.TargetAmount * 100, 100)
        : 0;

    const tabs: { key: TabType; label: string; icon: string }[] = [
        { key: 'overview', label: 'Overview', icon: 'information-circle-outline' },
        { key: 'camps', label: 'Camps', icon: 'people-outline' },
        { key: 'sponsors', label: 'Sponsors', icon: 'heart-outline' },
        { key: 'spends', label: 'Spends', icon: 'wallet-outline' },
    ];

    const renderModal = (
        visible: boolean,
        onClose: () => void,
        title: string,
        onSave: () => void,
        children: React.ReactNode
    ) => (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {children}
                    </ScrollView>
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={onSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    const renderInput = (
        label: string,
        value: string,
        onChangeText: (text: string) => void,
        placeholder?: string,
        options?: { multiline?: boolean; keyboardType?: 'default' | 'numeric' | 'phone-pad'; editable?: boolean; suffix?: React.ReactNode }
    ) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[
                        styles.input,
                        options?.multiline && styles.textArea,
                        { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                        !options?.editable && options?.editable !== undefined && { backgroundColor: colors.border + '40' }
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    multiline={options?.multiline}
                    keyboardType={options?.keyboardType}
                    editable={options?.editable !== false}
                />
                {options?.suffix}
            </View>
        </View>
    );

    const renderDateInput = (label: string, date: Date, onPress: () => void) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
            <TouchableOpacity
                style={[styles.input, styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={onPress}
            >
                <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(date)}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
        </View>
    );

    const renderOptions = (
        label: string,
        options: string[],
        selected: string,
        onSelect: (value: string) => void
    ) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
            <View style={styles.optionsRow}>
                {options.map((opt) => (
                    <TouchableOpacity
                        key={opt}
                        style={[
                            styles.optionChip,
                            { borderColor: colors.border },
                            selected === opt && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={() => onSelect(opt)}
                    >
                        <Text style={[
                            styles.optionText,
                            { color: selected === opt ? '#FFFFFF' : colors.text }
                        ]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <>
            <Stack.Screen options={{ title: project.ProjectCode }} />
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Banner */}
                {project.BannerImage && (
                    <Image source={{ uri: project.BannerImage }} style={styles.banner} resizeMode="cover" />
                )}

                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{project.Status}</Text>
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>{project.ProjectName}</Text>
                    {project.Location && (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                            <Text style={[styles.location, { color: colors.textMuted }]}>{project.Location}</Text>
                        </View>
                    )}
                </View>

                {/* Progress Card */}
                {project.TargetAmount && project.TargetAmount > 0 && (
                    <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.progressHeader}>
                            <Text style={[styles.collectedAmount, { color: colors.text }]}>
                                ₹{((project.CollectedAmount || 0) / 1000).toFixed(1)}K
                            </Text>
                            <Text style={[styles.targetLabel, { color: colors.textMuted }]}>
                                of ₹{(project.TargetAmount / 1000).toFixed(0)}K goal
                            </Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
                        </View>
                        <Text style={[styles.progressPercent, { color: colors.primary }]}>{progress.toFixed(0)}% funded</Text>
                    </View>
                )}

                {/* Tab Bar */}
                <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={18}
                                color={activeTab === tab.key ? colors.primary : colors.textMuted}
                            />
                            <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.primary : colors.textMuted }]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {activeTab === 'overview' && (
                        <View style={styles.overviewContent}>
                            {project.ShortDescription && (
                                <Text style={[styles.description, { color: colors.textSecondary }]}>{project.ShortDescription}</Text>
                            )}
                            {project.LongDescription && (
                                <Text style={[styles.longDescription, { color: colors.text }]}>{project.LongDescription}</Text>
                            )}
                            {project.StartDate && (
                                <View style={[styles.infoRow, { borderColor: colors.border }]}>
                                    <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                                    <Text style={[styles.infoText, { color: colors.text }]}>
                                        {new Date(project.StartDate).toLocaleDateString()}
                                        {project.EndDate && ` - ${new Date(project.EndDate).toLocaleDateString()}`}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'camps' && (
                        <View style={styles.listContent}>
                            {camps.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No camps yet</Text>
                                    {canEdit && (
                                        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setAddCampModal(true)}>
                                            <Ionicons name="add" size={20} color="#FFFFFF" />
                                            <Text style={styles.addButtonText}>Add Camp</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                camps.map((camp) => (
                                    <TouchableOpacity
                                        key={camp.CampId}
                                        style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                        onPress={() => router.push(`/camp/${camp.CampId}`)}
                                    >
                                        <View style={styles.listCardHeader}>
                                            <Text style={[styles.listCardTitle, { color: colors.text }]}>{camp.CampName}</Text>
                                            <View style={[styles.miniBadge, { backgroundColor: colors.primaryLight + '30' }]}>
                                                <Text style={[styles.miniBadgeText, { color: colors.primary }]}>{camp.CampStatus}</Text>
                                            </View>
                                        </View>
                                        {camp.CampCity && (
                                            <Text style={[styles.listCardSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                                                {camp.CampCity}, {camp.CampState}
                                            </Text>
                                        )}
                                        <View style={styles.listCardStats}>
                                            <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                                <Ionicons name="people" size={12} /> {camp.PeopleAttended || 0} attended
                                            </Text>
                                            <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                                <Ionicons name="images" size={12} /> {camp.ImageCount || 0} photos
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'sponsors' && (
                        <View style={styles.listContent}>
                            {sponsors.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No sponsors yet</Text>
                                    {canEdit && (
                                        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setAddSponsorModal(true)}>
                                            <Ionicons name="add" size={20} color="#FFFFFF" />
                                            <Text style={styles.addButtonText}>Add Sponsor</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                sponsors.map((sponsor) => (
                                    <View key={sponsor.ProjectSponsorId} style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <View style={styles.listCardHeader}>
                                            <Text style={[styles.listCardTitle, { color: colors.text }]}>
                                                {sponsor.SponsorName || sponsor.OrganizationName || 'Anonymous'}
                                            </Text>
                                            <View style={[styles.miniBadge, { backgroundColor: colors.success + '20' }]}>
                                                <Text style={[styles.miniBadgeText, { color: colors.success }]}>{sponsor.SponsorshipType}</Text>
                                            </View>
                                        </View>
                                        {sponsor.Purpose && (
                                            <Text style={[styles.listCardSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>{sponsor.Purpose}</Text>
                                        )}
                                        {sponsor.Amount && sponsor.Amount > 0 && (
                                            <Text style={[styles.sponsorAmount, { color: colors.primary }]}>₹{(sponsor.Amount / 1000).toFixed(1)}K</Text>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'spends' && (
                        <View style={styles.listContent}>
                            {spends.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No expenses yet</Text>
                                    {canEdit && (
                                        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setAddSpendModal(true)}>
                                            <Ionicons name="add" size={20} color="#FFFFFF" />
                                            <Text style={styles.addButtonText}>Add Expense</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                spends.map((spend) => (
                                    <View key={spend.SpendId} style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <View style={styles.listCardHeader}>
                                            <Text style={[styles.listCardTitle, { color: colors.text }]}>{spend.ExpenseName || spend.SpendName}</Text>
                                            <View style={[styles.miniBadge, { backgroundColor: colors.warning + '20' }]}>
                                                <Text style={[styles.miniBadgeText, { color: colors.warning }]}>{spend.ExpenseType || spend.SpendType}</Text>
                                            </View>
                                        </View>
                                        {spend.VendorName && (
                                            <Text style={[styles.listCardSubtitle, { color: colors.textMuted }]}>Vendor: {spend.VendorName}</Text>
                                        )}
                                        <Text style={[styles.spendAmount, { color: colors.error }]}>-₹{(spend.Amount / 1000).toFixed(1)}K</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Context-aware FAB */}
            {canEdit && (
                <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleFabPress}>
                    <Ionicons name={getFabIcon()} size={24} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {/* Edit Project Modal */}
            {renderModal(editProjectModal, () => setEditProjectModal(false), 'Edit Project', handleSaveProject, (
                <>
                    {renderInput('Project Name', projectForm.projectName, (v) => setProjectForm({ ...projectForm, projectName: v }), 'Enter project name')}
                    {renderInput('Description', projectForm.projectDescription, (v) => setProjectForm({ ...projectForm, projectDescription: v }), 'Enter description', { multiline: true })}
                    {renderInput('Objective', projectForm.objective, (v) => setProjectForm({ ...projectForm, objective: v }), 'Enter objective', { multiline: true })}
                    {renderInput('Location', projectForm.location, (v) => setProjectForm({ ...projectForm, location: v }), 'Enter location')}
                    {renderOptions('Status', ['Planned', 'Ongoing', 'Completed', 'On Hold'], projectForm.status, (v) => setProjectForm({ ...projectForm, status: v }))}
                </>
            ))}

            {/* Add Camp Modal */}
            {renderModal(addCampModal, () => setAddCampModal(false), 'Add Camp', handleAddCamp, (
                <>
                    {renderInput('Camp Name *', campForm.campName, (v) => setCampForm({ ...campForm, campName: v }), 'Enter camp name')}
                    {renderInput('Description', campForm.campDescription, (v) => setCampForm({ ...campForm, campDescription: v }), 'Enter description', { multiline: true })}
                    {renderInput('Address', campForm.campAddress, (v) => setCampForm({ ...campForm, campAddress: v }), 'Enter address')}
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            {renderInput('City', campForm.campCity, (v) => setCampForm({ ...campForm, campCity: v }), 'City')}
                        </View>
                        <View style={styles.halfInput}>
                            {renderInput('State', campForm.campState, (v) => setCampForm({ ...campForm, campState: v }), 'State')}
                        </View>
                    </View>
                    {renderInput('Expected People', campForm.peopleExpected, (v) => setCampForm({ ...campForm, peopleExpected: v }), 'Enter number', { keyboardType: 'numeric' })}
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            {renderDateInput('Start Date', campForm.campStartDate, () => setShowCampStartDate(true))}
                        </View>
                        <View style={styles.halfInput}>
                            {renderDateInput('End Date', campForm.campEndDate, () => setShowCampEndDate(true))}
                        </View>
                    </View>
                    {showCampStartDate && (
                        <DateTimePicker
                            value={campForm.campStartDate}
                            mode="date"
                            onChange={(e, date) => { setShowCampStartDate(false); date && setCampForm({ ...campForm, campStartDate: date }); }}
                        />
                    )}
                    {showCampEndDate && (
                        <DateTimePicker
                            value={campForm.campEndDate}
                            mode="date"
                            onChange={(e, date) => { setShowCampEndDate(false); date && setCampForm({ ...campForm, campEndDate: date }); }}
                        />
                    )}
                </>
            ))}

            {/* Add Sponsor Modal */}
            {renderModal(addSponsorModal, () => setAddSponsorModal(false), 'Add Sponsor', handleAddSponsor, (
                <>
                    {renderInput(
                        'Phone Number',
                        sponsorForm.sponsorPhone,
                        (v) => {
                            setSponsorForm({ ...sponsorForm, sponsorPhone: v });
                            if (v.length === 10) searchUserByPhone(v);
                        },
                        'Enter 10-digit mobile',
                        {
                            keyboardType: 'phone-pad',
                            suffix: searchingUser ? <ActivityIndicator size="small" style={styles.inputSuffix} /> :
                                sponsorForm.isUserFound ? <Ionicons name="checkmark-circle" size={20} color={colors.success} style={styles.inputSuffix} /> : null
                        }
                    )}
                    {sponsorForm.isUserFound && (
                        <View style={[styles.userFoundBanner, { backgroundColor: colors.success + '15' }]}>
                            <Ionicons name="person-circle" size={20} color={colors.success} />
                            <Text style={[styles.userFoundText, { color: colors.success }]}>User found! Details auto-filled.</Text>
                        </View>
                    )}
                    {renderInput('Sponsor Name *', sponsorForm.sponsorName, (v) => setSponsorForm({ ...sponsorForm, sponsorName: v }), 'Enter name', { editable: !sponsorForm.isUserFound })}
                    {renderInput('Email', sponsorForm.sponsorEmail, (v) => setSponsorForm({ ...sponsorForm, sponsorEmail: v }), 'Enter email', { editable: !sponsorForm.isUserFound })}
                    {renderOptions('Sponsor Type', ['INDIVIDUAL', 'ORGANIZATION'], sponsorForm.sponsorType, (v) => setSponsorForm({ ...sponsorForm, sponsorType: v }))}
                    {renderOptions('Sponsorship Type', ['FINANCIAL', 'IN_KIND', 'SERVICES', 'MATERIALS'], sponsorForm.sponsorshipType, (v) => setSponsorForm({ ...sponsorForm, sponsorshipType: v }))}
                    {renderInput('Amount (₹)', sponsorForm.amount, (v) => setSponsorForm({ ...sponsorForm, amount: v }), 'Enter amount', { keyboardType: 'numeric' })}
                    {renderInput('Purpose', sponsorForm.purpose, (v) => setSponsorForm({ ...sponsorForm, purpose: v }), 'Purpose of sponsorship', { multiline: true })}
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            {renderDateInput('Start Date', sponsorForm.startDate, () => setShowSponsorStartDate(true))}
                        </View>
                        <View style={styles.halfInput}>
                            {renderDateInput('End Date', sponsorForm.endDate, () => setShowSponsorEndDate(true))}
                        </View>
                    </View>
                    {showSponsorStartDate && (
                        <DateTimePicker
                            value={sponsorForm.startDate}
                            mode="date"
                            onChange={(e, date) => { setShowSponsorStartDate(false); date && setSponsorForm({ ...sponsorForm, startDate: date }); }}
                        />
                    )}
                    {showSponsorEndDate && (
                        <DateTimePicker
                            value={sponsorForm.endDate}
                            mode="date"
                            onChange={(e, date) => { setShowSponsorEndDate(false); date && setSponsorForm({ ...sponsorForm, endDate: date }); }}
                        />
                    )}
                </>
            ))}

            {/* Add Spend Modal */}
            {renderModal(addSpendModal, () => setAddSpendModal(false), 'Add Expense', handleAddSpend, (
                <>
                    {renderInput('Expense Name *', spendForm.expenseName, (v) => setSpendForm({ ...spendForm, expenseName: v }), 'Enter expense name')}
                    {renderOptions('Expense Type', ['Material', 'Service', 'Transport', 'Food', 'Venue', 'Other'], spendForm.expenseType, (v) => setSpendForm({ ...spendForm, expenseType: v }))}
                    {renderInput('Amount (₹) *', spendForm.amount, (v) => setSpendForm({ ...spendForm, amount: v }), 'Enter amount', { keyboardType: 'numeric' })}
                    {renderInput('Vendor Name', spendForm.vendorName, (v) => setSpendForm({ ...spendForm, vendorName: v }), 'Enter vendor name')}
                    {renderInput('Vendor Phone', spendForm.vendorPhone, (v) => setSpendForm({ ...spendForm, vendorPhone: v }), 'Enter phone', { keyboardType: 'phone-pad' })}
                    {renderOptions('Payment Mode', ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'], spendForm.paymentMode, (v) => setSpendForm({ ...spendForm, paymentMode: v }))}
                    {renderDateInput('Spent Date', spendForm.spentDate, () => setShowSpendDate(true))}
                    {showSpendDate && (
                        <DateTimePicker
                            value={spendForm.spentDate}
                            mode="date"
                            onChange={(e, date) => { setShowSpendDate(false); date && setSpendForm({ ...spendForm, spentDate: date }); }}
                        />
                    )}
                    {renderInput('Notes', spendForm.notes, (v) => setSpendForm({ ...spendForm, notes: v }), 'Optional notes', { multiline: true })}
                </>
            ))}
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    errorText: { fontSize: 16, fontWeight: '500' },
    banner: { width: '100%', height: 200 },
    header: { padding: 16, gap: 8 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    statusText: { fontSize: 12, fontWeight: '600' },
    title: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    location: { fontSize: 14 },
    progressCard: { margin: 16, marginTop: 0, padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
    progressHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    collectedAmount: { fontSize: 24, fontWeight: '700' },
    targetLabel: { fontSize: 14 },
    progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    progressPercent: { fontSize: 13, fontWeight: '600' },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8 },
    tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, gap: 6 },
    tabText: { fontSize: 13, fontWeight: '500' },
    tabContent: { padding: 16 },
    overviewContent: { gap: 12 },
    description: { fontSize: 15, lineHeight: 22 },
    longDescription: { fontSize: 14, lineHeight: 22 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1 },
    infoText: { fontSize: 14 },
    listContent: { gap: 12 },
    listCard: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
    listCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listCardTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
    listCardSubtitle: { fontSize: 13 },
    listCardStats: { flexDirection: 'row', gap: 16, marginTop: 4 },
    statText: { fontSize: 12 },
    miniBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    miniBadgeText: { fontSize: 11, fontWeight: '500' },
    sponsorAmount: { fontSize: 16, fontWeight: '700', marginTop: 4 },
    spendAmount: { fontSize: 16, fontWeight: '700', marginTop: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 14 },
    addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6, marginTop: 8 },
    addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalBody: { padding: 16 },
    modalFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#E5E5E5' },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cancelButton: { borderWidth: 1 },
    cancelButtonText: { fontSize: 16, fontWeight: '500' },
    saveButton: {},
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center' },
    input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    inputSuffix: { position: 'absolute', right: 12 },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 16 },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
    optionText: { fontSize: 13, fontWeight: '500' },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    userFoundBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, marginBottom: 16 },
    userFoundText: { fontSize: 13, fontWeight: '500' },
});
