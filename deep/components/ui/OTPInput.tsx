import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    NativeSyntheticEvent,
    TextInputKeyPressEventData,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export function OTPInput({ length = 6, value, onChange, error }: OTPInputProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const [focusedIndex, setFocusedIndex] = useState(0);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (text: string, index: number) => {
        const newValue = value.split('');
        newValue[index] = text;
        const result = newValue.join('').slice(0, length);
        onChange(result);

        if (text && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (
        e: NativeSyntheticEvent<TextInputKeyPressEventData>,
        index: number
    ) => {
        if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputsContainer}>
                {Array.from({ length }).map((_, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => { inputRefs.current[index] = ref; }}
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.inputBackground,
                                borderColor:
                                    error
                                        ? colors.error
                                        : focusedIndex === index
                                            ? colors.borderFocus
                                            : colors.inputBorder,
                                color: colors.text,
                            },
                        ]}
                        maxLength={1}
                        keyboardType="number-pad"
                        value={value[index] || ''}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        onFocus={() => setFocusedIndex(index)}
                        selectTextOnFocus
                    />
                ))}
            </View>
            {error && (
                <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    inputsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    input: {
        width: 48,
        height: 56,
        borderWidth: 1.5,
        borderRadius: 12,
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
    },
    error: {
        fontSize: 12,
        marginTop: 12,
    },
});
