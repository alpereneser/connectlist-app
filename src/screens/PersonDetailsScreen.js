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

const PersonDetailsScreen = ({ route, navigation }) => {
  const { person } = route.params;
  const [personDetails, setPersonDetails] = useState(person);
  const [loading, setLoading] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showWhoAdded, setShowWhoAdded] = useState(false);
  const [selectedTab, setSelectedTab] = useState('movies'); // movies, tv_shows, bio

  useEffect(() => {
    if (person && !person.biography) {
      fetchPersonDetails();
    }
  }, [person]);

  const fetchPersonDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you would use TMDB API here
      // For now, we'll enhance the basic person data
      setPersonDetails({
        ...person,
        biography:
          person.biography ||
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        birthday: person.birthday || '1980-05-15',
        place_of_birth: person.place_of_birth || 'Los Angeles, California, USA',
        deathday: person.deathday || null,
        gender: person.gender || 2, // 1: Female, 2: Male, 3: Non-binary
        known_for_department: person.known_for_department || 'Acting',
        popularity: person.popularity || 85.5,
        adult: person.adult || false,
        also_known_as: person.also_known_as || [
          'Alternative Name 1',
          'Alternative Name 2',
        ],
        homepage: person.homepage,
        imdb_id: person.imdb_id || 'nm1234567',
        movies: person.movies || [
          {
            id: 1,
            title: 'Movie Title 1',
            character: 'Character Name',
            release_date: '2023-01-15',
            poster_path: 'https://via.placeholder.com/300x450?text=Movie+1',
            vote_average: 8.2,
            genre_ids: [28, 12, 878],
          },
          {
            id: 2,
            title: 'Movie Title 2',
            character: 'Another Character',
            release_date: '2022-08-20',
            poster_path: 'https://via.placeholder.com/300x450?text=Movie+2',
            vote_average: 7.5,
            genre_ids: [18, 10749],
          },
          {
            id: 3,
            title: 'Movie Title 3',
            character: 'Lead Role',
            release_date: '2021-12-10',
            poster_path: 'https://via.placeholder.com/300x450?text=Movie+3',
            vote_average: 9.1,
            genre_ids: [16, 35, 10751],
          },
        ],
        tv_shows: person.tv_shows || [
          {
            id: 1,
            name: 'TV Show Title 1',
            character: 'Main Character',
            first_air_date: '2023-03-01',
            poster_path: 'https://via.placeholder.com/300x450?text=TV+Show+1',
            vote_average: 8.8,
            episode_count: 24,
            genre_ids: [18, 80],
          },
          {
            id: 2,
            name: 'TV Show Title 2',
            character: 'Supporting Role',
            first_air_date: '2022-09-15',
            poster_path: 'https://via.placeholder.com/300x450?text=TV+Show+2',
            vote_average: 7.9,
            episode_count: 12,
            genre_ids: [35, 10765],
          },
        ],
        social_media: person.social_media || {
          instagram: 'personname',
          twitter: 'personname',
          facebook: 'personname',
        },
        awards: person.awards || [
          {
            name: 'Academy Award',
            category: 'Best Actor',
            year: 2023,
            won: true,
          },
          {
            name: 'Golden Globe',
            category: 'Best Actor - Motion Picture Drama',
            year: 2022,
            won: false,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching person details:', error);
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
    const imdbUrl = personDetails.imdb_id
      ? `https://www.imdb.com/name/${personDetails.imdb_id}`
      : `https://www.imdb.com/find?q=${encodeURIComponent(personDetails.name)}`;
    Linking.openURL(imdbUrl).catch(() => {
      Alert.alert('Error', 'Could not open IMDb');
    });
  };

  const handleOpenSocialMedia = platform => {
    HapticPatterns.buttonPress();
    let url = '';
    const username = personDetails.social_media?.[platform];

    if (!username) {return;}

    switch (platform) {
      case 'instagram':
        url = `https://www.instagram.com/${username}`;
        break;
      case 'twitter':
        url = `https://www.twitter.com/${username}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/${username}`;
        break;
      default:
        return;
    }

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', `Could not open ${platform}`);
    });
  };

  const handleOpenHomepage = () => {
    if (personDetails.homepage) {
      HapticPatterns.buttonPress();
      Linking.openURL(personDetails.homepage).catch(() => {
        Alert.alert('Error', 'Could not open homepage');
      });
    }
  };

  const handleMoviePress = movie => {
    HapticPatterns.buttonPress();
    onNavigate('MovieDetails', { movie });
  };

  const handleTVShowPress = tvShow => {
    HapticPatterns.buttonPress();
    onNavigate('SeriesDetails', { series: tvShow });
  };

  const getGenderText = gender => {
    switch (gender) {
      case 1:
        return 'Female';
      case 2:
        return 'Male';
      case 3:
        return 'Non-binary';
      default:
        return 'Not specified';
    }
  };

  const calculateAge = (birthday, deathday = null) => {
    if (!birthday) {return null;}
    const birthDate = new Date(birthday);
    const endDate = deathday ? new Date(deathday) : new Date();
    const age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && endDate.getDate() < birthDate.getDate())
    ) {
      return age - 1;
    }
    return age;
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

  const getRatingColor = rating => {
    if (rating >= 8) {return Colors.success;}
    if (rating >= 6) {return Colors.warning;}
    return Colors.error;
  };

  const renderMovieItem = ({ item }) => (
    <TouchableOpacity
      style={styles.mediaItem}
      onPress={() => handleMoviePress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.poster_path }}
        style={styles.mediaPoster}
        resizeMode="cover"
      />
      <View style={styles.mediaInfo}>
        <Text style={styles.mediaTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.mediaCharacter} numberOfLines={1}>
          {item.character}
        </Text>
        <Text style={styles.mediaYear}>
          {item.release_date
            ? new Date(item.release_date).getFullYear()
            : 'TBA'}
        </Text>
        {item.vote_average && (
          <View
            style={[
              styles.ratingBadge,
              { backgroundColor: getRatingColor(item.vote_average) },
            ]}
          >
            <Feather name="star" size={12} color={Colors.background} />
            <Text style={styles.ratingText}>
              {item.vote_average.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTVShowItem = ({ item }) => (
    <TouchableOpacity
      style={styles.mediaItem}
      onPress={() => handleTVShowPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.poster_path }}
        style={styles.mediaPoster}
        resizeMode="cover"
      />
      <View style={styles.mediaInfo}>
        <Text style={styles.mediaTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.mediaCharacter} numberOfLines={1}>
          {item.character}
        </Text>
        <Text style={styles.mediaYear}>
          {item.first_air_date
            ? new Date(item.first_air_date).getFullYear()
            : 'TBA'}
        </Text>
        {item.episode_count && (
          <Text style={styles.episodeCount}>{item.episode_count} episodes</Text>
        )}
        {item.vote_average && (
          <View
            style={[
              styles.ratingBadge,
              { backgroundColor: getRatingColor(item.vote_average) },
            ]}
          >
            <Feather name="star" size={12} color={Colors.background} />
            <Text style={styles.ratingText}>
              {item.vote_average.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAward = ({ item }) => (
    <View style={[styles.awardItem, item.won && styles.awardWon]}>
      <View style={styles.awardIcon}>
        <Feather
          name={item.won ? 'award' : 'circle'}
          size={20}
          color={item.won ? Colors.warning : Colors.textSecondary}
        />
      </View>
      <View style={styles.awardInfo}>
        <Text style={styles.awardName}>{item.name}</Text>
        <Text style={styles.awardCategory}>{item.category}</Text>
        <Text style={styles.awardYear}>{item.year}</Text>
      </View>
      <View style={styles.awardStatus}>
        <Text style={[styles.awardStatusText, item.won && styles.awardWonText]}>
          {item.won ? 'Won' : 'Nominated'}
        </Text>
      </View>
    </View>
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
          <Text style={styles.headerTitle}>Person Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading person details...</Text>
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
        <Text style={styles.headerTitle}>Person Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Person Photo */}
        <View style={styles.photoContainer}>
          <Image
            source={{
              uri:
                personDetails.profile_path ||
                personDetails.image ||
                'https://via.placeholder.com/300x450?text=Person+Photo',
            }}
            style={styles.personPhoto}
            resizeMode="cover"
          />

          {/* Popularity Badge */}
          {personDetails.popularity && (
            <View style={styles.popularityBadge}>
              <Feather name="trending-up" size={16} color={Colors.background} />
              <Text style={styles.popularityText}>
                {personDetails.popularity.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Person Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.personName}>{personDetails.name}</Text>

          {personDetails.also_known_as &&
            personDetails.also_known_as.length > 0 && (
              <Text style={styles.alsoKnownAs}>
                Also known as: {personDetails.also_known_as.join(', ')}
              </Text>
            )}

          {/* Basic Info */}
          <View style={styles.basicInfo}>
            <View style={styles.infoItem}>
              <Feather
                name="briefcase"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.infoText}>
                {personDetails.known_for_department}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="user" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {getGenderText(personDetails.gender)}
              </Text>
            </View>

            {personDetails.birthday && (
              <View style={styles.infoItem}>
                <Feather
                  name="calendar"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.infoText}>
                  {calculateAge(personDetails.birthday, personDetails.deathday)}{' '}
                  years old
                </Text>
              </View>
            )}
          </View>

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

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'movies' && styles.activeTab]}
              onPress={() => setSelectedTab('movies')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === 'movies' && styles.activeTabText,
                ]}
              >
                Movies ({personDetails.movies?.length || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === 'tv_shows' && styles.activeTab,
              ]}
              onPress={() => setSelectedTab('tv_shows')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === 'tv_shows' && styles.activeTabText,
                ]}
              >
                TV Shows ({personDetails.tv_shows?.length || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === 'bio' && styles.activeTab]}
              onPress={() => setSelectedTab('bio')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === 'bio' && styles.activeTabText,
                ]}
              >
                Biography
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {selectedTab === 'movies' && (
            <View style={styles.tabContent}>
              {personDetails.movies && personDetails.movies.length > 0 ? (
                <FlatList
                  data={personDetails.movies}
                  renderItem={renderMovieItem}
                  keyExtractor={item => `movie-${item.id}`}
                  numColumns={2}
                  scrollEnabled={false}
                  contentContainerStyle={styles.mediaGrid}
                  columnWrapperStyle={styles.mediaRow}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="film" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>No movies found</Text>
                </View>
              )}
            </View>
          )}

          {selectedTab === 'tv_shows' && (
            <View style={styles.tabContent}>
              {personDetails.tv_shows && personDetails.tv_shows.length > 0 ? (
                <FlatList
                  data={personDetails.tv_shows}
                  renderItem={renderTVShowItem}
                  keyExtractor={item => `tv-${item.id}`}
                  numColumns={2}
                  scrollEnabled={false}
                  contentContainerStyle={styles.mediaGrid}
                  columnWrapperStyle={styles.mediaRow}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="tv" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>No TV shows found</Text>
                </View>
              )}
            </View>
          )}

          {selectedTab === 'bio' && (
            <View style={styles.tabContent}>
              {/* Personal Information */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="info" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                </View>

                <View style={styles.personalInfo}>
                  {personDetails.birthday && (
                    <View style={styles.personalItem}>
                      <Text style={styles.personalLabel}>Birthday</Text>
                      <Text style={styles.personalValue}>
                        {formatDate(personDetails.birthday)}
                      </Text>
                    </View>
                  )}

                  {personDetails.deathday && (
                    <View style={styles.personalItem}>
                      <Text style={styles.personalLabel}>Death</Text>
                      <Text style={styles.personalValue}>
                        {formatDate(personDetails.deathday)}
                      </Text>
                    </View>
                  )}

                  {personDetails.place_of_birth && (
                    <View style={styles.personalItem}>
                      <Text style={styles.personalLabel}>Place of Birth</Text>
                      <Text style={styles.personalValue}>
                        {personDetails.place_of_birth}
                      </Text>
                    </View>
                  )}

                  <View style={styles.personalItem}>
                    <Text style={styles.personalLabel}>Known For</Text>
                    <Text style={styles.personalValue}>
                      {personDetails.known_for_department}
                    </Text>
                  </View>

                  <View style={styles.personalItem}>
                    <Text style={styles.personalLabel}>Gender</Text>
                    <Text style={styles.personalValue}>
                      {getGenderText(personDetails.gender)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Biography */}
              {personDetails.biography && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Feather
                      name="file-text"
                      size={20}
                      color={Colors.primary}
                    />
                    <Text style={styles.sectionTitle}>Biography</Text>
                  </View>
                  <Text style={styles.biography}>
                    {personDetails.biography}
                  </Text>
                </View>
              )}

              {/* Awards */}
              {personDetails.awards && personDetails.awards.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Feather name="award" size={20} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>
                      Awards & Nominations
                    </Text>
                  </View>
                  <FlatList
                    data={personDetails.awards}
                    renderItem={renderAward}
                    keyExtractor={(item, index) => `award-${index}`}
                    scrollEnabled={false}
                    contentContainerStyle={styles.awardsList}
                  />
                </View>
              )}

              {/* External Links */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather
                    name="external-link"
                    size={20}
                    color={Colors.primary}
                  />
                  <Text style={styles.sectionTitle}>External Links</Text>
                </View>

                <TouchableOpacity
                  style={styles.linkItem}
                  onPress={handleOpenIMDb}
                >
                  <View style={styles.linkInfo}>
                    <View style={styles.imdbIcon}>
                      <Feather name="film" size={20} color={Colors.warning} />
                    </View>
                    <Text style={styles.linkText}>View on IMDb</Text>
                  </View>
                  <Feather
                    name="external-link"
                    size={16}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>

                {personDetails.homepage && (
                  <TouchableOpacity
                    style={styles.linkItem}
                    onPress={handleOpenHomepage}
                  >
                    <View style={styles.linkInfo}>
                      <View style={styles.websiteIcon}>
                        <Feather
                          name="globe"
                          size={20}
                          color={Colors.primary}
                        />
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

                {/* Social Media Links */}
                {personDetails.social_media && (
                  <>
                    {personDetails.social_media.instagram && (
                      <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => handleOpenSocialMedia('instagram')}
                      >
                        <View style={styles.linkInfo}>
                          <View style={styles.instagramIcon}>
                            <Feather
                              name="instagram"
                              size={20}
                              color={Colors.background}
                            />
                          </View>
                          <Text style={styles.linkText}>Instagram</Text>
                        </View>
                        <Feather
                          name="external-link"
                          size={16}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}

                    {personDetails.social_media.twitter && (
                      <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => handleOpenSocialMedia('twitter')}
                      >
                        <View style={styles.linkInfo}>
                          <View style={styles.twitterIcon}>
                            <Feather
                              name="twitter"
                              size={20}
                              color={Colors.background}
                            />
                          </View>
                          <Text style={styles.linkText}>Twitter</Text>
                        </View>
                        <Feather
                          name="external-link"
                          size={16}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}

                    {personDetails.social_media.facebook && (
                      <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => handleOpenSocialMedia('facebook')}
                      >
                        <View style={styles.linkInfo}>
                          <View style={styles.facebookIcon}>
                            <Feather
                              name="facebook"
                              size={20}
                              color={Colors.background}
                            />
                          </View>
                          <Text style={styles.linkText}>Facebook</Text>
                        </View>
                        <Feather
                          name="external-link"
                          size={16}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </>
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
        item={personDetails}
        itemType="person"
      />

      <WhoAddedModal
        visible={showWhoAdded}
        onClose={() => setShowWhoAdded(false)}
        item={personDetails}
        itemType="person"
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
  photoContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.large,
    backgroundColor: Colors.backgroundSecondary,
    position: 'relative',
  },
  personPhoto: {
    width: 200,
    height: 300,
    borderRadius: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  popularityBadge: {
    position: 'absolute',
    top: Spacing.large + 10,
    right: '50%',
    marginRight: -100 + 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 16,
    gap: 4,
  },
  popularityText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  infoContainer: {
    padding: Spacing.medium,
  },
  personName: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  alsoKnownAs: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regularItalic,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.medium,
  },
  basicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.large,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.tiny,
    marginBottom: Spacing.large,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.small,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: Colors.background,
    fontFamily: FontFamily.semiBold,
  },
  tabContent: {
    minHeight: 200,
  },
  mediaGrid: {
    gap: Spacing.medium,
  },
  mediaRow: {
    justifyContent: 'space-between',
  },
  mediaItem: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.small,
    marginHorizontal: Spacing.tiny,
    marginBottom: Spacing.medium,
  },
  mediaPoster: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: Spacing.small,
  },
  mediaInfo: {
    flex: 1,
  },
  mediaTitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  mediaCharacter: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regularItalic,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  mediaYear: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  episodeCount: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 12,
    gap: 2,
  },
  ratingText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.extraLarge,
  },
  emptyText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.medium,
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
  personalInfo: {
    gap: Spacing.medium,
  },
  personalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  personalLabel: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  personalValue: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  biography: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  awardsList: {
    gap: Spacing.small,
  },
  awardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.medium,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.textSecondary,
  },
  awardWon: {
    borderLeftColor: Colors.warning,
  },
  awardIcon: {
    marginRight: Spacing.medium,
  },
  awardInfo: {
    flex: 1,
  },
  awardName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  awardCategory: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  awardYear: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  awardStatus: {
    alignItems: 'flex-end',
  },
  awardStatusText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  awardWonText: {
    color: Colors.warning,
    fontFamily: FontFamily.semiBold,
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
  websiteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  instagramIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E4405F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  twitterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1DA1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  facebookIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1877F2',
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

export default PersonDetailsScreen;
