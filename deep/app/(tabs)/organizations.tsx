import React, { useEffect, useState } from 'react';
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
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, OrgTypeColors } from '@/constants/theme';
import { Card, Badge } from '@/components/ui';
import { organizationService, Organization } from '@/services/data';

export default function OrganizationsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrganizations = async () => {
        try {
            const response = await organizationService.getAll();
            setOrganizations(response.data?.organizations || []);
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrganizations();
    };

    const renderOrganizationCard = ({ item }: { item: Organization }) => (
        <TouchableOpacity activeOpacity={0.7}>
            <Card variant="elevated" style={styles.orgCard}>
                <View style={styles.cardHeader}>
                    <View
                        style={[
                            styles.orgIcon,
                            { backgroundColor: (OrgTypeColors[item.organizationType] || colors.primary) + '15' },
                        ]}
                    >
                        <Ionicons
                            name={getOrgIcon(item.organizationType)}
                            size={24}
                            color={OrgTypeColors[item.organizationType] || colors.primary}
                        />
                    </View>
                    <View style={styles.orgInfo}>
                        <Text style={[styles.orgName, { color: colors.text }]} numberOfLines={1}>
                            {item.organizationName}
                        </Text>
                        <Text style={[styles.orgType, { color: colors.textSecondary }]}>
                            {item.organizationType}
                        </Text>
                    </View>
                    <Badge
                        text={item.isActive ? 'Active' : 'Inactive'}
                        variant={item.isActive ? 'success' : 'error'}
                        size="small"
                    />
                </View>

                <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

                <View style={styles.cardStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {item.totalBeneficiaries}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Beneficiaries</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {item.city || 'N/A'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>City</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
                            {item.contactPersonName || 'N/A'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Contact</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={organizations}
                renderItem={renderOrganizationCard}
                keyExtractor={(item) => item.organizationId.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="business-outline" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No organizations found
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

function getOrgIcon(type: string): keyof typeof Ionicons.glyphMap {
    switch (type) {
        case 'NGO':
            return 'heart-outline';
        case 'School':
            return 'school-outline';
        case 'Orphanage':
            return 'home-outline';
        case 'Shelter Home':
            return 'bed-outline';
        default:
            return 'business-outline';
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    orgCard: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orgIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orgInfo: {
        flex: 1,
        marginLeft: 12,
    },
    orgName: {
        fontSize: 16,
        fontWeight: '600',
    },
    orgType: {
        fontSize: 13,
        marginTop: 2,
    },
    cardDivider: {
        height: 1,
        marginVertical: 14,
    },
    cardStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 6,
    },
    statLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
});
