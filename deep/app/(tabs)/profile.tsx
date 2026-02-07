import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Badge, Card } from '@/components/ui';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    const menuItems = [
        { icon: 'person-outline', label: 'Edit Profile', onPress: () => { } },
        { icon: 'lock-closed-outline', label: 'Change Password', onPress: () => { } },
        { icon: 'notifications-outline', label: 'Notifications', onPress: () => { } },
        { icon: 'shield-checkmark-outline', label: 'Privacy & Security', onPress: () => { } },
        { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => { } },
        { icon: 'information-circle-outline', label: 'About', onPress: () => { } },
    ];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Profile Header */}
            <View style={styles.header}>
                <Avatar name={user?.fullName || 'User'} size="xlarge" />
                <Text style={[styles.name, { color: colors.text }]}>
                    {user?.fullName}
                </Text>
                <Text style={[styles.email, { color: colors.textSecondary }]}>
                    {user?.email}
                </Text>
                <Badge
                    text={user?.role || 'User'}
                    variant="role"
                    roleCode={user?.roleCode}
                    style={{ marginTop: 12 }}
                />
            </View>

            {/* User Info Card */}
            <Card variant="elevated" style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="call-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Mobile</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                            {user?.mobileNumber || 'Not provided'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: colors.success + '15' }]}>
                        <Ionicons name="business-outline" size={20} color={colors.success} />
                    </View>
                    <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Organization</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                            {user?.organizationName || 'Not assigned'}
                        </Text>
                    </View>
                </View>
            </Card>

            {/* Menu Items */}
            <View style={styles.menuSection}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.menuItem,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                        onPress={item.onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: colors.surfaceVariant }]}>
                            <Ionicons name={item.icon as any} size={20} color={colors.text} />
                        </View>
                        <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: colors.error + '10' }]}
                onPress={handleLogout}
                activeOpacity={0.7}
            >
                <Ionicons name="log-out-outline" size={22} color={colors.error} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
            </TouchableOpacity>

            {/* Version */}
            <Text style={[styles.version, { color: colors.textMuted }]}>
                Version 1.0.0
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 16,
    },
    email: {
        fontSize: 15,
        marginTop: 4,
    },
    infoCard: {
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: {
        marginLeft: 14,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 14,
    },
    menuSection: {
        gap: 8,
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 10,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
    version: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
    },
});
