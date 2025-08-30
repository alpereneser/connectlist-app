import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { HapticPatterns } from '../utils/haptics';
import AddToListModal from '../components/AddToListModal';
import WhoAddedModal from '../components/WhoAddedModal';

const { width } = Dimensions.get('window');

const VideoDetailsScreen = ({ route, navigation }) => {
  const { video } = route.params;
  const [videoDetails, setVideoDetails] = useState(video);
  const [loading, setLoading] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showWhoAdded, setShowWhoAdded] = useState(false);

  useEffect(() => {
    if (video && !video.description) {
      fetchVideoDetails();
    }
  }, [video]);

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you would use YouTube API, Vimeo API, etc.
      // For now, we'll enhance the basic video data
      setVideoDetails({
        ...video,
        description:
          video.description ||
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        channel: video.channel || {
          name: 'Channel Name',
          subscribers: '1.2M',
          verified: true,
          avatar: 'https://via.placeholder.com/100x100?text=CH',
        },
        statistics: video.statistics || {
          viewCount: '2,543,891',
          likeCount: '45,231',
          dislikeCount: '1,234',
          commentCount: '8,567',
          favoriteCount: '12,345',
        },
        duration: video.duration || '10:35',
        publishedAt: video.publishedAt || '2023-12-15T10:30:00Z',
        category: video.category || 'Entertainment',
        tags: video.tags || ['entertainment', 'funny', 'viral', 'trending'],
        language: video.language || 'English',
        captions: video.captions || ['English', 'Spanish', 'French'],
        quality: video.quality || ['1080p', '720p', '480p', '360p'],
        platform: video.platform || 'YouTube', // YouTube, Vimeo, TikTok, etc.
        url: video.url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        embed_url:
          video.embed_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        age_restriction: video.age_restriction || null,
        content_rating: video.content_rating || 'General Audiences',
        monetized: video.monetized !== undefined ? video.monetized : true,
        live_stream: video.live_stream || false,
        premiere: video.premiere || false,
        shorts: video.shorts || false,
        related_videos: video.related_videos || [
          {
            id: 1,
            title: 'Related Video 1',
            thumbnail: 'https://via.placeholder.com/320x180?text=Related+1',
            duration: '5:42',
            views: '1.2M',
            channel: 'Related Channel 1',
          },
          {
            id: 2,
            title: 'Related Video 2',
            thumbnail: 'https://via.placeholder.com/320x180?text=Related+2',
            duration: '8:15',
            views: '856K',
            channel: 'Related Channel 2',
          },
          {
            id: 3,
            title: 'Related Video 3',
            thumbnail: 'https://via.placeholder.com/320x180?text=Related+3',
            duration: '12:30',
            views: '2.1M',
            channel: 'Related Channel 3',
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching video details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = () => {
    HapticPatterns.buttonPress();
    setShowAddToList(true);
  };

  const handleWhoAdded = () => {
    HapticPatterns.buttonPress();
    setShowWhoAdded(true);
  };

  const handleOpenVideo = () => {
    HapticPatterns.buttonPress();
    if (videoDetails.url) {
      Linking.openURL(videoDetails.url).catch(() => {
        Alert.alert('Error', 'Could not open video');
      });
    }
  };

  const handleOpenChannel = () => {
    HapticPatterns.buttonPress();
    if (videoDetails.channel?.url) {
      Linking.openURL(videoDetails.channel.url).catch(() => {
        Alert.alert('Error', 'Could not open channel');
      });
    }
  };

  const handleShareVideo = () => {
    HapticPatterns.buttonPress();
    // In a real app, you would implement native sharing
    Alert.alert('Share', 'Share functionality would be implemented here');
  };

  const handleDownloadVideo = () => {
    HapticPatterns.buttonPress();
    // In a real app, you would implement download functionality
    Alert.alert('Download', 'Download functionality would be implemented here');
  };

  const handleRelatedVideoPress = relatedVideo => {
    HapticPatterns.buttonPress();
    navigation.push('VideoDetails', { video: relatedVideo });
  };

  const formatDuration = duration => {
    if (!duration) {return '0:00';}
    // Handle different duration formats
    if (duration.includes(':')) {
      return duration;
    }
    // Convert seconds to MM:SS format
    const totalSeconds = parseInt(duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = num => {
    if (!num) {return '0';}
    if (typeof num === 'string') {return num;}

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = dateString => {
    if (!dateString) {return 'Unknown';}
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getPlatformIcon = platform => {
    switch (platform?.toLowerCase()) {
      case 'youtube':
        return 'play';
      case 'vimeo':
        return 'video';
      case 'tiktok':
        return 'music';
      case 'instagram':
        return 'instagram';
      case 'twitter':
        return 'twitter';
      default:
        return 'play-circle';
    }
  };

  const getPlatformColor = platform => {
    switch (platform?.toLowerCase()) {
      case 'youtube':
        return '#FF0000';
      case 'vimeo':
        return '#1AB7EA';
      case 'tiktok':
        return '#000000';
      case 'instagram':
        return '#E4405F';
      case 'twitter':
        return '#1DA1F2';
      default:
        return Colors.primary;
    }
  };

  const renderRelatedVideo = relatedVideo => (
    <TouchableOpacity
      key={relatedVideo.id}
      style={styles.relatedVideoItem}
      onPress={() => handleRelatedVideoPress(relatedVideo)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: relatedVideo.thumbnail }}
        style={styles.relatedThumbnail}
        resizeMode="cover"
      />
      <View style={styles.relatedDurationBadge}>
        <Text style={styles.relatedDurationText}>{relatedVideo.duration}</Text>
      </View>
      <View style={styles.relatedVideoInfo}>
        <Text style={styles.relatedVideoTitle} numberOfLines={2}>
          {relatedVideo.title}
        </Text>
        <Text style={styles.relatedVideoChannel} numberOfLines={1}>
          {relatedVideo.channel}
        </Text>
        <Text style={styles.relatedVideoViews}>{relatedVideo.views} views</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading video details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Details</Text>
        <TouchableOpacity onPress={handleShareVideo} style={styles.shareButton}>
          <Feather name="share" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{
              uri:
                videoDetails.thumbnail ||
                videoDetails.image ||
                'https://via.placeholder.com/640x360?text=Video+Thumbnail',
            }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />

          {/* Play Button Overlay */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={handleOpenVideo}
            activeOpacity={0.8}
          >
            <Feather name="play" size={32} color={Colors.background} />
          </TouchableOpacity>

          {/* Duration Badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(videoDetails.duration)}
            </Text>
          </View>

          {/* Platform Badge */}
          <View
            style={[
              styles.platformBadge,
              { backgroundColor: getPlatformColor(videoDetails.platform) },
            ]}
          >
            <Feather
              name={getPlatformIcon(videoDetails.platform)}
              size={16}
              color={Colors.background}
            />
            <Text style={styles.platformText}>{videoDetails.platform}</Text>
          </View>

          {/* Special Badges */}
          {videoDetails.live_stream && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}

          {videoDetails.premiere && (
            <View style={styles.premiereBadge}>
              <Text style={styles.premiereText}>PREMIERE</Text>
            </View>
          )}

          {videoDetails.shorts && (
            <View style={styles.shortsBadge}>
              <Text style={styles.shortsText}>SHORTS</Text>
            </View>
          )}
        </View>

        {/* Video Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.videoTitle}>
            {videoDetails.title || videoDetails.name}
          </Text>

          {/* Channel Info */}
          {videoDetails.channel && (
            <TouchableOpacity
              style={styles.channelContainer}
              onPress={handleOpenChannel}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: videoDetails.channel.avatar }}
                style={styles.channelAvatar}
                resizeMode="cover"
              />
              <View style={styles.channelInfo}>
                <View style={styles.channelNameContainer}>
                  <Text style={styles.channelName}>
                    {videoDetails.channel.name}
                  </Text>
                  {videoDetails.channel.verified && (
                    <Feather
                      name="check-circle"
                      size={16}
                      color={Colors.primary}
                    />
                  )}
                </View>
                <Text style={styles.channelSubscribers}>
                  {videoDetails.channel.subscribers} subscribers
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.addToListButton]}
              onPress={handleAddToList}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={20} color={Colors.background} />
              <Text style={styles.addToListText}>Add to List</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.whoAddedButton]}
              onPress={handleWhoAdded}
              activeOpacity={0.7}
            >
              <Feather name="users" size={20} color={Colors.primary} />
              <Text style={styles.whoAddedText}>Who Added</Text>
            </TouchableOpacity>
          </View>

          {/* Video Statistics */}
          {videoDetails.statistics && (
            <View style={styles.statisticsContainer}>
              <View style={styles.statItem}>
                <Feather name="eye" size={18} color={Colors.textSecondary} />
                <Text style={styles.statText}>
                  {videoDetails.statistics.viewCount} views
                </Text>
              </View>

              <View style={styles.statItem}>
                <Feather name="thumbs-up" size={18} color={Colors.success} />
                <Text style={styles.statText}>
                  {formatNumber(videoDetails.statistics.likeCount)}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Feather
                  name="message-circle"
                  size={18}
                  color={Colors.textSecondary}
                />
                <Text style={styles.statText}>
                  {formatNumber(videoDetails.statistics.commentCount)}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Feather name="heart" size={18} color={Colors.error} />
                <Text style={styles.statText}>
                  {formatNumber(videoDetails.statistics.favoriteCount)}
                </Text>
              </View>
            </View>
          )}

          {/* Video Details */}
          <View style={styles.detailsSection}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Video Information</Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Published</Text>
                <Text style={styles.detailValue}>
                  {formatDate(videoDetails.publishedAt)}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {formatDuration(videoDetails.duration)}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{videoDetails.category}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Language</Text>
                <Text style={styles.detailValue}>{videoDetails.language}</Text>
              </View>

              {videoDetails.content_rating && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Content Rating</Text>
                  <Text style={styles.detailValue}>
                    {videoDetails.content_rating}
                  </Text>
                </View>
              )}

              {videoDetails.age_restriction && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Age Restriction</Text>
                  <Text style={styles.detailValue}>
                    {videoDetails.age_restriction}+
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {videoDetails.description && (
            <View style={styles.descriptionSection}>
              <View style={styles.sectionHeader}>
                <Feather name="file-text" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text style={styles.description}>{videoDetails.description}</Text>
            </View>
          )}

          {/* Tags */}
          {videoDetails.tags && videoDetails.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <View style={styles.sectionHeader}>
                <Feather name="tag" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Tags</Text>
              </View>
              <View style={styles.tagsContainer}>
                {videoDetails.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quality & Captions */}
          <View style={styles.featuresSection}>
            <View style={styles.sectionHeader}>
              <Feather name="settings" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Available Features</Text>
            </View>

            {videoDetails.quality && videoDetails.quality.length > 0 && (
              <View style={styles.featureItem}>
                <Text style={styles.featureLabel}>Quality Options:</Text>
                <View style={styles.featureValues}>
                  {videoDetails.quality.map((quality, index) => (
                    <View key={index} style={styles.qualityBadge}>
                      <Text style={styles.qualityText}>{quality}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {videoDetails.captions && videoDetails.captions.length > 0 && (
              <View style={styles.featureItem}>
                <Text style={styles.featureLabel}>Captions:</Text>
                <View style={styles.featureValues}>
                  {videoDetails.captions.map((caption, index) => (
                    <View key={index} style={styles.captionBadge}>
                      <Text style={styles.captionText}>{caption}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.featureItem}>
              <Text style={styles.featureLabel}>Monetization:</Text>
              <Text
                style={[
                  styles.featureValue,
                  {
                    color: videoDetails.monetized
                      ? Colors.success
                      : Colors.error,
                  },
                ]}
              >
                {videoDetails.monetized ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsSection}>
            <TouchableOpacity
              style={styles.watchButton}
              onPress={handleOpenVideo}
            >
              <Feather name="play" size={20} color={Colors.background} />
              <Text style={styles.watchButtonText}>Watch Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownloadVideo}
            >
              <Feather name="download" size={20} color={Colors.primary} />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          </View>

          {/* Related Videos */}
          {videoDetails.related_videos &&
            videoDetails.related_videos.length > 0 && (
              <View style={styles.relatedSection}>
                <View style={styles.sectionHeader}>
                  <Feather name="video" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Related Videos</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.relatedVideosContainer}
                >
                  {videoDetails.related_videos.map(renderRelatedVideo)}
                </ScrollView>
              </View>
            )}
        </View>
      </ScrollView>

      {/* Modals */}
      <AddToListModal
        visible={showAddToList}
        onClose={() => setShowAddToList(false)}
        item={videoDetails}
        itemType="video"
      />

      <WhoAddedModal
        visible={showWhoAdded}
        onClose={() => setShowWhoAdded(false)}
        item={videoDetails}
        itemType="video"
        onNavigateToList={listId => {
          navigation.navigate('ListDetails', { listId });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.small,
  },
  headerTitle: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  shareButton: {
    padding: Spacing.small,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.medium,
  },
  content: {
    flex: 1,
  },
  thumbnailContainer: {
    position: 'relative',
    backgroundColor: Colors.textPrimary,
  },
  videoThumbnail: {
    width: width,
    height: (width * 9) / 16, // 16:9 aspect ratio
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: Spacing.small,
    right: Spacing.small,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 4,
  },
  durationText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  platformBadge: {
    position: 'absolute',
    top: Spacing.small,
    left: Spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 12,
    gap: 4,
  },
  platformText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  liveBadge: {
    position: 'absolute',
    top: Spacing.small,
    right: Spacing.small,
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 4,
  },
  liveText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  premiereBadge: {
    position: 'absolute',
    top: Spacing.small + 30,
    right: Spacing.small,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 4,
  },
  premiereText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  shortsBadge: {
    position: 'absolute',
    top: Spacing.small + 60,
    right: Spacing.small,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 4,
  },
  shortsText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  infoContainer: {
    padding: Spacing.medium,
  },
  videoTitle: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
    lineHeight: 28,
  },
  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.large,
    paddingVertical: Spacing.small,
  },
  channelAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.medium,
  },
  channelInfo: {
    flex: 1,
  },
  channelNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.tiny,
    marginBottom: Spacing.tiny,
  },
  channelName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  channelSubscribers: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.medium,
    marginBottom: Spacing.large,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.medium,
    borderRadius: 12,
    gap: Spacing.small,
  },
  addToListButton: {
    backgroundColor: Colors.primary,
  },
  addToListText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.background,
  },
  whoAddedButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  whoAddedText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.medium,
    borderRadius: 12,
    marginBottom: Spacing.large,
  },
  statItem: {
    alignItems: 'center',
    gap: Spacing.tiny,
  },
  statText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  detailsSection: {
    marginBottom: Spacing.large,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  sectionTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginLeft: Spacing.small,
  },
  detailsGrid: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.medium,
    gap: Spacing.medium,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  descriptionSection: {
    marginBottom: Spacing.large,
  },
  description: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  tagsSection: {
    marginBottom: Spacing.large,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.small,
  },
  tag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 16,
  },
  tagText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  featuresSection: {
    marginBottom: Spacing.large,
  },
  featureItem: {
    marginBottom: Spacing.medium,
  },
  featureLabel: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  featureValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.small,
  },
  featureValue: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
  },
  qualityBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 8,
  },
  qualityText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.success,
  },
  captionBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 8,
  },
  captionText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.warning,
  },
  actionButtonsSection: {
    flexDirection: 'row',
    gap: Spacing.medium,
    marginBottom: Spacing.large,
  },
  watchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.medium,
    borderRadius: 12,
    gap: Spacing.small,
  },
  watchButtonText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.background,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.medium,
    borderRadius: 12,
    gap: Spacing.small,
  },
  downloadButtonText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  relatedSection: {
    marginBottom: Spacing.large,
  },
  relatedVideosContainer: {
    paddingRight: Spacing.medium,
  },
  relatedVideoItem: {
    width: 200,
    marginRight: Spacing.medium,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  relatedThumbnail: {
    width: '100%',
    height: 112, // 16:9 aspect ratio for 200px width
    position: 'relative',
  },
  relatedDurationBadge: {
    position: 'absolute',
    bottom: Spacing.tiny,
    right: Spacing.tiny,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.tiny,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relatedDurationText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  relatedVideoInfo: {
    padding: Spacing.small,
  },
  relatedVideoTitle: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  relatedVideoChannel: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  relatedVideoViews: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
});

export default VideoDetailsScreen;
