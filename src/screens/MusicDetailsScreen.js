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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { HapticPatterns } from '../utils/haptics';
import AddToListModal from '../components/AddToListModal';
import WhoAddedModal from '../components/WhoAddedModal';

const MusicDetailsScreen = ({ route, navigation }) => {
  const { music } = route.params;
  const [musicDetails, setMusicDetails] = useState(music);
  const [loading, setLoading] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showWhoAdded, setShowWhoAdded] = useState(false);

  useEffect(() => {
    if (music && !music.duration_ms) {
      fetchMusicDetails();
    }
  }, [music]);

  const fetchMusicDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you would use Spotify API or similar here
      // For now, we'll enhance the basic music data
      setMusicDetails({
        ...music,
        duration_ms: music.duration_ms || 210000, // 3:30 default
        album: music.album || {
          name: 'Unknown Album',
          release_date: '2023',
          images: [
            {
              url:
                music.image ||
                'https://via.placeholder.com/300x300?text=Album+Cover',
            },
          ],
        },
        artists: music.artists || [{ name: music.artist || 'Unknown Artist' }],
        popularity: music.popularity || 75,
        explicit: music.explicit || false,
        preview_url: music.preview_url,
        external_urls: music.external_urls || {
          spotify: `https://open.spotify.com/search/${encodeURIComponent(music.name || music.title)}`,
        },
        genres: music.genres || ['Pop', 'Rock'],
        release_date: music.release_date || music.album?.release_date || '2023',
      });
    } catch (error) {
      console.error('Error fetching music details:', error);
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

  const handleOpenSpotify = () => {
    HapticPatterns.buttonPress();
    const url =
      musicDetails.external_urls?.spotify ||
      `https://open.spotify.com/search/${encodeURIComponent(musicDetails.name || musicDetails.title)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Spotify');
    });
  };

  const formatDuration = ms => {
    if (!ms) {return 'Unknown';}
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const getPopularityColor = popularity => {
    if (popularity >= 80) {return Colors.success;}
    if (popularity >= 60) {return Colors.warning;}
    return Colors.error;
  };

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
          <Text style={styles.headerTitle}>Music Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading music details...</Text>
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
        <Text style={styles.headerTitle}>Music Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Album Cover */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                musicDetails.album?.images?.[0]?.url ||
                musicDetails.image ||
                'https://via.placeholder.com/300x300?text=Album+Cover',
            }}
            style={styles.albumCover}
            resizeMode="cover"
          />
          {musicDetails.explicit && (
            <View style={styles.explicitBadge}>
              <Text style={styles.explicitText}>E</Text>
            </View>
          )}
        </View>

        {/* Music Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.musicTitle}>
            {musicDetails.name || musicDetails.title}
          </Text>

          {/* Artists */}
          <View style={styles.artistsContainer}>
            <Text style={styles.artistsText}>
              {musicDetails.artists?.map(artist => artist.name).join(', ') ||
                musicDetails.artist ||
                'Unknown Artist'}
            </Text>
          </View>

          {/* Album & Year */}
          <Text style={styles.albumText}>
            {musicDetails.album?.name || 'Unknown Album'} •{' '}
            {new Date(musicDetails.release_date).getFullYear()}
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Feather name="clock" size={16} color={Colors.textSecondary} />
              <Text style={styles.statText}>
                {formatDuration(musicDetails.duration_ms)}
              </Text>
            </View>

            {musicDetails.popularity && (
              <View style={styles.statItem}>
                <Feather
                  name="trending-up"
                  size={16}
                  color={getPopularityColor(musicDetails.popularity)}
                />
                <Text
                  style={[
                    styles.statText,
                    { color: getPopularityColor(musicDetails.popularity) },
                  ]}
                >
                  {musicDetails.popularity}% Popular
                </Text>
              </View>
            )}
          </View>

          {/* Genres */}
          {musicDetails.genres && musicDetails.genres.length > 0 && (
            <View style={styles.genresContainer}>
              {musicDetails.genres.map((genre, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
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

          {/* External Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="external-link" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Listen On</Text>
            </View>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={handleOpenSpotify}
            >
              <View style={styles.linkInfo}>
                <View style={styles.spotifyIcon}>
                  <Feather name="music" size={20} color={Colors.success} />
                </View>
                <Text style={styles.linkText}>Open in Spotify</Text>
              </View>
              <Feather
                name="external-link"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Album Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="disc" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Album Information</Text>
            </View>

            <View style={styles.albumInfo}>
              <Text style={styles.albumInfoTitle}>
                {musicDetails.album?.name || 'Unknown Album'}
              </Text>
              <Text style={styles.albumInfoText}>
                Released:{' '}
                {new Date(musicDetails.release_date).toLocaleDateString()}
              </Text>
              {musicDetails.album?.total_tracks && (
                <Text style={styles.albumInfoText}>
                  {musicDetails.album.total_tracks} tracks
                </Text>
              )}
            </View>
          </View>

          {/* Audio Features */}
          {musicDetails.audio_features && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="bar-chart-2" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Audio Features</Text>
              </View>

              <View style={styles.featuresGrid}>
                {musicDetails.audio_features.danceability && (
                  <View style={styles.featureItem}>
                    <Text style={styles.featureLabel}>Danceability</Text>
                    <Text style={styles.featureValue}>
                      {Math.round(
                        musicDetails.audio_features.danceability * 100,
                      )}
                      %
                    </Text>
                  </View>
                )}

                {musicDetails.audio_features.energy && (
                  <View style={styles.featureItem}>
                    <Text style={styles.featureLabel}>Energy</Text>
                    <Text style={styles.featureValue}>
                      {Math.round(musicDetails.audio_features.energy * 100)}%
                    </Text>
                  </View>
                )}

                {musicDetails.audio_features.valence && (
                  <View style={styles.featureItem}>
                    <Text style={styles.featureLabel}>Positivity</Text>
                    <Text style={styles.featureValue}>
                      {Math.round(musicDetails.audio_features.valence * 100)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <AddToListModal
        visible={showAddToList}
        onClose={() => setShowAddToList(false)}
        item={musicDetails}
        itemType="music"
      />

      <WhoAddedModal
        visible={showWhoAdded}
        onClose={() => setShowWhoAdded(false)}
        item={musicDetails}
        itemType="music"
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
  imageContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.large,
    backgroundColor: Colors.backgroundSecondary,
    position: 'relative',
  },
  albumCover: {
    width: 250,
    height: 250,
    borderRadius: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  explicitBadge: {
    position: 'absolute',
    top: Spacing.large + 10,
    right: '50%',
    marginRight: -125 + 10,
    backgroundColor: Colors.textSecondary,
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explicitText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  infoContainer: {
    padding: Spacing.medium,
  },
  musicTitle: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  artistsContainer: {
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  artistsText: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  albumText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.large,
    marginBottom: Spacing.medium,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.tiny,
  },
  statText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.small,
    marginBottom: Spacing.large,
  },
  genreTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
  },
  genreText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
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
  section: {
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
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  linkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotifyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  linkText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  albumInfo: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.medium,
    borderRadius: 12,
  },
  albumInfoTitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  albumInfoText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.medium,
  },
  featureItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.medium,
    borderRadius: 12,
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  featureValue: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
});

export default MusicDetailsScreen;
