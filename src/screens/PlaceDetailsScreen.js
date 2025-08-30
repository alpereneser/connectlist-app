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

const PlaceDetailsScreen = ({ route, navigation }) => {
  const { place } = route.params;
  const [placeDetails, setPlaceDetails] = useState(place);
  const [loading, setLoading] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showWhoAdded, setShowWhoAdded] = useState(false);

  useEffect(() => {
    if (place && !place.formatted_address) {
      fetchPlaceDetails();
    }
  }, [place]);

  const fetchPlaceDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you would use Google Places API here
      // For now, we'll use the basic place data
      setPlaceDetails({
        ...place,
        formatted_address: place.address || 'Address not available',
        rating: place.rating || 4.2,
        user_ratings_total: place.user_ratings_total || 156,
        opening_hours: place.opening_hours || {
          open_now: true,
          weekday_text: [
            'Monday: 9:00 AM – 6:00 PM',
            'Tuesday: 9:00 AM – 6:00 PM',
            'Wednesday: 9:00 AM – 6:00 PM',
            'Thursday: 9:00 AM – 6:00 PM',
            'Friday: 9:00 AM – 8:00 PM',
            'Saturday: 10:00 AM – 8:00 PM',
            'Sunday: 10:00 AM – 6:00 PM',
          ],
        },
        photos: place.photos || [
          {
            photo_reference:
              place.image ||
              'https://via.placeholder.com/400x300?text=Place+Image',
          },
        ],
        types: place.types || ['establishment', 'point_of_interest'],
        website: place.website,
        formatted_phone_number: place.phone,
        price_level: place.price_level || 2,
      });
    } catch (error) {
      console.error('Error fetching place details:', error);
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

  const handleOpenMaps = () => {
    HapticPatterns.buttonPress();
    const address = encodeURIComponent(
      placeDetails.formatted_address || placeDetails.name,
    );
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps');
    });
  };

  const handleCall = () => {
    if (placeDetails.formatted_phone_number) {
      HapticPatterns.buttonPress();
      const phoneNumber = placeDetails.formatted_phone_number.replace(
        /[^0-9+]/g,
        '',
      );
      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        Alert.alert('Error', 'Could not make phone call');
      });
    }
  };

  const handleWebsite = () => {
    if (placeDetails.website) {
      HapticPatterns.buttonPress();
      Linking.openURL(placeDetails.website).catch(() => {
        Alert.alert('Error', 'Could not open website');
      });
    }
  };

  const renderStars = rating => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Feather
          key={i}
          name="star"
          size={16}
          color={Colors.warning}
          style={{ marginRight: 2 }}
        />,
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Feather
          key="half"
          name="star"
          size={16}
          color={Colors.textSecondary}
          style={{ marginRight: 2 }}
        />,
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Feather
          key={`empty-${i}`}
          name="star"
          size={16}
          color={Colors.textSecondary}
          style={{ marginRight: 2 }}
        />,
      );
    }

    return stars;
  };

  const getPriceLevel = level => {
    if (!level) {return 'Price not available';}
    return '$'.repeat(level) + '·'.repeat(4 - level);
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
          <Text style={styles.headerTitle}>Place Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading place details...</Text>
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
        <Text style={styles.headerTitle}>Place Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Place Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                placeDetails.photos?.[0]?.photo_reference ||
                placeDetails.image ||
                'https://via.placeholder.com/400x300?text=Place+Image',
            }}
            style={styles.placeImage}
            resizeMode="cover"
          />
        </View>

        {/* Place Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.placeName}>{placeDetails.name}</Text>

          {/* Rating */}
          {placeDetails.rating && (
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStars(placeDetails.rating)}
              </View>
              <Text style={styles.ratingText}>
                {placeDetails.rating.toFixed(1)} (
                {placeDetails.user_ratings_total || 0} reviews)
              </Text>
            </View>
          )}

          {/* Price Level */}
          {placeDetails.price_level && (
            <Text style={styles.priceLevel}>
              {getPriceLevel(placeDetails.price_level)}
            </Text>
          )}

          {/* Types */}
          {placeDetails.types && (
            <View style={styles.typesContainer}>
              {placeDetails.types.slice(0, 3).map((type, index) => (
                <View key={index} style={styles.typeTag}>
                  <Text style={styles.typeText}>
                    {type
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
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

          {/* Address */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="map-pin" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Address</Text>
            </View>
            <Text style={styles.address}>{placeDetails.formatted_address}</Text>
            <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
              <Text style={styles.mapButtonText}>Open in Maps</Text>
              <Feather name="external-link" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Contact Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="phone" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Contact</Text>
            </View>

            {placeDetails.formatted_phone_number && (
              <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
                <Text style={styles.contactText}>
                  {placeDetails.formatted_phone_number}
                </Text>
                <Feather name="phone" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}

            {placeDetails.website && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={handleWebsite}
              >
                <Text style={styles.contactText}>Visit Website</Text>
                <Feather
                  name="external-link"
                  size={16}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Opening Hours */}
          {placeDetails.opening_hours && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="clock" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Hours</Text>
                {placeDetails.opening_hours.open_now !== undefined && (
                  <View
                    style={[
                      styles.statusBadge,
                      placeDetails.opening_hours.open_now
                        ? styles.openBadge
                        : styles.closedBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        placeDetails.opening_hours.open_now
                          ? styles.openText
                          : styles.closedText,
                      ]}
                    >
                      {placeDetails.opening_hours.open_now ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                )}
              </View>

              {placeDetails.opening_hours.weekday_text && (
                <View style={styles.hoursContainer}>
                  {placeDetails.opening_hours.weekday_text.map(
                    (hours, index) => (
                      <Text key={index} style={styles.hoursText}>
                        {hours}
                      </Text>
                    ),
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <AddToListModal
        visible={showAddToList}
        onClose={() => setShowAddToList(false)}
        item={placeDetails}
        itemType="place"
      />

      <WhoAddedModal
        visible={showWhoAdded}
        onClose={() => setShowWhoAdded(false)}
        item={placeDetails}
        itemType="place"
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
    height: 250,
    backgroundColor: Colors.backgroundSecondary,
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: Spacing.medium,
  },
  placeName: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: Spacing.small,
  },
  ratingText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  priceLevel: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.success,
    marginBottom: Spacing.small,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.medium,
  },
  typeTag: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 16,
    marginRight: Spacing.small,
    marginBottom: Spacing.tiny,
  },
  typeText: {
    fontSize: FontSize.tiny,
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
  section: {
    marginBottom: Spacing.large,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  sectionTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginLeft: Spacing.small,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: Colors.success + '20',
  },
  closedBadge: {
    backgroundColor: Colors.error + '20',
  },
  statusText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.semiBold,
  },
  openText: {
    color: Colors.success,
  },
  closedText: {
    color: Colors.error,
  },
  address: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.small,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  mapButtonText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
  },
  hoursContainer: {
    gap: Spacing.tiny,
  },
  hoursText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default PlaceDetailsScreen;
