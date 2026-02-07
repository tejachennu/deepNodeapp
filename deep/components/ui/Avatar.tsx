import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface AvatarProps {
    name: string;
    size?: 'small' | 'medium' | 'large' | 'xlarge';
    style?: ViewStyle;
}

export function Avatar({ name, size = 'medium', style }: AvatarProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const getSize = () => {
        switch (size) {
            case 'small':
                return { container: 32, font: 12 };
            case 'large':
                return { container: 64, font: 24 };
            case 'xlarge':
                return { container: 96, font: 36 };
            default:
                return { container: 48, font: 18 };
        }
    };

    const dimensions = getSize();

    // Generate a consistent color based on name
    const getColor = (name: string) => {
        const gradients = [
            ['#6366F1', '#8B5CF6'],
            ['#EC4899', '#F472B6'],
            ['#10B981', '#34D399'],
            ['#F59E0B', '#FBBF24'],
            ['#3B82F6', '#60A5FA'],
            ['#EF4444', '#F87171'],
            ['#8B5CF6', '#A78BFA'],
            ['#14B8A6', '#2DD4BF'],
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return gradients[index][0];
    };

    return (
        <View
            style={[
                styles.container,
                {
                    width: dimensions.container,
                    height: dimensions.container,
                    borderRadius: dimensions.container / 2,
                    backgroundColor: getColor(name),
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.initials,
                    {
                        fontSize: dimensions.font,
                        color: '#FFFFFF',
                    },
                ]}
            >
                {getInitials(name)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        fontWeight: '600',
    },
});
