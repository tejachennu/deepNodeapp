import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { projectService, Project, Camp, Sponsor } from '@/services/projectService';
import { isAdmin } from '@/utils/permissions';

type TabType = 'overview' | 'camps' | 'sponsors' | 'spends';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    Active: { bg: '#DCFCE7', text: '#166534' },
    Planning: { bg: '#FEF3C7', text: '#92400E' },
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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const canEdit = isAdmin(user?.roleCode || '');

    const fetchData = async () => {
        try {
            const projectData = await projectService.getById(Number(id));
            setProject(projectData);

            const campsData = await projectService.getCamps(Number(id));
            setCamps(campsData.camps || []);

            const sponsorsData = await projectService.getSponsors(Number(id));
            setSponsors(sponsorsData);
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
    ];

    if (canEdit) {
        tabs.push({ key: 'spends', label: 'Spends', icon: 'wallet-outline' });
    }

    return (
        <>
            <Stack.Screen options={{ title: project.ProjectCode }} />
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
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
                        <Text style={[styles.progressPercent, { color: colors.primary }]}>
                            {progress.toFixed(0)}% funded
                        </Text>
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
                                <Text style={[styles.description, { color: colors.textSecondary }]}>
                                    {project.ShortDescription}
                                </Text>
                            )}
                            {project.LongDescription && (
                                <Text style={[styles.longDescription, { color: colors.text }]}>
                                    {project.LongDescription}
                                </Text>
                            )}
                            {project.OrganizationName && (
                                <View style={[styles.infoRow, { borderColor: colors.border }]}>
                                    <Ionicons name="business-outline" size={18} color={colors.textMuted} />
                                    <Text style={[styles.infoText, { color: colors.text }]}>{project.OrganizationName}</Text>
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
                                        {camp.CampAddress && (
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
                                </View>
                            ) : (
                                sponsors.map((sponsor) => (
                                    <View
                                        key={sponsor.ProjectSponsorId}
                                        style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    >
                                        <View style={styles.listCardHeader}>
                                            <Text style={[styles.listCardTitle, { color: colors.text }]}>
                                                {sponsor.SponsorName || sponsor.OrganizationName || 'Anonymous'}
                                            </Text>
                                            <View style={[styles.miniBadge, { backgroundColor: colors.success + '20' }]}>
                                                <Text style={[styles.miniBadgeText, { color: colors.success }]}>
                                                    {sponsor.SponsorshipType}
                                                </Text>
                                            </View>
                                        </View>
                                        {sponsor.Purpose && (
                                            <Text style={[styles.listCardSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                                                {sponsor.Purpose}
                                            </Text>
                                        )}
                                        {sponsor.Amount && sponsor.Amount > 0 && (
                                            <Text style={[styles.sponsorAmount, { color: colors.primary }]}>
                                                ₹{(sponsor.Amount / 1000).toFixed(1)}K
                                            </Text>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Edit FAB (admin only) */}
            {canEdit && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.primary }]}
                    onPress={() => router.push(`/project/${id}/edit`)}
                >
                    <Ionicons name="pencil" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            )}
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
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 14 },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
});
