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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { HapticPatterns } from '../utils/haptics';
import AddToListModal from '../components/AddToListModal';
import WhoAddedModal from '../components/WhoAddedModal';

const SeriesDetailsScreen = ({ route, navigation }) => {
  const { series } = route.params;
  const [seriesDetails, setSeriesDetails] = useState(series);
  const [loading, setLoading] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showWhoAdded, setShowWhoAdded] = useState(false);

  useEffect(() => {
    if (series && !series.number_of_seasons) {
      fetchSeriesDetails();
    }
  }, [series]);

  const fetchSeriesDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you would use TMDB API here
      // For now, we'll enhance the basic series data
      setSeriesDetails({
        ...series,
        number_of_seasons: series.number_of_seasons || 3,
        number_of_episodes: series.number_of_episodes || 24,
        episode_run_time: series.episode_run_time || [45],
        status: series.status || 'Ended',
        type: series.type || 'Scripted',
        genres: series.genres || [
          { id: 18, name: 'Drama' },
          { id: 80, name: 'Crime' },
        ],
        networks: series.networks || [{ name: 'Netflix' }],
        created_by: series.created_by || [{ name: 'Creator Name' }],
        cast: series.cast || [
          { name: 'Actor 1', character: 'Character 1', profile_path: null },
          { name: 'Actor 2', character: 'Character 2', profile_path: null },
          { name: 'Actor 3', character: 'Character 3', profile_path: null },
        ],
        crew: series.crew || [
          { name: 'Director Name', job: 'Director' },
          { name: 'Producer Name', job: 'Producer' },
        ],
        vote_average: series.vote_average || 8.2,
        vote_count: series.vote_count || 2150,
        tagline: series.tagline || 'An epic series that captivates',
        homepage: series.homepage,
        imdb_id: series.imdb_id,
        seasons: series.seasons || [
          {
            season_number: 1,
            episode_count: 8,
            air_date: '2021-01-01',
            name: 'Season 1',
            overview: 'The first season introduces our characters...',
          },
          {
            season_number: 2,
            episode_count: 8,
            air_date: '2022-01-01',
            name: 'Season 2',
            overview: 'The story continues with new challenges...',
          },
          {
            season_number: 3,
            episode_count: 8,
            air_date: '2023-01-01',
            name: 'Season 3',
            overview: 'The final season brings everything to a conclusion...',
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching series details:', error);
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

  const handleOpenIMDb = () => {
    HapticPatterns.buttonPress();
    const imdbUrl = seriesDetails.imdb_id
      ? `https://www.imdb.com/title/${seriesDetails.imdb_id}`
      : `https://www.imdb.com/find?q=${encodeURIComponent(seriesDetails.name || seriesDetails.title)}`;
    Linking.openURL(imdbUrl).catch(() => {
      Alert.alert('Error', 'Could not open IMDb');
    });
  };

  const handleOpenHomepage = () => {
    if (seriesDetails.homepage) {
      HapticPatterns.buttonPress();
      Linking.openURL(seriesDetails.homepage).catch(() => {
        Alert.alert('Error', 'Could not open website');
      });
    }
  };

  const formatRuntime = runtimes => {
    if (!runtimes || runtimes.length === 0) {return 'Unknown';}
    const avgRuntime = runtimes.reduce((a, b) => a + b, 0) / runtimes.length;
    return `${Math.round(avgRuntime)} min`;
  };

  const getRatingColor = rating => {
    if (rating >= 8) {return Colors.success;}
    if (rating >= 6) {return Colors.warning;}
    return Colors.error;
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'returning series':
      case 'in production':
        return Colors.success;
      case 'ended':
      case 'canceled':
        return Colors.error;
      default:
        return Colors.warning;
    }
  };

  const renderCastMember = ({ item }) => (
    <TouchableOpacity style={styles.castItem} activeOpacity={0.7}>
      <View style={styles.castImageContainer}>
        {item.profile_path ? (
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w200${item.profile_path}`,
            }}
            style={styles.castImage}
          />
        ) : (
          <View style={[styles.castImage, styles.castImagePlaceholder]}>
            <Feather name="user" size={24} color={Colors.textSecondary} />
          </View>
        )}
      </View>
      <Text style={styles.castName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.castCharacter} numberOfLines={1}>
        {item.character}
      </Text>
    </TouchableOpacity>
  );

  const renderSeason = ({ item }) => (
    <TouchableOpacity style={styles.seasonItem} activeOpacity={0.7}>
      <View style={styles.seasonInfo}>
        <Text style={styles.seasonName}>{item.name}</Text>
        <Text style={styles.seasonDetails}>
          {item.episode_count} episodes •{' '}
          {item.air_date ? new Date(item.air_date).getFullYear() : 'TBA'}
        </Text>
        {item.overview && (
          <Text style={styles.seasonOverview} numberOfLines={2}>
            {item.overview}
          </Text>
        )}
      </View>
      <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
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
          <Text style={styles.headerTitle}>Series Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading series details...</Text>
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
        <Text style={styles.headerTitle}>Series Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Series Poster */}
        <View style={styles.posterContainer}>
          <Image
            source={{
              uri: seriesDetails.poster_path
                ? `https://image.tmdb.org/t/p/w500${seriesDetails.poster_path}`
                : seriesDetails.image ||
                  'https://via.placeholder.com/300x450?text=Series+Poster',
            }}
            style={styles.seriesPoster}
            resizeMode="cover"
          />

          {/* Rating Badge */}
          <View
            style={[
              styles.ratingBadge,
              { backgroundColor: getRatingColor(seriesDetails.vote_average) },
            ]}
          >
            <Feather name="star" size={16} color={Colors.background} />
            <Text style={styles.ratingText}>
              {seriesDetails.vote_average?.toFixed(1) || 'N/A'}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(seriesDetails.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {seriesDetails.status || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Series Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.seriesTitle}>
            {seriesDetails.name || seriesDetails.title}
          </Text>

          {seriesDetails.tagline && (
            <Text style={styles.tagline}>"{seriesDetails.tagline}"</Text>
          )}

          {/* Basic Info */}
          <View style={styles.basicInfo}>
            <View style={styles.infoItem}>
              <Feather name="calendar" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {seriesDetails.first_air_date
                  ? new Date(seriesDetails.first_air_date).getFullYear()
                  : 'Unknown'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="clock" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {formatRuntime(seriesDetails.episode_run_time)}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="users" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {seriesDetails.vote_count || 0} votes
              </Text>
            </View>
          </View>

          {/* Series Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {seriesDetails.number_of_seasons || 0}
              </Text>
              <Text style={styles.statLabel}>Seasons</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {seriesDetails.number_of_episodes || 0}
              </Text>
              <Text style={styles.statLabel}>Episodes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {seriesDetails.type || 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Type</Text>
            </View>
          </View>

          {/* Genres */}
          {seriesDetails.genres && seriesDetails.genres.length > 0 && (
            <View style={styles.genresContainer}>
              {seriesDetails.genres.map(genre => (
                <View key={genre.id || genre.name} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre.name}</Text>
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

          {/* Overview */}
          {seriesDetails.overview && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="file-text" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Overview</Text>
              </View>
              <Text style={styles.overview}>{seriesDetails.overview}</Text>
            </View>
          )}

          {/* Seasons */}
          {seriesDetails.seasons && seriesDetails.seasons.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="tv" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Seasons</Text>
              </View>
              <FlatList
                data={seriesDetails.seasons}
                renderItem={renderSeason}
                keyExtractor={item => `season-${item.season_number}`}
                scrollEnabled={false}
                ItemSeparatorComponent={() => (
                  <View style={styles.seasonSeparator} />
                )}
              />
            </View>
          )}

          {/* Cast */}
          {seriesDetails.cast && seriesDetails.cast.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="users" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Cast</Text>
              </View>
              <FlatList
                data={seriesDetails.cast.slice(0, 10)}
                renderItem={renderCastMember}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castList}
              />
            </View>
          )}

          {/* Creators & Crew */}
          {((seriesDetails.created_by && seriesDetails.created_by.length > 0) ||
            (seriesDetails.crew && seriesDetails.crew.length > 0)) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="briefcase" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Creators & Crew</Text>
              </View>
              <View style={styles.crewContainer}>
                {seriesDetails.created_by &&
                  seriesDetails.created_by.map((creator, index) => (
                    <View key={`creator-${index}`} style={styles.crewItem}>
                      <Text style={styles.crewName}>{creator.name}</Text>
                      <Text style={styles.crewJob}>Creator</Text>
                    </View>
                  ))}
                {seriesDetails.crew &&
                  seriesDetails.crew.slice(0, 4).map((member, index) => (
                    <View key={`crew-${index}`} style={styles.crewItem}>
                      <Text style={styles.crewName}>{member.name}</Text>
                      <Text style={styles.crewJob}>{member.job}</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Production Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Production</Text>
            </View>

            <View style={styles.productionInfo}>
              <View style={styles.productionItem}>
                <Text style={styles.productionLabel}>Status</Text>
                <Text
                  style={[
                    styles.productionValue,
                    { color: getStatusColor(seriesDetails.status) },
                  ]}
                >
                  {seriesDetails.status || 'Unknown'}
                </Text>
              </View>

              <View style={styles.productionItem}>
                <Text style={styles.productionLabel}>Type</Text>
                <Text style={styles.productionValue}>
                  {seriesDetails.type || 'Unknown'}
                </Text>
              </View>

              {seriesDetails.first_air_date && (
                <View style={styles.productionItem}>
                  <Text style={styles.productionLabel}>First Air Date</Text>
                  <Text style={styles.productionValue}>
                    {new Date(
                      seriesDetails.first_air_date,
                    ).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {seriesDetails.last_air_date && (
                <View style={styles.productionItem}>
                  <Text style={styles.productionLabel}>Last Air Date</Text>
                  <Text style={styles.productionValue}>
                    {new Date(seriesDetails.last_air_date).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {seriesDetails.networks && seriesDetails.networks.length > 0 && (
                <View style={styles.productionItem}>
                  <Text style={styles.productionLabel}>Networks</Text>
                  <Text style={styles.productionValue}>
                    {seriesDetails.networks
                      .map(network => network.name)
                      .join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* External Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="external-link" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>External Links</Text>
            </View>

            <TouchableOpacity style={styles.linkItem} onPress={handleOpenIMDb}>
              <View style={styles.linkInfo}>
                <View style={styles.imdbIcon}>
                  <Text style={styles.imdbText}>IMDb</Text>
                </View>
                <Text style={styles.linkText}>View on IMDb</Text>
              </View>
              <Feather
                name="external-link"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {seriesDetails.homepage && (
              <TouchableOpacity
                style={styles.linkItem}
                onPress={handleOpenHomepage}
              >
                <View style={styles.linkInfo}>
                  <View style={styles.websiteIcon}>
                    <Feather name="globe" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.linkText}>Official Website</Text>
                </View>
                <Feather
                  name="external-link"
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddToListModal
        visible={showAddToList}
        onClose={() => setShowAddToList(false)}
        item={seriesDetails}
        itemType="series"
      />

      <WhoAddedModal
        visible={showWhoAdded}
        onClose={() => setShowWhoAdded(false)}
        item={seriesDetails}
        itemType="series"
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
  posterContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.large,
    backgroundColor: Colors.backgroundSecondary,
    position: 'relative',
  },
  seriesPoster: {
    width: 200,
    height: 300,
    borderRadius: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.large + 10,
    right: '50%',
    marginRight: -100 + 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 16,
    gap: 4,
  },
  ratingText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.large + 10,
    left: '50%',
    marginLeft: -100 + 10,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 16,
  },
  statusText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    color: Colors.background,
    textTransform: 'uppercase',
  },
  infoContainer: {
    padding: Spacing.medium,
  },
  seriesTitle: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  tagline: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regularItalic,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.medium,
  },
  basicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.medium,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.tiny,
  },
  infoText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: Spacing.medium,
    marginBottom: Spacing.medium,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
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
  overview: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  seasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.medium,
    borderRadius: 12,
  },
  seasonInfo: {
    flex: 1,
  },
  seasonName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  seasonDetails: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  seasonOverview: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  seasonSeparator: {
    height: Spacing.small,
  },
  castList: {
    paddingRight: Spacing.medium,
  },
  castItem: {
    width: 80,
    marginRight: Spacing.medium,
    alignItems: 'center',
  },
  castImageContainer: {
    marginBottom: Spacing.small,
  },
  castImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  castImagePlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castName: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  castCharacter: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  crewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.medium,
  },
  crewItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.medium,
    borderRadius: 8,
  },
  crewName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  crewJob: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  productionInfo: {
    gap: Spacing.medium,
  },
  productionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productionLabel: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  productionValue: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: Spacing.small,
  },
  linkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imdbIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  imdbText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    color: Colors.warning,
  },
  websiteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  linkText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
});

export default SeriesDetailsScreen;
