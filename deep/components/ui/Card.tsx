import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated';
    style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: variant === 'elevated' ? colors.cardElevated : colors.card,
                    borderColor: colors.border,
                },
                variant === 'elevated' && styles.elevated,
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 0,
    },
});
