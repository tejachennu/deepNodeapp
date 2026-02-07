import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Badge, Card } from '@/components/ui';
import { isAdmin, canView } from '@/utils/permissions';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const roleCode = user?.roleCode || '';
  const userIsAdmin = isAdmin(roleCode);

  const quickActions = [
    {
      icon: 'folder-outline',
      label: 'Projects',
      color: '#6366F1',
      onPress: () => router.push('/(tabs)/projects'),
      visible: canView(roleCode, 'projects'),
    },
    {
      icon: 'heart-outline',
      label: 'Campaigns',
      color: '#EC4899',
      onPress: () => router.push('/(tabs)/campaigns'),
      visible: canView(roleCode, 'campaigns'),
    },
    {
      icon: 'business-outline',
      label: 'Organizations',
      color: '#10B981',
      onPress: () => router.push('/(tabs)/organizations'),
      visible: userIsAdmin || roleCode === 'ORG_ADMIN',
    },
    {
      icon: 'people-outline',
      label: 'Users',
      color: '#3B82F6',
      onPress: () => router.push('/(tabs)/users'),
      visible: userIsAdmin,
    },
    {
      icon: 'person-outline',
      label: 'Profile',
      color: '#8B5CF6',
      onPress: () => router.push('/(tabs)/profile'),
      visible: true,
    },
  ].filter((action) => action.visible);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.fullName?.split(' ')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Avatar name={user?.fullName || 'User'} size="medium" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerBadge}>
          <Badge
            text={user?.role || 'User'}
            variant="role"
            roleCode={user?.roleCode}
          />
        </View>
      </View>

      {/* Stats Cards */}
      {userIsAdmin && (
        <View style={styles.statsContainer}>
          <Card variant="elevated" style={{ ...styles.statCard, flex: 1 }}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="business" size={24} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>2</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Organizations</Text>
          </Card>
          <Card variant="elevated" style={{ ...styles.statCard, flex: 1 }}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="people" size={24} color="#3B82F6" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>6</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
          </Card>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* User Info Section */}
      {user?.organizationName && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Organization</Text>
          <Card variant="elevated">
            <View style={styles.orgRow}>
              <View style={[styles.orgIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="business" size={24} color={colors.primary} />
              </View>
              <View style={styles.orgInfo}>
                <Text style={[styles.orgName, { color: colors.text }]}>
                  {user.organizationName}
                </Text>
                <Text style={[styles.orgRole, { color: colors.textSecondary }]}>
                  {user.role}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </View>
      )}

      {/* Recent Activity Placeholder */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        <Card>
          <View style={styles.emptyActivity}>
            <Ionicons name="time-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No recent activity
            </Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  headerBadge: {
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -20,
    gap: 12,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  orgRow: {
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
    marginLeft: 14,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
  },
  orgRole: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});
