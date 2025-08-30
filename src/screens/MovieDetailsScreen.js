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

const MovieDetailsScreen = ({ route, navigation }) => {
  const { movie } = route.params;
  const [movieDetails, setMovieDetails] = useState(movie);
  const [loading, setLoading] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showWhoAdded, setShowWhoAdded] = useState(false);

  useEffect(() => {
    if (movie && !movie.runtime) {
      fetchMovieDetails();
    }
  }, [movie]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you would use TMDB API here
      // For now, we'll enhance the basic movie data
      setMovieDetails({
        ...movie,
        runtime: movie.runtime || 120,
        budget: movie.budget || 50000000,
        revenue: movie.revenue || 150000000,
        genres: movie.genres || [
          { id: 28, name: 'Action' },
          { id: 12, name: 'Adventure' },
        ],
        production_companies: movie.production_companies || [
          { name: 'Universal Pictures' },
        ],
        cast: movie.cast || [
          { name: 'Actor 1', character: 'Character 1', profile_path: null },
          { name: 'Actor 2', character: 'Character 2', profile_path: null },
          { name: 'Actor 3', character: 'Character 3', profile_path: null },
        ],
        crew: movie.crew || [
          { name: 'Director Name', job: 'Director' },
          { name: 'Producer Name', job: 'Producer' },
        ],
        vote_average: movie.vote_average || 7.5,
        vote_count: movie.vote_count || 1250,
        status: movie.status || 'Released',
        tagline: movie.tagline || 'An epic adventure awaits',
        homepage: movie.homepage,
        imdb_id: movie.imdb_id,
      });
    } catch (error) {
      console.error('Error fetching movie details:', error);
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
    const imdbUrl = movieDetails.imdb_id
      ? `https://www.imdb.com/title/${movieDetails.imdb_id}`
      : `https://www.imdb.com/find?q=${encodeURIComponent(movieDetails.title)}`;
    Linking.openURL(imdbUrl).catch(() => {
      Alert.alert('Error', 'Could not open IMDb');
    });
  };

  const handleOpenHomepage = () => {
    if (movieDetails.homepage) {
      HapticPatterns.buttonPress();
      Linking.openURL(movieDetails.homepage).catch(() => {
        Alert.alert('Error', 'Could not open website');
      });
    }
  };

  const formatRuntime = minutes => {
    if (!minutes) {return 'Unknown';}
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = amount => {
    if (!amount) {return 'Unknown';}
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRatingColor = rating => {
    if (rating >= 8) {return Colors.success;}
    if (rating >= 6) {return Colors.warning;}
    return Colors.error;
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
          <Text style={styles.headerTitle}>Movie Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading movie details...</Text>
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
        <Text style={styles.headerTitle}>Movie Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Movie Poster */}
        <View style={styles.posterContainer}>
          <Image
            source={{
              uri: movieDetails.poster_path
                ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
                : movieDetails.image ||
                  'https://via.placeholder.com/300x450?text=Movie+Poster',
            }}
            style={styles.moviePoster}
            resizeMode="cover"
          />

          {/* Rating Badge */}
          <View
            style={[
              styles.ratingBadge,
              { backgroundColor: getRatingColor(movieDetails.vote_average) },
            ]}
          >
            <Feather name="star" size={16} color={Colors.background} />
            <Text style={styles.ratingText}>
              {movieDetails.vote_average?.toFixed(1) || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Movie Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.movieTitle}>{movieDetails.title}</Text>

          {movieDetails.tagline && (
            <Text style={styles.tagline}>"{movieDetails.tagline}"</Text>
          )}

          {/* Basic Info */}
          <View style={styles.basicInfo}>
            <View style={styles.infoItem}>
              <Feather name="calendar" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {movieDetails.release_date
                  ? new Date(movieDetails.release_date).getFullYear()
                  : 'Unknown'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="clock" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {formatRuntime(movieDetails.runtime)}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="users" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {movieDetails.vote_count || 0} votes
              </Text>
            </View>
          </View>

          {/* Genres */}
          {movieDetails.genres && movieDetails.genres.length > 0 && (
            <View style={styles.genresContainer}>
              {movieDetails.genres.map(genre => (
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
          {movieDetails.overview && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="file-text" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Overview</Text>
              </View>
              <Text style={styles.overview}>{movieDetails.overview}</Text>
            </View>
          )}

          {/* Cast */}
          {movieDetails.cast && movieDetails.cast.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="users" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Cast</Text>
              </View>
              <FlatList
                data={movieDetails.cast.slice(0, 10)}
                renderItem={renderCastMember}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castList}
              />
            </View>
          )}

          {/* Crew */}
          {movieDetails.crew && movieDetails.crew.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="briefcase" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Crew</Text>
              </View>
              <View style={styles.crewContainer}>
                {movieDetails.crew.slice(0, 6).map((member, index) => (
                  <View key={index} style={styles.crewItem}>
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
              {movieDetails.budget && (
                <View style={styles.productionItem}>
                  <Text style={styles.productionLabel}>Budget</Text>
                  <Text style={styles.productionValue}>
                    {formatCurrency(movieDetails.budget)}
                  </Text>
                </View>
              )}

              {movieDetails.revenue && (
                <View style={styles.productionItem}>
                  <Text style={styles.productionLabel}>Revenue</Text>
                  <Text style={styles.productionValue}>
                    {formatCurrency(movieDetails.revenue)}
                  </Text>
                </View>
              )}

              <View style={styles.productionItem}>
                <Text style={styles.productionLabel}>Status</Text>
                <Text style={styles.productionValue}>
                  {movieDetails.status || 'Unknown'}
                </Text>
              </View>

              {movieDetails.production_companies &&
                movieDetails.production_companies.length > 0 && (
                  <View style={styles.productionItem}>
                    <Text style={styles.productionLabel}>
                      Production Companies
                    </Text>
                    <Text style={styles.productionValue}>
                      {movieDetails.production_companies
                        .map(company => company.name)
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

            {movieDetails.homepage && (
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
        item={movieDetails}
        itemType="movie"
      />

      <WhoAddedModal
        visible={showWhoAdded}
        onClose={() => setShowWhoAdded(false)}
        item={movieDetails}
        itemType="movie"
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
  moviePoster: {
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
  infoContainer: {
    padding: Spacing.medium,
  },
  movieTitle: {
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

export default MovieDetailsScreen;
