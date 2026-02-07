import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { campaignService, Campaign } from '@/services/campaignService';
import { isAdmin } from '@/utils/permissions';

export default function CampaignsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { user } = useAuth();

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const canCreate = isAdmin(user?.roleCode || '');

    const fetchCampaigns = useCallback(async () => {
        try {
            const data = await campaignService.getPublic();
            setCampaigns(data);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCampaigns();
    };

    const getProgress = (item: Campaign) => {
        if (!item.TargetAmount || item.TargetAmount === 0) return 0;
        return Math.min((item.CollectedAmount || 0) / item.TargetAmount * 100, 100);
    };

    const getDaysLeft = (endDate?: string) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    const renderCampaign = ({ item }: { item: Campaign }) => {
        const progress = getProgress(item);
        const daysLeft = getDaysLeft(item.EndDate);
        const isActive = item.Status === 'Active';

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/campaign/${item.CampaignId}`)}
                activeOpacity={0.7}
            >
                {/* Campaign Type Badge */}
                <View style={styles.cardHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: colors.primaryLight + '30' }]}>
                        <Ionicons name="heart" size={12} color={colors.primary} />
                        <Text style={[styles.typeText, { color: colors.primary }]}>
                            {item.CampaignType || 'Fundraising'}
                        </Text>
                    </View>
                    {daysLeft !== null && daysLeft > 0 && (
                        <View style={[styles.daysBadge, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="time-outline" size={12} color={colors.warning} />
                            <Text style={[styles.daysText, { color: colors.warning }]}>
                                {daysLeft} days left
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={[styles.campaignName, { color: colors.text }]} numberOfLines={2}>
                    {item.CampaignName}
                </Text>

                {item.Description && (
                    <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.Description}
                    </Text>
                )}

                {/* Progress Section */}
                <View style={styles.progressSection}>
                    <View style={styles.amountRow}>
                        <Text style={[styles.collectedAmount, { color: colors.text }]}>
                            ₹{((item.CollectedAmount || 0) / 1000).toFixed(1)}K
                        </Text>
                        <Text style={[styles.targetAmount, { color: colors.textMuted }]}>
                            of ₹{((item.TargetAmount || 0) / 1000).toFixed(0)}K goal
                        </Text>
                    </View>

                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${progress}%`,
                                    backgroundColor: progress >= 100 ? colors.success : colors.primary
                                }
                            ]}
                        />
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.statText, { color: colors.textMuted }]}>
                                {item.DonorCount || 0} donors
                            </Text>
                        </View>
                        <Text style={[styles.progressPercent, { color: colors.primary }]}>
                            {progress.toFixed(0)}% funded
                        </Text>
                    </View>
                </View>

                {/* Donate Button */}
                {isActive && item.RazorpayEnabled && (
                    <TouchableOpacity
                        style={[styles.donateButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push(`/campaign/${item.CampaignId}/donate`)}
                    >
                        <Ionicons name="heart" size={18} color="#FFFFFF" />
                        <Text style={styles.donateText}>Donate Now</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Stats */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Active Campaigns
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        Support causes that matter
                    </Text>
                </View>
            </View>

            {/* Campaign List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={campaigns}
                    keyExtractor={(item) => item.CampaignId.toString()}
                    renderItem={renderCampaign}
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
                            <Ionicons name="megaphone-outline" size={64} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No active campaigns
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FAB for creating campaign (admin only) */}
            {canCreate && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/campaign/create')}
                >
                    <Ionicons name="add" size={28} color="#FFFFFF" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 16 },
    headerContent: { gap: 4 },
    headerTitle: { fontSize: 24, fontWeight: '700' },
    headerSubtitle: { fontSize: 14 },
    listContent: { padding: 16, gap: 16 },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    typeText: { fontSize: 11, fontWeight: '600' },
    daysBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    daysText: { fontSize: 11, fontWeight: '500' },
    campaignName: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
    description: { fontSize: 14, lineHeight: 20 },
    progressSection: { gap: 8 },
    amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    collectedAmount: { fontSize: 20, fontWeight: '700' },
    targetAmount: { fontSize: 13 },
    progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 12 },
    progressPercent: { fontSize: 12, fontWeight: '600' },
    donateButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 8,
        marginTop: 4,
    },
    donateText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
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
