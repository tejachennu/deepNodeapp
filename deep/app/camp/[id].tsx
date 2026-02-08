import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { projectService, Camp } from '@/services/projectService';
import { isAdmin } from '@/utils/permissions';
import * as ImagePicker from 'expo-image-picker';
import api from '@/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

interface MediaItem {
    MediaId: number;
    MediaUrl: string;
    MediaType: 'image' | 'video';
    Caption?: string;
    Description?: string;
    DisplayOrder?: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    Planned: { bg: '#FEF3C7', text: '#92400E' },
    Ongoing: { bg: '#DCFCE7', text: '#166534' },
    Completed: { bg: '#DBEAFE', text: '#1E40AF' },
    Cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function CampDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user } = useAuth();

    const [camp, setCamp] = useState<Camp | null>(null);
    const [images, setImages] = useState<MediaItem[]>([]);
    const [videos, setVideos] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'images' | 'videos'>('details');

    // Modal states
    const [editCampModal, setEditCampModal] = useState(false);
    const [uploadMediaModal, setUploadMediaModal] = useState(false);
    const [editMediaModal, setEditMediaModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Date picker states
    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);

    // Form states
    const [campForm, setCampForm] = useState({
        campName: '',
        campDescription: '',
        campAddress: '',
        campCity: '',
        campState: '',
        campCountry: 'India',
        peopleExpected: '',
        peopleAttended: '',
        campStartDate: new Date(),
        campEndDate: new Date(),
        campStatus: 'Planned',
    });

    const [mediaForm, setMediaForm] = useState({
        caption: '',
        description: '',
        mediaType: 'image' as 'image' | 'video',
    });

    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<any[]>([]);

    const canEdit = isAdmin(user?.roleCode || '');

    const fetchData = async () => {
        try {
            const data = await projectService.getCampById(Number(id));
            setCamp(data.camp);
            setImages(data.images || []);
            setVideos(data.videos || []);

            if (data.camp) {
                setCampForm({
                    campName: data.camp.CampName || '',
                    campDescription: data.camp.CampDescription || '',
                    campAddress: data.camp.CampAddress || '',
                    campCity: data.camp.CampCity || '',
                    campState: data.camp.CampState || '',
                    campCountry: data.camp.CampCountry || 'India',
                    peopleExpected: data.camp.PeopleExpected?.toString() || '',
                    peopleAttended: data.camp.PeopleAttended?.toString() || '',
                    campStartDate: data.camp.CampStartDate ? new Date(data.camp.CampStartDate) : new Date(),
                    campEndDate: data.camp.CampEndDate ? new Date(data.camp.CampEndDate) : new Date(),
                    campStatus: data.camp.CampStatus || 'Planned',
                });
            }
        } catch (error) {
            console.error('Failed to fetch camp:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Save camp
    const handleSaveCamp = async () => {
        if (!campForm.campName) {
            Alert.alert('Error', 'Camp name is required');
            return;
        }
        setSaving(true);
        try {
            await projectService.updateCamp(Number(id), {
                CampName: campForm.campName,
                CampDescription: campForm.campDescription,
                CampAddress: campForm.campAddress,
                CampCity: campForm.campCity,
                CampState: campForm.campState,
                CampCountry: campForm.campCountry,
                PeopleExpected: campForm.peopleExpected ? parseInt(campForm.peopleExpected) : undefined,
                PeopleAttended: campForm.peopleAttended ? parseInt(campForm.peopleAttended) : undefined,
                CampStartDate: campForm.campStartDate.toISOString().split('T')[0],
                CampEndDate: campForm.campEndDate.toISOString().split('T')[0],
                CampStatus: campForm.campStatus,
            });
            Alert.alert('Success', 'Camp updated successfully');
            setEditCampModal(false);
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to update camp');
        } finally {
            setSaving(false);
        }
    };

    // Pick images
    const pickImages = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow access to photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setSelectedAssets(result.assets);
            setMediaForm({ ...mediaForm, mediaType: 'image' });
            setUploadMediaModal(true);
        }
    };

    // Pick videos
    const pickVideos = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow access to videos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setSelectedAssets(result.assets);
            setMediaForm({ ...mediaForm, mediaType: 'video' });
            setUploadMediaModal(true);
        }
    };

    // Upload media
    const handleUploadMedia = async () => {
        if (selectedAssets.length === 0) return;

        setUploading(true);
        try {
            const formData = new FormData();
            selectedAssets.forEach((asset, index) => {
                const filename = asset.uri.split('/').pop() || `file_${index}`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `${mediaForm.mediaType}/${match[1]}` : `${mediaForm.mediaType}/jpeg`;

                formData.append(mediaForm.mediaType === 'image' ? 'images' : 'videos', {
                    uri: asset.uri,
                    name: filename,
                    type,
                } as any);
            });

            if (mediaForm.caption) {
                formData.append('caption', mediaForm.caption);
            }
            if (mediaForm.description) {
                formData.append('description', mediaForm.description);
            }

            const endpoint = mediaForm.mediaType === 'image'
                ? `/camps/${id}/images`
                : `/camps/${id}/videos`;

            await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert('Success', `${mediaForm.mediaType === 'image' ? 'Images' : 'Videos'} uploaded successfully`);
            setUploadMediaModal(false);
            setSelectedAssets([]);
            setMediaForm({ caption: '', description: '', mediaType: 'image' });
            fetchData();
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload media');
        } finally {
            setUploading(false);
        }
    };

    // Edit media
    const handleEditMedia = async () => {
        if (!selectedMedia) return;

        setSaving(true);
        try {
            await api.put(`/camps/${id}/media/${selectedMedia.MediaId}`, {
                caption: mediaForm.caption,
                description: mediaForm.description,
            });
            Alert.alert('Success', 'Media updated successfully');
            setEditMediaModal(false);
            setSelectedMedia(null);
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to update media');
        } finally {
            setSaving(false);
        }
    };

    // Delete media
    const handleDeleteMedia = (media: MediaItem) => {
        Alert.alert('Delete Media', 'Are you sure you want to delete this?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/camps/${id}/media/${media.MediaId}`);
                        Alert.alert('Success', 'Media deleted');
                        fetchData();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete media');
                    }
                },
            },
        ]);
    };

    const openEditMedia = (media: MediaItem) => {
        setSelectedMedia(media);
        setMediaForm({
            caption: media.Caption || '',
            description: media.Description || '',
            mediaType: media.MediaType,
        });
        setEditMediaModal(true);
    };

    const formatDate = (date: Date) => date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!camp) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>Camp not found</Text>
            </View>
        );
    }

    const statusStyle = STATUS_COLORS[camp.CampStatus] || STATUS_COLORS['Planned'];

    const renderInput = (
        label: string,
        value: string,
        onChangeText: (text: string) => void,
        placeholder?: string,
        options?: { multiline?: boolean; keyboardType?: 'default' | 'numeric' }
    ) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    options?.multiline && styles.textArea,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                multiline={options?.multiline}
                keyboardType={options?.keyboardType}
            />
        </View>
    );

    const renderDateInput = (label: string, date: Date, onPress: () => void) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
            <TouchableOpacity
                style={[styles.input, styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={onPress}
            >
                <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(date)}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
        </View>
    );

    const renderOptions = (label: string, options: string[], selected: string, onSelect: (v: string) => void) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
            <View style={styles.optionsRow}>
                {options.map((opt) => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.optionChip, { borderColor: colors.border }, selected === opt && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => onSelect(opt)}
                    >
                        <Text style={[styles.optionText, { color: selected === opt ? '#FFFFFF' : colors.text }]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderMediaItem = ({ item }: { item: MediaItem }) => (
        <View style={[styles.mediaCard, { backgroundColor: colors.card }]}>
            <Image source={{ uri: item.MediaUrl }} style={styles.mediaImage} resizeMode="cover" />
            {item.Caption && <Text style={[styles.mediaCaption, { color: colors.text }]}>{item.Caption}</Text>}
            {item.Description && <Text style={[styles.mediaDescription, { color: colors.textSecondary }]} numberOfLines={2}>{item.Description}</Text>}
            {canEdit && (
                <View style={styles.mediaActions}>
                    <TouchableOpacity style={[styles.mediaActionBtn, { backgroundColor: colors.primary + '20' }]} onPress={() => openEditMedia(item)}>
                        <Ionicons name="pencil" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.mediaActionBtn, { backgroundColor: colors.error + '20' }]} onPress={() => handleDeleteMedia(item)}>
                        <Ionicons name="trash" size={16} color={colors.error} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <>
            <Stack.Screen options={{ title: camp.CampName }} />
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{camp.CampStatus}</Text>
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>{camp.CampName}</Text>
                    {camp.CampCity && (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                            <Text style={[styles.location, { color: colors.textMuted }]}>{camp.CampCity}, {camp.CampState}</Text>
                        </View>
                    )}
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="people" size={24} color={colors.primary} />
                        <Text style={[styles.statValue, { color: colors.text }]}>{camp.PeopleAttended || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Attended</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="people-outline" size={24} color={colors.success} />
                        <Text style={[styles.statValue, { color: colors.text }]}>{camp.PeopleExpected || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Expected</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="images" size={24} color={colors.warning} />
                        <Text style={[styles.statValue, { color: colors.text }]}>{images.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Photos</Text>
                    </View>
                </View>

                {/* Tab Bar */}
                <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
                    {[
                        { key: 'details', label: 'Details', icon: 'information-circle-outline' },
                        { key: 'images', label: 'Images', icon: 'images-outline' },
                        { key: 'videos', label: 'Videos', icon: 'videocam-outline' },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab(tab.key as any)}
                        >
                            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? colors.primary : colors.textMuted} />
                            <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.primary : colors.textMuted }]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {activeTab === 'details' && (
                        <View style={styles.detailsContent}>
                            {camp.CampDescription && (
                                <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Description</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{camp.CampDescription}</Text>
                                </View>
                            )}
                            {camp.CampAddress && (
                                <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Address</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{camp.CampAddress}</Text>
                                </View>
                            )}
                            {camp.CampStartDate && (
                                <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Date</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>
                                        {new Date(camp.CampStartDate).toLocaleDateString()}
                                        {camp.CampEndDate && ` - ${new Date(camp.CampEndDate).toLocaleDateString()}`}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'images' && (
                        <View style={styles.mediaContent}>
                            {canEdit && (
                                <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.primary }]} onPress={pickImages}>
                                    <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.uploadBtnText}>Upload Images</Text>
                                </TouchableOpacity>
                            )}
                            {images.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="images-outline" size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No images yet</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={images}
                                    renderItem={renderMediaItem}
                                    keyExtractor={(item) => item.MediaId.toString()}
                                    numColumns={2}
                                    columnWrapperStyle={styles.mediaRow}
                                    scrollEnabled={false}
                                />
                            )}
                        </View>
                    )}

                    {activeTab === 'videos' && (
                        <View style={styles.mediaContent}>
                            {canEdit && (
                                <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.primary }]} onPress={pickVideos}>
                                    <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.uploadBtnText}>Upload Videos</Text>
                                </TouchableOpacity>
                            )}
                            {videos.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="videocam-outline" size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No videos yet</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={videos}
                                    renderItem={renderMediaItem}
                                    keyExtractor={(item) => item.MediaId.toString()}
                                    numColumns={2}
                                    columnWrapperStyle={styles.mediaRow}
                                    scrollEnabled={false}
                                />
                            )}
                        </View>
                    )}
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Edit Camp FAB */}
            {canEdit && (
                <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setEditCampModal(true)}>
                    <Ionicons name="pencil" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {/* Edit Camp Modal */}
            <Modal visible={editCampModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Camp</Text>
                            <TouchableOpacity onPress={() => setEditCampModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {renderInput('Camp Name *', campForm.campName, (v) => setCampForm({ ...campForm, campName: v }), 'Enter camp name')}
                            {renderInput('Description', campForm.campDescription, (v) => setCampForm({ ...campForm, campDescription: v }), 'Enter description', { multiline: true })}
                            {renderInput('Address', campForm.campAddress, (v) => setCampForm({ ...campForm, campAddress: v }), 'Enter address')}
                            <View style={styles.row}>
                                <View style={styles.halfInput}>{renderInput('City', campForm.campCity, (v) => setCampForm({ ...campForm, campCity: v }), 'City')}</View>
                                <View style={styles.halfInput}>{renderInput('State', campForm.campState, (v) => setCampForm({ ...campForm, campState: v }), 'State')}</View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>{renderInput('Expected', campForm.peopleExpected, (v) => setCampForm({ ...campForm, peopleExpected: v }), '0', { keyboardType: 'numeric' })}</View>
                                <View style={styles.halfInput}>{renderInput('Attended', campForm.peopleAttended, (v) => setCampForm({ ...campForm, peopleAttended: v }), '0', { keyboardType: 'numeric' })}</View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>{renderDateInput('Start Date', campForm.campStartDate, () => setShowStartDate(true))}</View>
                                <View style={styles.halfInput}>{renderDateInput('End Date', campForm.campEndDate, () => setShowEndDate(true))}</View>
                            </View>
                            {renderOptions('Status', ['Planned', 'Ongoing', 'Completed', 'Cancelled'], campForm.campStatus, (v) => setCampForm({ ...campForm, campStatus: v }))}
                            {showStartDate && <DateTimePicker value={campForm.campStartDate} mode="date" onChange={(e, date) => { setShowStartDate(false); date && setCampForm({ ...campForm, campStartDate: date }); }} />}
                            {showEndDate && <DateTimePicker value={campForm.campEndDate} mode="date" onChange={(e, date) => { setShowEndDate(false); date && setCampForm({ ...campForm, campEndDate: date }); }} />}
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]} onPress={() => setEditCampModal(false)}>
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveCamp} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Upload Media Modal */}
            <Modal visible={uploadMediaModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Upload {mediaForm.mediaType === 'image' ? 'Images' : 'Videos'}</Text>
                            <TouchableOpacity onPress={() => { setUploadMediaModal(false); setSelectedAssets([]); }}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <View style={styles.selectedPreview}>
                                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>{selectedAssets.length} {mediaForm.mediaType}(s) selected</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {selectedAssets.map((asset, idx) => (
                                        <Image key={idx} source={{ uri: asset.uri }} style={styles.previewThumb} />
                                    ))}
                                </ScrollView>
                            </View>
                            {renderInput('Caption', mediaForm.caption, (v) => setMediaForm({ ...mediaForm, caption: v }), 'Enter caption for all')}
                            {renderInput('Description', mediaForm.description, (v) => setMediaForm({ ...mediaForm, description: v }), 'Enter description', { multiline: true })}
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]} onPress={() => { setUploadMediaModal(false); setSelectedAssets([]); }}>
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleUploadMedia} disabled={uploading}>
                                {uploading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Upload</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Edit Media Modal */}
            <Modal visible={editMediaModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Media</Text>
                            <TouchableOpacity onPress={() => { setEditMediaModal(false); setSelectedMedia(null); }}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {selectedMedia && <Image source={{ uri: selectedMedia.MediaUrl }} style={styles.editPreview} resizeMode="cover" />}
                            {renderInput('Caption', mediaForm.caption, (v) => setMediaForm({ ...mediaForm, caption: v }), 'Enter caption')}
                            {renderInput('Description', mediaForm.description, (v) => setMediaForm({ ...mediaForm, description: v }), 'Enter description', { multiline: true })}
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]} onPress={() => { setEditMediaModal(false); setSelectedMedia(null); }}>
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleEditMedia} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    errorText: { fontSize: 16, fontWeight: '500' },
    header: { padding: 16, gap: 8 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    statusText: { fontSize: 12, fontWeight: '600' },
    title: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    location: { fontSize: 14 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
    statCard: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 4 },
    statValue: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 12 },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8, marginTop: 16 },
    tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 6 },
    tabText: { fontSize: 14, fontWeight: '500' },
    tabContent: { padding: 16 },
    detailsContent: { gap: 12 },
    detailCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
    detailLabel: { fontSize: 12, marginBottom: 4 },
    detailValue: { fontSize: 15, lineHeight: 22 },
    mediaContent: { gap: 16 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
    uploadBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    mediaRow: { gap: 12 },
    mediaCard: { width: (width - 44) / 2, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
    mediaImage: { width: '100%', height: 120 },
    mediaCaption: { fontSize: 13, fontWeight: '600', padding: 8, paddingBottom: 0 },
    mediaDescription: { fontSize: 12, padding: 8, paddingTop: 4 },
    mediaActions: { flexDirection: 'row', gap: 8, padding: 8, paddingTop: 0 },
    mediaActionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 14 },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalBody: { padding: 16 },
    modalFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#E5E5E5' },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cancelButton: { borderWidth: 1 },
    cancelButtonText: { fontSize: 16, fontWeight: '500' },
    saveButton: {},
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 16 },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
    optionText: { fontSize: 13, fontWeight: '500' },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    selectedPreview: { marginBottom: 16 },
    previewLabel: { fontSize: 14, marginBottom: 8 },
    previewThumb: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
    editPreview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
});
