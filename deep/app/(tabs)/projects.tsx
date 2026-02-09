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
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { projectService, Project } from '@/services/projectService';
import { isAdmin } from '@/utils/permissions';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// Status badge colors with gradients
const STATUS_COLORS: Record<string, { bg: string[]; text: string; icon: string }> = {
    Active: { bg: ['#10B981', '#059669'], text: '#FFFFFF', icon: 'pulse' },
    Planning: { bg: ['#F59E0B', '#D97706'], text: '#FFFFFF', icon: 'time' },
    Completed: { bg: ['#3B82F6', '#2563EB'], text: '#FFFFFF', icon: 'checkmark-circle' },
    'On Hold': { bg: ['#EF4444', '#DC2626'], text: '#FFFFFF', icon: 'pause-circle' },
};

// Default thumbnail placeholder
const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop';

export default function ProjectsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { user } = useAuth();
    const isDark = colorScheme === 'dark';

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        } else if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(0)}K`;
        }
        return `₹${amount}`;
    };

    const renderGridCard = ({ item }: { item: Project }) => {
        const statusStyle = STATUS_COLORS[item.Status] || STATUS_COLORS['Active'];
        const progress = item.TargetAmount && item.TargetAmount > 0
            ? Math.min((item.CollectedAmount || 0) / item.TargetAmount * 100, 100)
            : 0;
        const thumbnail = item.BannerImage || item.BannerUrl || DEFAULT_THUMBNAIL;

        return (
            <TouchableOpacity
                style={[styles.gridCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/project/${item.ProjectId}`)}
                activeOpacity={0.9}
            >
                {/* Thumbnail with Gradient Overlay */}
                <View style={styles.thumbnailContainer}>
                    <Image
                        source={{ uri: thumbnail }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.thumbnailGradient}
                    />
                    {/* Status Badge */}
                    <LinearGradient
                        colors={statusStyle.bg as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gridStatusBadge}
                    >
                        <Ionicons name={statusStyle.icon as any} size={10} color="#FFF" />
                        <Text style={styles.gridStatusText}>{item.Status}</Text>
                    </LinearGradient>
                    {/* Progress on thumbnail */}
                    {progress > 0 && (
                        <View style={styles.thumbnailProgress}>
                            <View style={[styles.thumbnailProgressFill, { width: `${progress}%` }]} />
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.gridContent}>
                    <Text style={[styles.gridProjectCode, { color: colors.primary }]}>
                        {item.ProjectCode}
                    </Text>
                    <Text style={[styles.gridProjectName, { color: colors.text }]} numberOfLines={2}>
                        {item.ProjectName}
                    </Text>

                    {item.Location && (
                        <View style={styles.gridLocationRow}>
                            <Ionicons name="location" size={11} color={colors.textMuted} />
                            <Text style={[styles.gridLocationText, { color: colors.textMuted }]} numberOfLines={1}>
                                {item.Location}
                            </Text>
                        </View>
                    )}

                    {item.TargetAmount && item.TargetAmount > 0 && (
                        <View style={styles.gridFundingRow}>
                            <Text style={[styles.gridFundingRaised, { color: colors.success }]}>
                                {formatCurrency(item.CollectedAmount || 0)}
                            </Text>
                            <Text style={[styles.gridFundingTarget, { color: colors.textMuted }]}>
                                / {formatCurrency(item.TargetAmount)}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderListCard = ({ item }: { item: Project }) => {
        const statusStyle = STATUS_COLORS[item.Status] || STATUS_COLORS['Active'];
        const progress = item.TargetAmount && item.TargetAmount > 0
            ? Math.min((item.CollectedAmount || 0) / item.TargetAmount * 100, 100)
            : 0;
        const thumbnail = item.BannerImage || item.BannerUrl || DEFAULT_THUMBNAIL;

        return (
            <TouchableOpacity
                style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/project/${item.ProjectId}`)}
                activeOpacity={0.9}
            >
                {/* Thumbnail */}
                <View style={styles.listThumbnailContainer}>
                    <Image
                        source={{ uri: thumbnail }}
                        style={styles.listThumbnail}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={statusStyle.bg as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.listStatusBadge}
                    >
                        <Ionicons name={statusStyle.icon as any} size={10} color="#FFF" />
                    </LinearGradient>
                </View>

                {/* Content */}
                <View style={styles.listContent}>
                    <View style={styles.listHeader}>
                        <Text style={[styles.listProjectCode, { color: colors.primary }]}>
                            {item.ProjectCode}
                        </Text>
                        <Text style={[styles.listStatus, { color: statusStyle.bg[0] }]}>
                            {item.Status}
                        </Text>
                    </View>

                    <Text style={[styles.listProjectName, { color: colors.text }]} numberOfLines={2}>
                        {item.ProjectName}
                    </Text>

                    {item.Location && (
                        <View style={styles.listLocationRow}>
                            <Ionicons name="location" size={12} color={colors.textMuted} />
                            <Text style={[styles.listLocationText, { color: colors.textMuted }]} numberOfLines={1}>
                                {item.Location}
                            </Text>
                        </View>
                    )}

                    {item.TargetAmount && item.TargetAmount > 0 && (
                        <View style={styles.listProgressContainer}>
                            <View style={styles.listProgressHeader}>
                                <Text style={[styles.listFundingText, { color: colors.success }]}>
                                    {formatCurrency(item.CollectedAmount || 0)}
                                </Text>
                                <Text style={[styles.listFundingTarget, { color: colors.textMuted }]}>
                                    / {formatCurrency(item.TargetAmount)} ({progress.toFixed(0)}%)
                                </Text>
                            </View>
                            <View style={[styles.listProgressBar, { backgroundColor: colors.border }]}>
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.listProgressFill, { width: `${progress}%` }]}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Arrow */}
                <View style={styles.listArrow}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
            </TouchableOpacity>
        );
    };

    const statusFilters = ['All', 'Active', 'Planning', 'Completed', 'On Hold'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header with Search and View Toggle */}
            <View style={[styles.header, { backgroundColor: isDark ? colors.card : colors.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? colors.background : colors.inputBackground }]}>
                    <Ionicons name="search" size={20} color={colors.textMuted} />
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
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[
                            styles.viewToggleBtn,
                            viewMode === 'grid' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setViewMode('grid')}
                    >
                        <Ionicons
                            name="grid"
                            size={18}
                            color={viewMode === 'grid' ? '#FFF' : colors.textMuted}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.viewToggleBtn,
                            viewMode === 'list' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setViewMode('list')}
                    >
                        <Ionicons
                            name="list"
                            size={18}
                            color={viewMode === 'list' ? '#FFF' : colors.textMuted}
                        />
                    </TouchableOpacity>
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
                        const filterColors = STATUS_COLORS[item];
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.filterPill,
                                    isActive && filterColors
                                        ? { backgroundColor: filterColors.bg[0] }
                                        : { backgroundColor: isDark ? colors.card : colors.surface, borderColor: colors.border }
                                ]}
                                onPress={() => setStatusFilter(item === 'All' ? null : item)}
                            >
                                {filterColors && (
                                    <Ionicons
                                        name={filterColors.icon as any}
                                        size={14}
                                        color={isActive ? '#FFF' : filterColors.bg[0]}
                                        style={{ marginRight: 4 }}
                                    />
                                )}
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

            {/* Stats Summary */}
            <View style={[styles.statsRow, { backgroundColor: isDark ? colors.card : colors.surface }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{projects.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>
                        {projects.filter(p => p.Status === 'Active').length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Active</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                        {projects.filter(p => p.Status === 'Completed').length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Done</Text>
                </View>
            </View>

            {/* Project List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading projects...</Text>
                </View>
            ) : (
                <FlatList
                    key={viewMode}
                    data={projects}
                    keyExtractor={(item) => item.ProjectId.toString()}
                    renderItem={viewMode === 'grid' ? renderGridCard : renderListCard}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
                    contentContainerStyle={viewMode === 'grid' ? styles.gridContent : styles.listContentContainer}
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
                            <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="folder-open-outline" size={48} color={colors.primary} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                No Projects Found
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                                {search ? 'Try a different search term' : 'Create a new project to get started'}
                            </Text>
                            {canCreate && !search && (
                                <TouchableOpacity
                                    style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                                    onPress={() => router.push('/project/create')}
                                >
                                    <Ionicons name="add" size={20} color="#FFF" />
                                    <Text style={styles.emptyButtonText}>Create Project</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}

            {/* FAB for creating project (admin only) */}
            {canCreate && projects.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push('/project/create')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark || '#4F46E5']}
                        style={styles.fabGradient}
                    >
                        <Ionicons name="add" size={28} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        height: 46,
        borderRadius: 14,
        gap: 10,
    },
    searchInput: { flex: 1, fontSize: 16 },
    viewToggle: {
        flexDirection: 'row',
        borderRadius: 10,
        overflow: 'hidden',
    },
    viewToggleBtn: {
        padding: 10,
        backgroundColor: 'transparent',
    },
    filterContainer: { paddingBottom: 8 },
    filterList: { paddingHorizontal: 16, gap: 8 },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
        marginRight: 8,
    },
    filterText: { fontSize: 13, fontWeight: '600' },
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 14,
        justifyContent: 'space-around',
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 11, marginTop: 2 },
    statDivider: { width: 1, height: '100%' },
    // Grid styles
    gridContent: { paddingHorizontal: 16, paddingBottom: 100 },
    gridRow: { justifyContent: 'space-between', marginBottom: 16 },
    gridCard: {
        width: CARD_WIDTH,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    thumbnailContainer: {
        height: 110,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbnailGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
    },
    gridStatusBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 3,
    },
    gridStatusText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFF',
        textTransform: 'uppercase',
    },
    thumbnailProgress: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    thumbnailProgressFill: {
        height: '100%',
        backgroundColor: '#10B981',
    },
    gridContent: {
        padding: 12,
        gap: 4,
    },
    gridProjectCode: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    gridProjectName: {
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 18,
        marginTop: 2,
    },
    gridLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 4,
    },
    gridLocationText: {
        fontSize: 11,
        flex: 1,
    },
    gridFundingRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 6,
        gap: 2,
    },
    gridFundingRaised: {
        fontSize: 14,
        fontWeight: '700',
    },
    gridFundingTarget: {
        fontSize: 11,
    },
    // List styles
    listContentContainer: { padding: 16, gap: 12 },
    listCard: {
        flexDirection: 'row',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        padding: 12,
        gap: 12,
        marginBottom: 12,
    },
    listThumbnailContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    listThumbnail: {
        width: '100%',
        height: '100%',
    },
    listStatusBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        flex: 1,
        justifyContent: 'center',
        gap: 2,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listProjectCode: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    listStatus: {
        fontSize: 10,
        fontWeight: '600',
    },
    listProjectName: {
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
    },
    listLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 2,
    },
    listLocationText: {
        fontSize: 11,
        flex: 1,
    },
    listProgressContainer: {
        marginTop: 6,
    },
    listProgressHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    listFundingText: {
        fontSize: 13,
        fontWeight: '700',
    },
    listFundingTarget: {
        fontSize: 11,
        marginLeft: 3,
    },
    listProgressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    listProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    listArrow: {
        justifyContent: 'center',
        paddingLeft: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: { fontSize: 14 },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 24,
    },
    emptyButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        borderRadius: 28,
        elevation: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
