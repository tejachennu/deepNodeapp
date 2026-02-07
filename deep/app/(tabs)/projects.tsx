import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { projectService, Project } from '@/services/projectService';
import { isAdmin } from '@/utils/permissions';

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    Active: { bg: '#DCFCE7', text: '#166534' },
    Planning: { bg: '#FEF3C7', text: '#92400E' },
    Completed: { bg: '#DBEAFE', text: '#1E40AF' },
    'On Hold': { bg: '#FEE2E2', text: '#991B1B' },
};

export default function ProjectsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { user } = useAuth();

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const canCreate = isAdmin(user?.roleCode || '');

    const fetchProjects = useCallback(async () => {
        try {
            const data = await projectService.getAll({
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProjects();
    };

    const renderProject = ({ item }: { item: Project }) => {
        const statusStyle = STATUS_COLORS[item.Status] || STATUS_COLORS['Active'];
        const progress = item.TargetAmount && item.TargetAmount > 0
            ? Math.min((item.CollectedAmount || 0) / item.TargetAmount * 100, 100)
            : 0;

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/project/${item.ProjectId}`)}
                activeOpacity={0.7}
            >
                {item.BannerImage && (
                    <Image
                        source={{ uri: item.BannerImage }}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />
                )}
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.projectCode, { color: colors.textMuted }]}>
                            {item.ProjectCode}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                {item.Status}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={2}>
                        {item.ProjectName}
                    </Text>

                    {item.ShortDescription && (
                        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.ShortDescription}
                        </Text>
                    )}

                    {item.Location && (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.locationText, { color: colors.textMuted }]}>
                                {item.Location}
                            </Text>
                        </View>
                    )}

                    {item.TargetAmount && item.TargetAmount > 0 && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                                    ₹{((item.CollectedAmount || 0) / 1000).toFixed(0)}K raised
                                </Text>
                                <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                                    of ₹{(item.TargetAmount / 1000).toFixed(0)}K
                                </Text>
                            </View>
                            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progress}%`, backgroundColor: colors.primary }
                                    ]}
                                />
                            </View>
                        </View>
                    )}

                    {item.OrganizationName && (
                        <View style={styles.orgRow}>
                            <Ionicons name="business-outline" size={12} color={colors.textMuted} />
                            <Text style={[styles.orgText, { color: colors.textMuted }]}>
                                {item.OrganizationName}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const statusFilters = ['All', 'Active', 'Planning', 'Completed', 'On Hold'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search projects..."
                        placeholderTextColor={colors.placeholder}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Status Filter Pills */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    data={statusFilters}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                    renderItem={({ item }) => {
                        const isActive = item === 'All' ? !statusFilter : statusFilter === item;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.filterPill,
                                    {
                                        backgroundColor: isActive ? colors.primary : colors.surface,
                                        borderColor: isActive ? colors.primary : colors.border,
                                    }
                                ]}
                                onPress={() => setStatusFilter(item === 'All' ? null : item)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: isActive ? '#FFFFFF' : colors.textSecondary }
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Project List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={projects}
                    keyExtractor={(item) => item.ProjectId.toString()}
                    renderItem={renderProject}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={64} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No projects found
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FAB for creating project (admin only) */}
            {canCreate && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/project/create')}
                >
                    <Ionicons name="add" size={28} color="#FFFFFF" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    searchInput: { flex: 1, fontSize: 16 },
    filterContainer: { paddingBottom: 8 },
    filterList: { paddingHorizontal: 16, gap: 8 },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    filterText: { fontSize: 13, fontWeight: '500' },
    listContent: { padding: 16, gap: 16 },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 12,
    },
    cardImage: { width: '100%', height: 140 },
    cardContent: { padding: 16, gap: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    projectCode: { fontSize: 12, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '600' },
    projectName: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
    description: { fontSize: 14, lineHeight: 20 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 12 },
    progressContainer: { marginTop: 4 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 12, fontWeight: '500' },
    progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    orgRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    orgText: { fontSize: 11 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { marginTop: 12, fontSize: 16 },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});
