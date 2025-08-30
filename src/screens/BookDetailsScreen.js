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

const BookDetailsScreen = ({ route, navigation }) => {
  const { book } = route.params;
  const [bookDetails, setBookDetails] = useState(book);
  const [loading, setLoading] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showWhoAdded, setShowWhoAdded] = useState(false);

  useEffect(() => {
    if (book && !book.page_count) {
      fetchBookDetails();
    }
  }, [book]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you would use Google Books API here
      // For now, we'll enhance the basic book data
      setBookDetails({
        ...book,
        page_count: book.page_count || 320,
        published_date: book.published_date || '2023-01-15',
        publisher: book.publisher || 'Penguin Random House',
        language: book.language || 'en',
        isbn_10: book.isbn_10 || '1234567890',
        isbn_13: book.isbn_13 || '9781234567890',
        categories: book.categories || ['Fiction', 'Mystery', 'Thriller'],
        authors: book.authors || ['Author Name'],
        average_rating: book.average_rating || 4.2,
        ratings_count: book.ratings_count || 1250,
        maturity_rating: book.maturity_rating || 'NOT_MATURE',
        print_type: book.print_type || 'BOOK',
        content_version: book.content_version || 'preview-1.0.0',
        preview_link: book.preview_link,
        info_link: book.info_link,
        canonical_volume_link: book.canonical_volume_link,
        retail_price: book.retail_price || {
          amount: 12.99,
          currency_code: 'USD',
        },
        buy_link: book.buy_link,
        series_info: book.series_info,
        dimensions: book.dimensions || {
          height: '8.0 inches',
          width: '5.2 inches',
          thickness: '1.1 inches',
        },
        main_category: book.main_category || 'Fiction',
      });
    } catch (error) {
      console.error('Error fetching book details:', error);
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

  const handleOpenGoogleBooks = () => {
    HapticPatterns.buttonPress();
    const googleBooksUrl =
      bookDetails.info_link ||
      `https://books.google.com/books?q=${encodeURIComponent(bookDetails.title + ' ' + (bookDetails.authors?.[0] || ''))}`;
    Linking.openURL(googleBooksUrl).catch(() => {
      Alert.alert('Error', 'Could not open Google Books');
    });
  };

  const handleOpenPreview = () => {
    if (bookDetails.preview_link) {
      HapticPatterns.buttonPress();
      Linking.openURL(bookDetails.preview_link).catch(() => {
        Alert.alert('Error', 'Could not open preview');
      });
    }
  };

  const handleBuyBook = () => {
    if (bookDetails.buy_link) {
      HapticPatterns.buttonPress();
      Linking.openURL(bookDetails.buy_link).catch(() => {
        Alert.alert('Error', 'Could not open purchase link');
      });
    }
  };

  const formatPrice = priceInfo => {
    if (!priceInfo || !priceInfo.amount) {return 'Price not available';}
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: priceInfo.currency_code || 'USD',
    }).format(priceInfo.amount);
  };

  const getRatingColor = rating => {
    if (rating >= 4) {return Colors.success;}
    if (rating >= 3) {return Colors.warning;}
    return Colors.error;
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

  const renderAuthor = ({ item }) => (
    <TouchableOpacity style={styles.authorItem} activeOpacity={0.7}>
      <View style={styles.authorIcon}>
        <Feather name="user" size={20} color={Colors.primary} />
      </View>
      <Text style={styles.authorName}>{item}</Text>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => (
    <View style={styles.categoryTag}>
      <Text style={styles.categoryText}>{item}</Text>
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
          <Text style={styles.headerTitle}>Book Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading book details...</Text>
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
        <Text style={styles.headerTitle}>Book Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Book Cover */}
        <View style={styles.coverContainer}>
          <Image
            source={{
              uri:
                bookDetails.thumbnail ||
                bookDetails.image ||
                'https://via.placeholder.com/300x450?text=Book+Cover',
            }}
            style={styles.bookCover}
            resizeMode="cover"
          />

          {/* Rating Badge */}
          {bookDetails.average_rating && (
            <View
              style={[
                styles.ratingBadge,
                { backgroundColor: getRatingColor(bookDetails.average_rating) },
              ]}
            >
              <Feather name="star" size={16} color={Colors.background} />
              <Text style={styles.ratingText}>
                {bookDetails.average_rating.toFixed(1)}
              </Text>
            </View>
          )}

          {/* Price Badge */}
          {bookDetails.retail_price && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>
                {formatPrice(bookDetails.retail_price)}
              </Text>
            </View>
          )}
        </View>

        {/* Book Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.bookTitle}>{bookDetails.title}</Text>

          {bookDetails.subtitle && (
            <Text style={styles.subtitle}>{bookDetails.subtitle}</Text>
          )}

          {/* Authors */}
          {bookDetails.authors && bookDetails.authors.length > 0 && (
            <View style={styles.authorsSection}>
              <Text style={styles.authorsLabel}>by</Text>
              <FlatList
                data={bookDetails.authors}
                renderItem={renderAuthor}
                keyExtractor={(item, index) => `author-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.authorsList}
              />
            </View>
          )}

          {/* Basic Info */}
          <View style={styles.basicInfo}>
            <View style={styles.infoItem}>
              <Feather name="calendar" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {bookDetails.published_date
                  ? new Date(bookDetails.published_date).getFullYear()
                  : 'Unknown'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Feather
                name="book-open"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.infoText}>
                {bookDetails.page_count || 'Unknown'} pages
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="users" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {bookDetails.ratings_count || 0} ratings
              </Text>
            </View>
          </View>

          {/* Categories */}
          {bookDetails.categories && bookDetails.categories.length > 0 && (
            <View style={styles.categoriesContainer}>
              <FlatList
                data={bookDetails.categories}
                renderItem={renderCategory}
                keyExtractor={(item, index) => `category-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
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
          {bookDetails.description && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="file-text" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text style={styles.description}>{bookDetails.description}</Text>
            </View>
          )}

          {/* Book Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Book Details</Text>
            </View>

            <View style={styles.detailsInfo}>
              {bookDetails.publisher && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Publisher</Text>
                  <Text style={styles.detailValue}>
                    {bookDetails.publisher}
                  </Text>
                </View>
              )}

              {bookDetails.published_date && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Published Date</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(bookDetails.published_date)}
                  </Text>
                </View>
              )}

              {bookDetails.language && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Language</Text>
                  <Text style={styles.detailValue}>
                    {bookDetails.language.toUpperCase()}
                  </Text>
                </View>
              )}

              {bookDetails.print_type && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Format</Text>
                  <Text style={styles.detailValue}>
                    {bookDetails.print_type}
                  </Text>
                </View>
              )}

              {bookDetails.maturity_rating && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Maturity Rating</Text>
                  <Text style={styles.detailValue}>
                    {bookDetails.maturity_rating === 'NOT_MATURE'
                      ? 'All Ages'
                      : 'Mature'}
                  </Text>
                </View>
              )}

              {bookDetails.isbn_13 && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ISBN-13</Text>
                  <Text style={styles.detailValue}>{bookDetails.isbn_13}</Text>
                </View>
              )}

              {bookDetails.isbn_10 && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ISBN-10</Text>
                  <Text style={styles.detailValue}>{bookDetails.isbn_10}</Text>
                </View>
              )}

              {bookDetails.dimensions && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Dimensions</Text>
                  <Text style={styles.detailValue}>
                    {`${bookDetails.dimensions.height} × ${bookDetails.dimensions.width} × ${bookDetails.dimensions.thickness}`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Series Information */}
          {bookDetails.series_info && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="layers" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Series Information</Text>
              </View>
              <View style={styles.seriesInfo}>
                <Text style={styles.seriesTitle}>
                  {bookDetails.series_info.title}
                </Text>
                <Text style={styles.seriesVolume}>
                  Volume {bookDetails.series_info.volume}
                </Text>
              </View>
            </View>
          )}

          {/* External Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="external-link" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>External Links</Text>
            </View>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={handleOpenGoogleBooks}
            >
              <View style={styles.linkInfo}>
                <View style={styles.googleBooksIcon}>
                  <Feather name="book" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.linkText}>View on Google Books</Text>
              </View>
              <Feather
                name="external-link"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {bookDetails.preview_link && (
              <TouchableOpacity
                style={styles.linkItem}
                onPress={handleOpenPreview}
              >
                <View style={styles.linkInfo}>
                  <View style={styles.previewIcon}>
                    <Feather name="eye" size={20} color={Colors.success} />
                  </View>
                  <Text style={styles.linkText}>Preview Book</Text>
                </View>
                <Feather
                  name="external-link"
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            )}

            {bookDetails.buy_link && (
              <TouchableOpacity style={styles.linkItem} onPress={handleBuyBook}>
                <View style={styles.linkInfo}>
                  <View style={styles.buyIcon}>
                    <Feather
                      name="shopping-cart"
                      size={20}
                      color={Colors.warning}
                    />
                  </View>
                  <Text style={styles.linkText}>Buy Book</Text>
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
        item={bookDetails}
        itemType="book"
      />

      <WhoAddedModal
        visible={showWhoAdded}
        onClose={() => setShowWhoAdded(false)}
        item={bookDetails}
        itemType="book"
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
  bookCover: {
    width: 180,
    height: 270,
    borderRadius: 8,
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
    marginRight: -90 + 10,
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
  priceBadge: {
    position: 'absolute',
    top: Spacing.large + 10,
    left: '50%',
    marginLeft: -90 + 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 16,
  },
  priceText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
  infoContainer: {
    padding: Spacing.medium,
  },
  bookTitle: {
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
  authorsSection: {
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  authorsLabel: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regularItalic,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  authorsList: {
    paddingHorizontal: Spacing.medium,
  },
  authorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    marginHorizontal: Spacing.tiny,
  },
  authorIcon: {
    marginRight: Spacing.small,
  },
  authorName: {
    fontSize: FontSize.regular,
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
  categoriesContainer: {
    marginBottom: Spacing.large,
  },
  categoriesList: {
    paddingHorizontal: Spacing.medium,
  },
  categoryTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    marginHorizontal: Spacing.tiny,
  },
  categoryText: {
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
  description: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  detailsInfo: {
    gap: Spacing.medium,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    flex: 2,
    textAlign: 'right',
  },
  seriesInfo: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.medium,
    borderRadius: 12,
    alignItems: 'center',
  },
  seriesTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  seriesVolume: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
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
  googleBooksIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  buyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.warning + '20',
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

export default BookDetailsScreen;
