// Theme colors for the app
export const Colors = {
  light: {
    // Primary palette
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    primaryLight: '#A5B4FC',

    // Accent colors
    accent: '#EC4899',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    // Neutrals
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceVariant: '#F1F5F9',

    // Text
    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    // Borders
    border: '#E2E8F0',
    borderFocus: '#6366F1',

    // Cards
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',

    // Icons
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#6366F1',

    // Input
    inputBackground: '#F8FAFC',
    inputBorder: '#E2E8F0',
    placeholder: '#94A3B8',

    // Gradients (for use in LinearGradient)
    gradientPrimary: ['#6366F1', '#8B5CF6'],
    gradientAccent: ['#EC4899', '#F472B6'],
    gradientSuccess: ['#10B981', '#34D399'],
  },
  dark: {
    // Primary palette
    primary: '#818CF8',
    primaryDark: '#6366F1',
    primaryLight: '#C7D2FE',

    // Accent colors
    accent: '#F472B6',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',

    // Neutrals
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',

    // Text
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    textInverse: '#0F172A',

    // Borders
    border: '#334155',
    borderFocus: '#818CF8',

    // Cards
    card: '#1E293B',
    cardElevated: '#334155',

    // Icons
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: '#818CF8',

    // Input
    inputBackground: '#1E293B',
    inputBorder: '#334155',
    placeholder: '#64748B',

    // Gradients
    gradientPrimary: ['#6366F1', '#8B5CF6'],
    gradientAccent: ['#EC4899', '#F472B6'],
    gradientSuccess: ['#10B981', '#34D399'],
  },
};

// Role colors for badges
export const RoleColors: Record<string, { bg: string; text: string }> = {
  SUPER_ADMIN: { bg: '#7C3AED', text: '#FFFFFF' },
  ADMIN: { bg: '#2563EB', text: '#FFFFFF' },
  ORG_ADMIN: { bg: '#0891B2', text: '#FFFFFF' },
  STAFF: { bg: '#059669', text: '#FFFFFF' },
  VOLUNTEER: { bg: '#D97706', text: '#FFFFFF' },
  SPONSOR: { bg: '#DC2626', text: '#FFFFFF' },
};

// Organization type colors
export const OrgTypeColors: Record<string, string> = {
  NGO: '#10B981',
  School: '#3B82F6',
  Orphanage: '#EC4899',
  'Shelter Home': '#F59E0B',
};
