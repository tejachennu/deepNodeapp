import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { campaignService, donationService, Campaign } from '@/services/campaignService';

export default function DonateScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [amount, setAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [panNumber, setPanNumber] = useState('');

    const presetAmounts = [500, 1000, 2500, 5000, 10000];

    useEffect(() => {
        fetchCampaign();
    }, [id]);

    const fetchCampaign = async () => {
        try {
            const data = await campaignService.getDonationPage(Number(id));
            setCampaign(data);
        } catch (error) {
            console.error('Failed to fetch campaign:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDonate = async () => {
        if (!amount || !donorName) {
            Alert.alert('Error', 'Please enter amount and your name');
            return;
        }

        if (Number(amount) < 100) {
            Alert.alert('Error', 'Minimum donation amount is ₹100');
            return;
        }

        setSubmitting(true);
        try {
            const orderData = await donationService.createOrder({
                campaignId: Number(id),
                amount: Number(amount),
                donorName,
                phoneNumber: phone,
                emailId: email,
                panNumber: panNumber || undefined,
            });

            // Here you would integrate with Razorpay SDK
            // For now, show success message
            Alert.alert(
                'Order Created',
                `Order ID: ${orderData.orderId}\nAmount: ₹${orderData.amount / 100}\n\nRazorpay payment integration needed.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create order');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!campaign) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>Campaign not found</Text>
            </View>
        );
    }

    const progress = campaign.TargetAmount > 0
        ? Math.min((campaign.CollectedAmount || 0) / campaign.TargetAmount * 100, 100)
        : 0;

    return (
        <>
            <Stack.Screen options={{ title: 'Donate' }} />
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Campaign Info Card */}
                <View style={[styles.campaignCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.campaignName, { color: colors.text }]}>{campaign.CampaignName}</Text>

                    <View style={styles.progressSection}>
                        <View style={styles.amountRow}>
                            <Text style={[styles.collected, { color: colors.text }]}>
                                ₹{((campaign.CollectedAmount || 0) / 1000).toFixed(1)}K
                            </Text>
                            <Text style={[styles.target, { color: colors.textMuted }]}>
                                of ₹{(campaign.TargetAmount / 1000).toFixed(0)}K
                            </Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
                        </View>
                    </View>
                </View>

                {/* Amount Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Amount</Text>

                    <View style={styles.presetAmounts}>
                        {presetAmounts.map((preset) => (
                            <TouchableOpacity
                                key={preset}
                                style={[
                                    styles.presetButton,
                                    {
                                        backgroundColor: amount === String(preset) ? colors.primary : colors.surface,
                                        borderColor: amount === String(preset) ? colors.primary : colors.border,
                                    }
                                ]}
                                onPress={() => setAmount(String(preset))}
                            >
                                <Text style={[
                                    styles.presetText,
                                    { color: amount === String(preset) ? '#FFFFFF' : colors.text }
                                ]}>
                                    ₹{preset}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                        <Text style={[styles.currencySymbol, { color: colors.textMuted }]}>₹</Text>
                        <TextInput
                            style={[styles.amountInput, { color: colors.text }]}
                            placeholder="Enter amount"
                            placeholderTextColor={colors.placeholder}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Donor Details */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Details</Text>

                    <View style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                        <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.textInput, { color: colors.text }]}
                            placeholder="Full Name *"
                            placeholderTextColor={colors.placeholder}
                            value={donorName}
                            onChangeText={setDonorName}
                        />
                    </View>

                    <View style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                        <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.textInput, { color: colors.text }]}
                            placeholder="Email"
                            placeholderTextColor={colors.placeholder}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                        <Ionicons name="call-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.textInput, { color: colors.text }]}
                            placeholder="Phone Number"
                            placeholderTextColor={colors.placeholder}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                        <Ionicons name="card-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.textInput, { color: colors.text }]}
                            placeholder="PAN Number (for 80G receipt)"
                            placeholderTextColor={colors.placeholder}
                            value={panNumber}
                            onChangeText={setPanNumber}
                            autoCapitalize="characters"
                        />
                    </View>
                </View>

                {/* Donate Button */}
                <TouchableOpacity
                    style={[styles.donateButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
                    onPress={handleDonate}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="heart" size={22} color="#FFFFFF" />
                            <Text style={styles.donateButtonText}>
                                Donate {amount ? `₹${amount}` : 'Now'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Info Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                        <Ionicons name="shield-checkmark" size={14} /> Secure payment powered by Razorpay
                    </Text>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16 },
    campaignCard: { margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
    campaignName: { fontSize: 18, fontWeight: '700' },
    progressSection: { gap: 8 },
    amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    collected: { fontSize: 20, fontWeight: '700' },
    target: { fontSize: 14 },
    progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    section: { paddingHorizontal: 16, marginBottom: 24, gap: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    presetAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    presetButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1 },
    presetText: { fontSize: 15, fontWeight: '600' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 54 },
    currencySymbol: { fontSize: 20, fontWeight: '600', marginRight: 8 },
    amountInput: { flex: 1, fontSize: 20, fontWeight: '600' },
    input: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 50, gap: 10 },
    textInput: { flex: 1, fontSize: 15 },
    donateButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, padding: 16, borderRadius: 14, gap: 10 },
    donateButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    footer: { alignItems: 'center', paddingVertical: 24 },
    footerText: { fontSize: 12 },
});
