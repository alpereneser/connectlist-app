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

const GameDetailsScreen = ({ route, navigation }) => {
  const { game } = route.params;
  const [gameDetails, setGameDetails] = useState(game);
  const [loading, setLoading] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showWhoAdded, setShowWhoAdded] = useState(false);

  useEffect(() => {
    if (game && !game.metacritic_score) {
      fetchGameDetails();
    }
  }, [game]);

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you would use RAWG API or IGDB API here
      // For now, we'll enhance the basic game data
      setGameDetails({
        ...game,
        metacritic_score: game.metacritic_score || 85,
        user_score: game.user_score || 8.2,
        release_date: game.release_date || '2023-03-15',
        developer: game.developer || 'Game Studio',
        publisher: game.publisher || 'Game Publisher',
        platforms: game.platforms || [
          'PC',
          'PlayStation 5',
          'Xbox Series X/S',
          'Nintendo Switch',
        ],
        genres: game.genres || ['Action', 'Adventure', 'RPG'],
        esrb_rating: game.esrb_rating || 'T',
        playtime: game.playtime || 45,
        achievements_count: game.achievements_count || 50,
        dlc_count: game.dlc_count || 3,
        multiplayer: game.multiplayer || true,
        coop: game.coop || false,
        online: game.online || true,
        local_coop: game.local_coop || true,
        cross_platform: game.cross_platform || false,
        system_requirements: game.system_requirements || {
          minimum: {
            os: 'Windows 10 64-bit',
            processor: 'Intel Core i5-8400 / AMD Ryzen 5 2600',
            memory: '8 GB RAM',
            graphics: 'NVIDIA GTX 1060 / AMD RX 580',
            storage: '50 GB available space',
          },
          recommended: {
            os: 'Windows 11 64-bit',
            processor: 'Intel Core i7-10700K / AMD Ryzen 7 3700X',
            memory: '16 GB RAM',
            graphics: 'NVIDIA RTX 3070 / AMD RX 6700 XT',
            storage: '50 GB available space (SSD recommended)',
          },
        },
        steam_url: game.steam_url,
        epic_url: game.epic_url,
        gog_url: game.gog_url,
        playstation_url: game.playstation_url,
        xbox_url: game.xbox_url,
        nintendo_url: game.nintendo_url,
        official_website: game.official_website,
        trailer_url: game.trailer_url,
        screenshots: game.screenshots || [],
        tags: game.tags || [
          'Single-player',
          'Multiplayer',
          'Co-op',
          'Online Co-Op',
          'Steam Achievements',
        ],
        languages: game.languages || [
          'English',
          'Spanish',
          'French',
          'German',
          'Japanese',
        ],
        price: game.price || {
          steam: 59.99,
          epic: 59.99,
          playstation: 69.99,
          xbox: 69.99,
          nintendo: 59.99,
        },
      });
    } catch (error) {
      console.error('Error fetching game details:', error);
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

  const handleOpenStore = platform => {
    HapticPatterns.buttonPress();
    let url = '';

    switch (platform) {
      case 'steam':
        url =
          gameDetails.steam_url ||
          `https://store.steampowered.com/search/?term=${encodeURIComponent(gameDetails.title)}`;
        break;
      case 'epic':
        url =
          gameDetails.epic_url ||
          `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(gameDetails.title)}`;
        break;
      case 'gog':
        url =
          gameDetails.gog_url ||
          `https://www.gog.com/games?search=${encodeURIComponent(gameDetails.title)}`;
        break;
      case 'playstation':
        url =
          gameDetails.playstation_url ||
          `https://store.playstation.com/en-us/search/${encodeURIComponent(gameDetails.title)}`;
        break;
      case 'xbox':
        url =
          gameDetails.xbox_url ||
          `https://www.xbox.com/en-us/games/store/search?q=${encodeURIComponent(gameDetails.title)}`;
        break;
      case 'nintendo':
        url =
          gameDetails.nintendo_url ||
          `https://www.nintendo.com/us/search/?q=${encodeURIComponent(gameDetails.title)}`;
        break;
      case 'website':
        url =
          gameDetails.official_website ||
          `https://www.google.com/search?q=${encodeURIComponent(gameDetails.title + ' official website')}`;
        break;
      case 'trailer':
        url =
          gameDetails.trailer_url ||
          `https://www.youtube.com/results?search_query=${encodeURIComponent(gameDetails.title + ' trailer')}`;
        break;
      default:
        return;
    }

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', `Could not open ${platform}`);
    });
  };

  const getScoreColor = score => {
    if (score >= 80) {return Colors.success;}
    if (score >= 60) {return Colors.warning;}
    return Colors.error;
  };

  const getESRBColor = rating => {
    switch (rating) {
      case 'E':
        return Colors.success;
      case 'E10+':
        return Colors.primary;
      case 'T':
        return Colors.warning;
      case 'M':
        return Colors.error;
      case 'AO':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const formatPlaytime = hours => {
    if (hours < 1) {return 'Less than 1 hour';}
    if (hours === 1) {return '1 hour';}
    return `${hours} hours`;
  };

  const renderPlatform = ({ item }) => (
    <View style={styles.platformTag}>
      <Text style={styles.platformText}>{item}</Text>
    </View>
  );

  const renderGenre = ({ item }) => (
    <View style={styles.genreTag}>
      <Text style={styles.genreText}>{item}</Text>
    </View>
  );

  const renderTag = ({ item }) => (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{item}</Text>
    </View>
  );

  const renderLanguage = ({ item }) => (
    <View style={styles.languageTag}>
      <Text style={styles.languageText}>{item}</Text>
    </View>
  );

  const renderScreenshot = ({ item, index }) => (
    <TouchableOpacity style={styles.screenshotContainer} activeOpacity={0.8}>
      <Image
        source={{ uri: item }}
        style={styles.screenshot}
        resizeMode="cover"
      />
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
          <Text style={styles.headerTitle}>Game Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading game details...</Text>
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
        <Text style={styles.headerTitle}>Game Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Game Cover */}
        <View style={styles.coverContainer}>
          <Image
            source={{
              uri:
                gameDetails.thumbnail ||
                gameDetails.image ||
                'https://via.placeholder.com/300x400?text=Game+Cover',
            }}
            style={styles.gameCover}
            resizeMode="cover"
          />

          {/* Score Badges */}
          <View style={styles.scoreContainer}>
            {gameDetails.metacritic_score && (
              <View
                style={[
                  styles.scoreBadge,
                  {
                    backgroundColor: getScoreColor(
                      gameDetails.metacritic_score,
                    ),
                  },
                ]}
              >
                <Text style={styles.scoreLabel}>MC</Text>
                <Text style={styles.scoreValue}>
                  {gameDetails.metacritic_score}
                </Text>
              </View>
            )}

            {gameDetails.user_score && (
              <View
                style={[
                  styles.scoreBadge,
                  {
                    backgroundColor: getScoreColor(gameDetails.user_score * 10),
                  },
                ]}
              >
                <Feather name="users" size={14} color={Colors.background} />
                <Text style={styles.scoreValue}>{gameDetails.user_score}</Text>
              </View>
            )}
          </View>

          {/* ESRB Rating */}
          {gameDetails.esrb_rating && (
            <View
              style={[
                styles.esrbBadge,
                { backgroundColor: getESRBColor(gameDetails.esrb_rating) },
              ]}
            >
              <Text style={styles.esrbText}>{gameDetails.esrb_rating}</Text>
            </View>
          )}
        </View>

        {/* Game Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.gameTitle}>{gameDetails.title}</Text>

          {gameDetails.subtitle && (
            <Text style={styles.subtitle}>{gameDetails.subtitle}</Text>
          )}

          {/* Developer & Publisher */}
          <View style={styles.developerInfo}>
            {gameDetails.developer && (
              <Text style={styles.developerText}>
                <Text style={styles.label}>Developer: </Text>
                {gameDetails.developer}
              </Text>
            )}
            {gameDetails.publisher && (
              <Text style={styles.publisherText}>
                <Text style={styles.label}>Publisher: </Text>
                {gameDetails.publisher}
              </Text>
            )}
          </View>

          {/* Basic Info */}
          <View style={styles.basicInfo}>
            <View style={styles.infoItem}>
              <Feather name="calendar" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {gameDetails.release_date
                  ? new Date(gameDetails.release_date).getFullYear()
                  : 'TBA'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="clock" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {formatPlaytime(gameDetails.playtime)}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="award" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {gameDetails.achievements_count || 0} achievements
              </Text>
            </View>
          </View>

          {/* Platforms */}
          {gameDetails.platforms && gameDetails.platforms.length > 0 && (
            <View style={styles.platformsContainer}>
              <Text style={styles.sectionLabel}>Platforms</Text>
              <FlatList
                data={gameDetails.platforms}
                renderItem={renderPlatform}
                keyExtractor={(item, index) => `platform-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.platformsList}
              />
            </View>
          )}

          {/* Genres */}
          {gameDetails.genres && gameDetails.genres.length > 0 && (
            <View style={styles.genresContainer}>
              <Text style={styles.sectionLabel}>Genres</Text>
              <FlatList
                data={gameDetails.genres}
                renderItem={renderGenre}
                keyExtractor={(item, index) => `genre-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genresList}
              />
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

          {/* Description */}
          {gameDetails.description && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="file-text" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text style={styles.description}>{gameDetails.description}</Text>
            </View>
          )}

          {/* Game Features */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="settings" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Game Features</Text>
            </View>

            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <Feather
                  name={gameDetails.multiplayer ? 'check-circle' : 'x-circle'}
                  size={20}
                  color={
                    gameDetails.multiplayer ? Colors.success : Colors.error
                  }
                />
                <Text style={styles.featureText}>Multiplayer</Text>
              </View>

              <View style={styles.featureItem}>
                <Feather
                  name={gameDetails.coop ? 'check-circle' : 'x-circle'}
                  size={20}
                  color={gameDetails.coop ? Colors.success : Colors.error}
                />
                <Text style={styles.featureText}>Co-op</Text>
              </View>

              <View style={styles.featureItem}>
                <Feather
                  name={gameDetails.online ? 'check-circle' : 'x-circle'}
                  size={20}
                  color={gameDetails.online ? Colors.success : Colors.error}
                />
                <Text style={styles.featureText}>Online</Text>
              </View>

              <View style={styles.featureItem}>
                <Feather
                  name={gameDetails.local_coop ? 'check-circle' : 'x-circle'}
                  size={20}
                  color={gameDetails.local_coop ? Colors.success : Colors.error}
                />
                <Text style={styles.featureText}>Local Co-op</Text>
              </View>

              <View style={styles.featureItem}>
                <Feather
                  name={
                    gameDetails.cross_platform ? 'check-circle' : 'x-circle'
                  }
                  size={20}
                  color={
                    gameDetails.cross_platform ? Colors.success : Colors.error
                  }
                />
                <Text style={styles.featureText}>Cross-platform</Text>
              </View>
            </View>
          </View>

          {/* Tags */}
          {gameDetails.tags && gameDetails.tags.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="tag" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Tags</Text>
              </View>
              <FlatList
                data={gameDetails.tags}
                renderItem={renderTag}
                keyExtractor={(item, index) => `tag-${index}`}
                numColumns={2}
                scrollEnabled={false}
                contentContainerStyle={styles.tagsList}
              />
            </View>
          )}

          {/* System Requirements */}
          {gameDetails.system_requirements && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="monitor" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>System Requirements</Text>
              </View>

              <View style={styles.requirementsContainer}>
                <View style={styles.requirementSection}>
                  <Text style={styles.requirementTitle}>Minimum</Text>
                  <View style={styles.requirementDetails}>
                    <Text style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>OS: </Text>
                      {gameDetails.system_requirements.minimum.os}
                    </Text>
                    <Text style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>Processor: </Text>
                      {gameDetails.system_requirements.minimum.processor}
                    </Text>
                    <Text style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>Memory: </Text>
                      {gameDetails.system_requirements.minimum.memory}
                    </Text>
                    <Text style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>Graphics: </Text>
                      {gameDetails.system_requirements.minimum.graphics}
                    </Text>
                    <Text style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>Storage: </Text>
                      {gameDetails.system_requirements.minimum.storage}
                    </Text>
                  </View>
                </View>

                <View style={styles.requirementSection}>
                  <Text style={styles.requirementTitle}>Recommended</Text>
                  <View style={styles.requirementDetails}>
                    <Text style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>OS: </Text>
                      {gameDetails.system_requirements.recommended.os}
                    </Text>
                    <Text style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>Processor: </Text>
                      {gameDetails.system_requirements.recommended.processor}
                    </Text>
                    <Text style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>Memory: </Text>
                      {gameDetails.system_requirements.recommended.memory}
                    </Text>
                    <Text style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>Graphics: </Text>
                      {gameDetails.system_requirements.recommended.graphics}
                    </Text>
                    <Text style={styles.requirementItem}>
                      <Text style={styles.requirementLabel}>Storage: </Text>
                      {gameDetails.system_requirements.recommended.storage}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Languages */}
          {gameDetails.languages && gameDetails.languages.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="globe" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Supported Languages</Text>
              </View>
              <FlatList
                data={gameDetails.languages}
                renderItem={renderLanguage}
                keyExtractor={(item, index) => `language-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.languagesList}
              />
            </View>
          )}

          {/* Screenshots */}
          {gameDetails.screenshots && gameDetails.screenshots.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="image" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Screenshots</Text>
              </View>
              <FlatList
                data={gameDetails.screenshots}
                renderItem={renderScreenshot}
                keyExtractor={(item, index) => `screenshot-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.screenshotsList}
              />
            </View>
          )}

          {/* Store Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="shopping-cart" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Available On</Text>
            </View>

            <View style={styles.storeLinks}>
              <TouchableOpacity
                style={styles.storeItem}
                onPress={() => handleOpenStore('steam')}
              >
                <View style={styles.storeInfo}>
                  <View
                    style={[styles.storeIcon, { backgroundColor: '#1b2838' }]}
                  >
                    <Feather
                      name="monitor"
                      size={20}
                      color={Colors.background}
                    />
                  </View>
                  <View style={styles.storeDetails}>
                    <Text style={styles.storeName}>Steam</Text>
                    {gameDetails.price?.steam && (
                      <Text style={styles.storePrice}>
                        ${gameDetails.price.steam}
                      </Text>
                    )}
                  </View>
                </View>
                <Feather
                  name="external-link"
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storeItem}
                onPress={() => handleOpenStore('epic')}
              >
                <View style={styles.storeInfo}>
                  <View
                    style={[styles.storeIcon, { backgroundColor: '#000000' }]}
                  >
                    <Feather name="zap" size={20} color={Colors.background} />
                  </View>
                  <View style={styles.storeDetails}>
                    <Text style={styles.storeName}>Epic Games</Text>
                    {gameDetails.price?.epic && (
                      <Text style={styles.storePrice}>
                        ${gameDetails.price.epic}
                      </Text>
                    )}
                  </View>
                </View>
                <Feather
                  name="external-link"
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storeItem}
                onPress={() => handleOpenStore('playstation')}
              >
                <View style={styles.storeInfo}>
                  <View
                    style={[styles.storeIcon, { backgroundColor: '#003791' }]}
                  >
                    <Feather name="play" size={20} color={Colors.background} />
                  </View>
                  <View style={styles.storeDetails}>
                    <Text style={styles.storeName}>PlayStation</Text>
                    {gameDetails.price?.playstation && (
                      <Text style={styles.storePrice}>
                        ${gameDetails.price.playstation}
                      </Text>
                    )}
                  </View>
                </View>
                <Feather
                  name="external-link"
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storeItem}
                onPress={() => handleOpenStore('xbox')}
              >
                <View style={styles.storeInfo}>
                  <View
                    style={[styles.storeIcon, { backgroundColor: '#107c10' }]}
                  >
                    <Feather name="box" size={20} color={Colors.background} />
                  </View>
                  <View style={styles.storeDetails}>
                    <Text style={styles.storeName}>Xbox</Text>
                    {gameDetails.price?.xbox && (
                      <Text style={styles.storePrice}>
                        ${gameDetails.price.xbox}
                      </Text>
                    )}
                  </View>
                </View>
                <Feather
                  name="external-link"
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storeItem}
                onPress={() => handleOpenStore('nintendo')}
              >
                <View style={styles.storeInfo}>
                  <View
                    style={[styles.storeIcon, { backgroundColor: '#e60012' }]}
                  >
                    <Feather
                      name="gamepad-2"
                      size={20}
                      color={Colors.background}
                    />
                  </View>
                  <View style={styles.storeDetails}>
                    <Text style={styles.storeName}>Nintendo</Text>
                    {gameDetails.price?.nintendo && (
                      <Text style={styles.storePrice}>
                        ${gameDetails.price.nintendo}
                      </Text>
                    )}
                  </View>
                </View>
                <Feather
                  name="external-link"
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* External Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="external-link" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>External Links</Text>
            </View>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleOpenStore('website')}
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

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleOpenStore('trailer')}
            >
              <View style={styles.linkInfo}>
                <View style={styles.trailerIcon}>
                  <Feather name="play" size={20} color={Colors.error} />
                </View>
                <Text style={styles.linkText}>Watch Trailer</Text>
              </View>
              <Feather
                name="external-link"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddToListModal
        visible={showAddToList}
        onClose={() => setShowAddToList(false)}
        item={gameDetails}
        itemType="game"
      />

      <WhoAddedModal
        visible={showWhoAdded}
        onClose={() => setShowWhoAdded(false)}
        item={gameDetails}
        itemType="game"
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
  coverContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.large,
    backgroundColor: Colors.backgroundSecondary,
    position: 'relative',
  },
  gameCover: {
    width: 200,
    height: 280,
    borderRadius: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scoreContainer: {
    position: 'absolute',
    top: Spacing.large + 10,
    right: '50%',
    marginRight: -100 + 10,
    flexDirection: 'column',
    gap: Spacing.small,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 16,
    gap: 4,
  },
  scoreLabel: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  scoreValue: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  esrbBadge: {
    position: 'absolute',
    top: Spacing.large + 10,
    left: '50%',
    marginLeft: -100 + 10,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 16,
  },
  esrbText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  infoContainer: {
    padding: Spacing.medium,
  },
  gameTitle: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regularItalic,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.medium,
  },
  developerInfo: {
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  developerText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  publisherText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  label: {
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
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
  platformsContainer: {
    marginBottom: Spacing.medium,
  },
  genresContainer: {
    marginBottom: Spacing.large,
  },
  sectionLabel: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  platformsList: {
    paddingHorizontal: Spacing.medium,
  },
  genresList: {
    paddingHorizontal: Spacing.medium,
  },
  platformTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    marginHorizontal: Spacing.tiny,
  },
  platformText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  genreTag: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    marginHorizontal: Spacing.tiny,
  },
  genreText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.success,
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
  description: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.medium,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    gap: Spacing.small,
    minWidth: '45%',
  },
  featureText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  tagsList: {
    paddingHorizontal: Spacing.medium,
  },
  tag: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 16,
    margin: Spacing.tiny,
    flex: 1,
    alignItems: 'center',
  },
  tagText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.warning,
  },
  requirementsContainer: {
    gap: Spacing.large,
  },
  requirementSection: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.medium,
    borderRadius: 12,
  },
  requirementTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
  },
  requirementDetails: {
    gap: Spacing.small,
  },
  requirementItem: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  requirementLabel: {
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  languagesList: {
    paddingHorizontal: Spacing.medium,
  },
  languageTag: {
    backgroundColor: Colors.textSecondary + '20',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    marginHorizontal: Spacing.tiny,
  },
  languageText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  screenshotsList: {
    paddingHorizontal: Spacing.medium,
  },
  screenshotContainer: {
    marginHorizontal: Spacing.small,
  },
  screenshot: {
    width: 200,
    height: 120,
    borderRadius: 8,
  },
  storeLinks: {
    gap: Spacing.small,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  storePrice: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
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
  websiteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  trailerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.error + '20',
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

export default GameDetailsScreen;
