import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export function Button({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    icon,
    fullWidth = false,
    disabled,
    style,
    ...props
}: ButtonProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const getButtonStyle = (): ViewStyle => {
        const base: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            gap: 8,
        };

        // Size
        switch (size) {
            case 'small':
                base.paddingVertical = 8;
                base.paddingHorizontal = 16;
                break;
            case 'large':
                base.paddingVertical = 18;
                base.paddingHorizontal = 32;
                break;
            default:
                base.paddingVertical = 14;
                base.paddingHorizontal = 24;
        }

        // Variant
        switch (variant) {
            case 'secondary':
                base.backgroundColor = colors.surfaceVariant;
                break;
            case 'outline':
                base.backgroundColor = 'transparent';
                base.borderWidth = 1.5;
                base.borderColor = colors.primary;
                break;
            case 'ghost':
                base.backgroundColor = 'transparent';
                break;
            default:
                base.backgroundColor = colors.primary;
        }

        if (disabled || loading) {
            base.opacity = 0.6;
        }

        if (fullWidth) {
            base.width = '100%';
        }

        return base;
    };

    const getTextStyle = (): TextStyle => {
        const base: TextStyle = {
            fontWeight: '600',
        };

        // Size
        switch (size) {
            case 'small':
                base.fontSize = 14;
                break;
            case 'large':
                base.fontSize = 18;
                break;
            default:
                base.fontSize = 16;
        }

        // Variant
        switch (variant) {
            case 'secondary':
                base.color = colors.text;
                break;
            case 'outline':
            case 'ghost':
                base.color = colors.primary;
                break;
            default:
                base.color = colors.textInverse;
        }

        return base;
    };

    return (
        <TouchableOpacity
            style={[getButtonStyle(), style as ViewStyle]}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? colors.textInverse : colors.primary}
                    size="small"
                />
            ) : (
                <>
                    {icon}
                    <Text style={getTextStyle()}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}
