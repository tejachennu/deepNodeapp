import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { campaignService, Campaign } from '@/services/campaignService';
import { isAdmin } from '@/utils/permissions';

const { width } = Dimensions.get('window');

export default function CampaignDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { user } = useAuth();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);

    const canEdit = isAdmin(user?.roleCode || '');

    useEffect(() => {
        fetchCampaign();
    }, [id]);

    const fetchCampaign = async () => {
        try {
            const data = await campaignService.getById(Number(id));
            setCampaign(data);
        } catch (error) {
            console.error('Failed to fetch campaign:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!campaign) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>Campaign not found</Text>
            </View>
        );
    }

    const progress = campaign.TargetAmount > 0
        ? Math.min((campaign.CollectedAmount || 0) / campaign.TargetAmount * 100, 100)
        : 0;

    const getDaysLeft = () => {
        if (!campaign.EndDate) return null;
        const end = new Date(campaign.EndDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    const daysLeft = getDaysLeft();
    const isActive = campaign.Status === 'Active';

    return (
        <>
            <Stack.Screen options={{ title: campaign.CampaignCode }} />
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Hero Image */}
                {campaign.ImageUrls && campaign.ImageUrls.length > 0 && (
                    <Image
                        source={{ uri: campaign.ImageUrls[0] }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                )}

                {/* Campaign Header */}
                <View style={styles.header}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.typeBadge, { backgroundColor: colors.primaryLight + '30' }]}>
                            <Ionicons name="heart" size={14} color={colors.primary} />
                            <Text style={[styles.typeText, { color: colors.primary }]}>
                                {campaign.CampaignType || 'Fundraising'}
                            </Text>
                        </View>
                        {daysLeft !== null && daysLeft > 0 && (
                            <View style={[styles.daysBadge, { backgroundColor: colors.warning + '20' }]}>
                                <Ionicons name="time-outline" size={14} color={colors.warning} />
                                <Text style={[styles.daysText, { color: colors.warning }]}>
                                    {daysLeft} days left
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>{campaign.CampaignName}</Text>

                    {campaign.ProjectName && (
                        <View style={styles.projectRow}>
                            <Ionicons name="folder-outline" size={16} color={colors.textMuted} />
                            <Text style={[styles.projectName, { color: colors.textMuted }]}>
                                {campaign.ProjectName}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Progress Card */}
                <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                ₹{((campaign.CollectedAmount || 0) / 1000).toFixed(1)}K
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Raised</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {campaign.DonorCount || 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Donors</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>
                                {progress.toFixed(0)}%
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Funded</Text>
                        </View>
                    </View>

                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${progress}%`,
                                    backgroundColor: progress >= 100 ? colors.success : colors.primary,
                                }
                            ]}
                        />
                    </View>

                    <View style={styles.goalRow}>
                        <Text style={[styles.goalText, { color: colors.textSecondary }]}>
                            Goal: ₹{(campaign.TargetAmount / 1000).toFixed(0)}K
                        </Text>
                    </View>
                </View>

                {/* Description */}
                {campaign.Description && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>About this Campaign</Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {campaign.Description}
                        </Text>
                    </View>
                )}

                {/* Donate Button */}
                {isActive && campaign.RazorpayEnabled && (
                    <TouchableOpacity
                        style={[styles.donateButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push(`/campaign/${id}/donate`)}
                    >
                        <Ionicons name="heart" size={22} color="#FFFFFF" />
                        <Text style={styles.donateButtonText}>Donate Now</Text>
                    </TouchableOpacity>
                )}

                {!isActive && (
                    <View style={[styles.closedBanner, { backgroundColor: colors.surfaceVariant }]}>
                        <Ionicons name="information-circle" size={20} color={colors.textMuted} />
                        <Text style={[styles.closedText, { color: colors.textMuted }]}>
                            This campaign is no longer accepting donations
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit FAB (admin only) */}
            {canEdit && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.primary }]}
                    onPress={() => router.push(`/campaign/${id}/edit`)}
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
    heroImage: { width: '100%', height: 220 },
    header: { padding: 16, gap: 10 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, gap: 6 },
    typeText: { fontSize: 13, fontWeight: '600' },
    daysBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, gap: 4 },
    daysText: { fontSize: 12, fontWeight: '500' },
    title: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
    projectRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    projectName: { fontSize: 14 },
    progressCard: { margin: 16, marginTop: 0, padding: 16, borderRadius: 14, borderWidth: 1, gap: 14 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 22, fontWeight: '700' },
    statLabel: { fontSize: 12 },
    statDivider: { width: 1, height: 40 },
    progressBar: { height: 10, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 5 },
    goalRow: { alignItems: 'center' },
    goalText: { fontSize: 13 },
    section: { paddingHorizontal: 16, marginBottom: 16, gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '600' },
    description: { fontSize: 15, lineHeight: 24 },
    donateButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, padding: 16, borderRadius: 14, gap: 10 },
    donateButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    closedBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 14, borderRadius: 10, gap: 10 },
    closedText: { fontSize: 13, flex: 1 },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
});
