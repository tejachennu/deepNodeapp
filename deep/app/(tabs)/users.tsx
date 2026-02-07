import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, RoleColors } from '@/constants/theme';
import { Avatar, Badge, Card } from '@/components/ui';
import { userService } from '@/services/data';

interface User {
    userId: number;
    fullName: string;
    email: string;
    mobileNumber?: string;
    status: 'Active' | 'Inactive' | 'Blocked';
    roleName: string;
    roleCode: string;
    organizationName?: string;
}

export default function UsersScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        try {
            const response = await userService.getAll({ search });
            setUsers(response.data?.users || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!loading) fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'error' => {
        switch (status) {
            case 'Active':
                return 'success';
            case 'Inactive':
                return 'warning';
            case 'Blocked':
                return 'error';
            default:
                return 'warning';
        }
    };

    const renderUserCard = ({ item }: { item: User }) => (
        <TouchableOpacity activeOpacity={0.7}>
            <Card style={styles.userCard}>
                <View style={styles.cardContent}>
                    <Avatar name={item.fullName} size="medium" />
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                            {item.fullName}
                        </Text>
                        <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.email}
                        </Text>
                        <View style={styles.badges}>
                            <Badge
                                text={item.roleName}
                                variant="role"
                                roleCode={item.roleCode}
                                size="small"
                            />
                            <Badge
                                text={item.status}
                                variant={getStatusVariant(item.status)}
                                size="small"
                            />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
                {item.organizationName && (
                    <View style={[styles.orgTag, { backgroundColor: colors.surfaceVariant }]}>
                        <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.orgName, { color: colors.textSecondary }]}>
                            {item.organizationName}
                        </Text>
                    </View>
                )}
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
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search users..."
                        placeholderTextColor={colors.placeholder}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            <FlatList
                data={users}
                renderItem={renderUserCard}
                keyExtractor={(item) => item.userId.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No users found
                        </Text>
                    </View>
                }
            />
        </View>
    );
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
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        gap: 10,
    },
    userCard: {
        padding: 14,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 13,
        marginTop: 2,
    },
    badges: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
    },
    moreButton: {
        padding: 8,
    },
    orgTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    orgName: {
        fontSize: 12,
        fontWeight: '500',
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
