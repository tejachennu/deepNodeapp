import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, RoleColors } from '@/constants/theme';

interface BadgeProps {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'role';
    roleCode?: string;
    size?: 'small' | 'medium';
    style?: ViewStyle;
}

export function Badge({
    text,
    variant = 'default',
    roleCode,
    size = 'medium',
    style,
}: BadgeProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const getColors = () => {
        if (variant === 'role' && roleCode && RoleColors[roleCode]) {
            return RoleColors[roleCode];
        }

        switch (variant) {
            case 'success':
                return { bg: colors.success + '20', text: colors.success };
            case 'warning':
                return { bg: colors.warning + '20', text: colors.warning };
            case 'error':
                return { bg: colors.error + '20', text: colors.error };
            default:
                return { bg: colors.surfaceVariant, text: colors.textSecondary };
        }
    };

    const badgeColors = getColors();
    const isSmall = size === 'small';

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: badgeColors.bg,
                    paddingVertical: isSmall ? 3 : 5,
                    paddingHorizontal: isSmall ? 8 : 12,
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        color: badgeColors.text,
                        fontSize: isSmall ? 11 : 12,
                    },
                ]}
            >
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
