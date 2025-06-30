import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  MagnifyingGlass, 
  Plus, 
  Check, 
  Lock, 
  Globe, 
  Users,
  X,
  ArrowLeft,
  ArrowRight
} from 'phosphor-react-native';
import Header from '../components/Header';
import BottomMenu from '../components/BottomMenu';
import { useAuth } from '../contexts/AuthContext';
import { tmdbService } from '../services/tmdbService';
import { rawgService } from '../services/rawgService';
import { googleBooksService } from '../services/googleBooksService';
import { youtubeService } from '../services/youtubeService';
import { yandexService } from '../services/yandexService';
import tokens from '../utils/designTokens';

const CreateListScreen = ({ route, navigation }) => {
  const { category, existingListId } = route.params || {};
  const { user, userProfile, supabase } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchCache, setSearchCache] = useState({});
  
  // Step 2 - List Selection/Creation
  const [existingLists, setExistingLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [createNewList, setCreateNewList] = useState(true);
  
  // Step 3 - Privacy Settings
  const [privacy, setPrivacy] = useState('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowCollaboration, setAllowCollaboration] = useState(false);

  useEffect(() => {
    // Load existing lists for step 2
    loadExistingLists();
    
    // If existingListId is provided, skip to step 1 (content selection)
    if (existingListId) {
      setCreateNewList(false);
      // Find and select the existing list
      const existingList = existingLists.find(list => list.id === existingListId);
      if (existingList) {
        setSelectedList(existingList);
      }
    }
  }, [user, existingListId, existingLists]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, category?.id]);

  const loadExistingLists = async () => {
    if (!user) {
      setExistingLists([]);
      return;
    }

    try {
      const { data, error } = await supabase.lists.getUserLists(user.id, 0, 50);
      
      if (error) {
        console.error('Error loading existing lists:', error);
        setExistingLists([]);
        return;
      }

      setExistingLists(data || []);
    } catch (error) {
      console.error('Error in loadExistingLists:', error);
      setExistingLists([]);
    }
  };

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const cacheKey = `${category?.id}-${query.toLowerCase()}`;
    
    // Check cache first
    if (searchCache[cacheKey]) {
      setSearchResults(searchCache[cacheKey]);
      return;
    }

    setIsLoading(true);
    try {
      let apiResults = { results: [], total_results: 0 };
      
      // Call appropriate API based on category
      switch (category?.id) {
        case 'movie':
          try {
            apiResults = await tmdbService.searchMovies(query);
            console.log('Movies API result:', apiResults);
          } catch (error) {
            console.error('Movie search error:', error);
            apiResults = { results: generateMockResults('movie', query), total_results: 5 };
          }
          break;
        case 'tv':
          try {
            apiResults = await tmdbService.searchTVShows(query);
            console.log('TV Shows API result:', apiResults);
          } catch (error) {
            console.error('TV search error:', error);
            apiResults = { results: generateMockResults('tv', query), total_results: 5 };
          }
          break;
        case 'person':
          try {
            apiResults = await tmdbService.searchPeople(query);
            console.log('People API result:', apiResults);
          } catch (error) {
            console.error('People search error:', error);
            apiResults = { results: generateMockResults('person', query), total_results: 5 };
          }
          break;
        case 'game':
          try {
            apiResults = await rawgService.searchGames(query);
            console.log('Games API result:', apiResults);
          } catch (error) {
            console.error('Game search error:', error);
            apiResults = { results: generateMockResults('game', query), total_results: 5 };
          }
          break;
        case 'book':
          try {
            apiResults = await googleBooksService.searchBooks(query);
            console.log('Books API result:', apiResults);
          } catch (error) {
            console.error('Book search error:', error);
            apiResults = { results: generateMockResults('book', query), total_results: 5 };
          }
          break;
        case 'video':
          try {
            // Handle YouTube links for videos
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
              const videoData = await youtubeService.getVideoFromUrl(query);
              apiResults = { results: [videoData], total_results: 1 };
            } else {
              // Search YouTube videos by query
              apiResults = await youtubeService.searchVideos(query);
            }
            console.log('Video API result:', apiResults);
          } catch (error) {
            console.error('Video search error:', error);
            apiResults = { results: generateMockResults('video', query), total_results: 5 };
          }
          break;
        case 'place':
          try {
            const placesData = await yandexService.searchPlaces(query);
            apiResults = { 
              results: placesData.features || [], 
              total_results: placesData.total_results || 0 
            };
            console.log('Places API result:', apiResults);
          } catch (error) {
            console.error('Place search error:', error);
            apiResults = { results: generateMockResults('place', query), total_results: 5 };
          }
          break;
        case 'music':
          try {
            // Implement music search - for now use mock data
            apiResults = { results: generateMockResults('music', query), total_results: 5 };
            console.log('Music mock result:', apiResults);
          } catch (error) {
            console.error('Music search error:', error);
            apiResults = { results: generateMockResults('music', query), total_results: 5 };
          }
          break;
        case 'poetry':
          try {
            // Implement poetry search - for now use mock data
            apiResults = { results: generateMockResults('poetry', query), total_results: 5 };
            console.log('Poetry mock result:', apiResults);
          } catch (error) {
            console.error('Poetry search error:', error);
            apiResults = { results: generateMockResults('poetry', query), total_results: 5 };
          }
          break;
        default:
          // Fallback to mock data for unknown categories
          console.log('Using mock data for category:', category?.id);
          apiResults = { results: generateMockResults(category?.id, query), total_results: 5 };
      }

      // Cache the results
      setSearchCache(prev => ({
        ...prev,
        [cacheKey]: apiResults.results
      }));
      
      setSearchResults(apiResults.results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search content. Please try again.');
      // Show empty results on error
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [category?.id, searchCache]);

  const generateMockResults = (categoryId, query) => {
    const baseResults = [];
    const categoryData = {
      movie: {
        titles: ['The Shawshank Redemption', 'The Godfather', 'The Dark Knight', 'Pulp Fiction', 'Schindler\'s List'],
        descriptions: ['Drama about hope and friendship', 'Crime saga of a powerful family', 'Superhero thriller', 'Crime anthology', 'Historical drama'],
        imageBase: 'https://via.placeholder.com/300x450'
      },
      tv: {
        titles: ['Breaking Bad', 'Game of Thrones', 'The Office', 'Friends', 'Stranger Things'],
        descriptions: ['Crime drama series', 'Fantasy epic series', 'Comedy workplace series', 'Sitcom about friends', 'Sci-fi horror series'],
        imageBase: 'https://via.placeholder.com/300x450'
      },
      book: {
        titles: ['To Kill a Mockingbird', '1984', 'Pride and Prejudice', 'The Great Gatsby', 'Harry Potter'],
        descriptions: ['Classic American novel', 'Dystopian fiction', 'Romantic novel', 'American classic', 'Fantasy series'],
        imageBase: 'https://via.placeholder.com/300x450'
      },
      game: {
        titles: ['The Legend of Zelda', 'Super Mario Bros', 'Call of Duty', 'Minecraft', 'Among Us'],
        descriptions: ['Adventure game', 'Platform game', 'First-person shooter', 'Sandbox game', 'Social deduction game'],
        imageBase: 'https://via.placeholder.com/300x400'
      },
      music: {
        titles: ['Bohemian Rhapsody', 'Stairway to Heaven', 'Hotel California', 'Imagine', 'Billie Jean'],
        descriptions: ['Queen - Rock opera', 'Led Zeppelin - Rock ballad', 'Eagles - Rock anthem', 'John Lennon - Peace anthem', 'Michael Jackson - Pop classic'],
        imageBase: 'https://via.placeholder.com/300x300'
      },
      poetry: {
        titles: ['The Road Not Taken', 'If—', 'Do not go gentle', 'Ozymandias', 'The Raven'],
        descriptions: ['Robert Frost - Life choices', 'Rudyard Kipling - Advice', 'Dylan Thomas - Death', 'Percy Shelley - Power', 'Edgar Allan Poe - Dark'],
        imageBase: 'https://via.placeholder.com/300x400'
      },
      place: {
        titles: ['Eiffel Tower', 'Central Park', 'Times Square', 'Golden Gate Bridge', 'Statue of Liberty'],
        descriptions: ['Paris landmark', 'NYC park', 'NYC square', 'San Francisco bridge', 'NYC monument'],
        imageBase: 'https://via.placeholder.com/400x300'
      },
      video: {
        titles: ['How to Code', 'Travel Vlog', 'Cooking Tutorial', 'Music Video', 'Documentary'],
        descriptions: ['Programming tutorial', 'Travel experience', 'Cooking guide', 'Music performance', 'Educational content'],
        imageBase: 'https://via.placeholder.com/480x360'
      },
      person: {
        titles: ['Leonardo DiCaprio', 'Emma Stone', 'Robert Downey Jr.', 'Scarlett Johansson', 'Tom Hanks'],
        descriptions: ['Academy Award winner', 'Acclaimed actress', 'Iron Man actor', 'Versatile actress', 'Beloved actor'],
        imageBase: 'https://via.placeholder.com/300x400'
      }
    };

    const data = categoryData[categoryId] || {
      titles: [`${query} Result 1`, `${query} Result 2`, `${query} Result 3`, `${query} Result 4`, `${query} Result 5`],
      descriptions: ['Sample content', 'Sample content', 'Sample content', 'Sample content', 'Sample content'],
      imageBase: 'https://via.placeholder.com/300x200'
    };

    for (let i = 0; i < 5; i++) {
      baseResults.push({
        id: `${categoryId}-${query}-${i}`,
        title: data.titles[i] || `${query} Result ${i + 1}`,
        description: data.descriptions[i] || `Sample ${categoryId} content for "${query}"`,
        image_url: data.imageBase,
        external_data: { 
          category: categoryId,
          query: query,
          mockData: true 
        },
      });
    }
    return baseResults;
  };

  const toggleItemSelection = (item) => {
    const isSelected = selectedItems.find(selected => selected.id === item.id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (selectedItems.length === 0) {
        Alert.alert('Selection Required', 'Please select at least one item to continue.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (createNewList && (!listName.trim() || !listDescription.trim())) {
        Alert.alert('Information Required', 'Please enter list name and description.');
        return;
      }
      if (!createNewList && !selectedList) {
        Alert.alert('Selection Required', 'Please select an existing list.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handleCreateList();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCreateList = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a list');
      return;
    }

    try {
      setIsLoading(true);

      let targetListId;

      if (createNewList) {
        // Get category ID from database
        const { data: categoryData, error: categoryError } = await supabase.categories.getByName(category?.id);
        
        if (categoryError || !categoryData) {
          console.error('Category error:', categoryError);
          Alert.alert('Error', 'Categories need to be added to Supabase database first. Please add categories using SQL.');
          return;
        }
        // Create new list
        const listData = {
          creator_id: user.id,
          category_id: categoryData.id,
          title: listName.trim(),
          description: listDescription.trim(),
          privacy,
          allow_comments: allowComments,
          allow_collaboration: allowCollaboration,
          item_count: selectedItems.length,
        };

        const { data: newList, error: listError } = await supabase.lists.createList(listData);
        
        if (listError) {
          console.error('Create list error:', listError);
          Alert.alert('Error', 'Failed to create list');
          return;
        }

        targetListId = newList.id;
      } else {
        // Use existing list
        if (!selectedList) {
          Alert.alert('Error', 'Please select a list');
          return;
        }
        targetListId = selectedList.id;
      }

      // Add items to the list
      if (selectedItems.length > 0) {
        const itemsData = selectedItems.map(item => ({
          external_id: item.id,
          title: item.title,
          description: item.description,
          image_url: item.image_url,
          external_data: item.external_data,
          content_type: category?.id,
          subtitle: item.channel || item.authors || item.platforms || item.address || '',
        }));

        const { error: itemsError } = await supabase.listItems.addItems(targetListId, itemsData);
        
        if (itemsError) {
          console.error('Add items error:', itemsError);
          Alert.alert('Error', 'List created but failed to add some items');
        }
      }

      Alert.alert('Success', 'List created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to list detail or home
            navigation.navigate('Home');
          }
        }
      ]);

    } catch (error) {
      console.error('Create list error:', error);
      Alert.alert('Error', 'Failed to create list');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Step 1: Search & Select Content</Text>
        <Text style={styles.stepDescription}>
          Find and select {category?.name?.toLowerCase()} to add to your list
        </Text>

        <View style={styles.searchContainer}>
          {category?.id === 'video' ? (
            <TextInput
              style={styles.videoSearchInput}
              placeholder="Paste YouTube URL here..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          ) : (
            <View style={styles.searchInputContainer}>
              <MagnifyingGlass size={20} color={tokens.colors.gray[500]} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${category?.name?.toLowerCase()}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}
        </View>

        {selectedItems.length > 0 && (
          <View style={styles.selectedItemsContainer}>
            <Text style={styles.selectedItemsTitle}>
              Selected Items ({selectedItems.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedItems.map((item) => (
                <View key={item.id} style={styles.selectedItem}>
                  <Image source={{ uri: item.image_url }} style={styles.selectedItemImage} />
                  <Text style={styles.selectedItemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeItemButton}
                    onPress={() => toggleItemSelection(item)}
                  >
                    <X size={16} color={tokens.colors.background.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedItems.find(selected => selected.id === item.id);
          return (
            <TouchableOpacity
              style={[styles.resultItem, isSelected && styles.selectedResultItem]}
              onPress={() => toggleItemSelection(item)}
            >
              <Image source={{ uri: item.image_url }} style={styles.resultImage} />
              <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              <View style={[styles.selectionIndicator, isSelected && styles.selectedIndicator]}>
                {isSelected && <Check size={16} color={tokens.colors.background.primary} />}
              </View>
            </TouchableOpacity>
          );
        }}
        style={styles.resultsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsListContent}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Step 2: Choose List</Text>
        <Text style={styles.stepDescription}>
          Add to existing list or create a new one
        </Text>

        <View style={styles.listOptionContainer}>
          <TouchableOpacity
            style={[styles.listOption, createNewList && styles.selectedListOption]}
            onPress={() => setCreateNewList(true)}
          >
            <Plus size={24} color={createNewList ? tokens.colors.primary : tokens.colors.gray[500]} />
            <Text style={[styles.listOptionText, createNewList && styles.selectedListOptionText]}>
              Create New List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.listOption, !createNewList && styles.selectedListOption]}
            onPress={() => setCreateNewList(false)}
          >
            <Text style={[styles.listOptionText, !createNewList && styles.selectedListOptionText]}>
              Add to Existing List
            </Text>
          </TouchableOpacity>
        </View>

        {createNewList && (
          <View style={styles.newListContainer}>
            <TextInput
              style={styles.listInput}
              placeholder="List name"
              value={listName}
              onChangeText={setListName}
            />
            <TextInput
              style={[styles.listInput, styles.listDescriptionInput]}
              placeholder="List description"
              value={listDescription}
              onChangeText={setListDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        )}
      </View>

      {!createNewList && (
        <FlatList
          data={existingLists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.existingListItem, selectedList?.id === item.id && styles.selectedExistingList]}
              onPress={() => setSelectedList(item)}
            >
              <Text style={styles.existingListTitle}>{item.title}</Text>
              <Text style={styles.existingListDescription}>{item.description}</Text>
              <View style={[styles.selectionIndicator, selectedList?.id === item.id && styles.selectedIndicator]}>
                {selectedList?.id === item.id && <Check size={16} color={tokens.colors.background.primary} />}
              </View>
            </TouchableOpacity>
          )}
          style={styles.existingListsList}
          contentContainerStyle={styles.resultsListContent}
        />
      )}
    </View>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Step 3: Privacy Settings</Text>
        <Text style={styles.stepDescription}>
          Configure who can see and interact with your list
        </Text>

        <View style={styles.privacyContainer}>
          <Text style={styles.settingLabel}>Privacy Level</Text>
          
          <TouchableOpacity
            style={[styles.privacyOption, privacy === 'public' && styles.selectedPrivacyOption]}
            onPress={() => setPrivacy('public')}
          >
            <Globe size={24} color={privacy === 'public' ? tokens.colors.primary : tokens.colors.gray[500]} />
            <View style={styles.privacyOptionContent}>
              <Text style={[styles.privacyOptionTitle, privacy === 'public' && styles.selectedPrivacyText]}>
                Public
              </Text>
              <Text style={styles.privacyOptionDescription}>
                Anyone can see this list
              </Text>
            </View>
            <View style={[styles.selectionIndicator, privacy === 'public' && styles.selectedIndicator]}>
              {privacy === 'public' && <Check size={16} color={tokens.colors.background.primary} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.privacyOption, privacy === 'friends' && styles.selectedPrivacyOption]}
            onPress={() => setPrivacy('friends')}
          >
            <Users size={24} color={privacy === 'friends' ? tokens.colors.primary : tokens.colors.gray[500]} />
            <View style={styles.privacyOptionContent}>
              <Text style={[styles.privacyOptionTitle, privacy === 'friends' && styles.selectedPrivacyText]}>
                Friends Only
              </Text>
              <Text style={styles.privacyOptionDescription}>
                Only people you follow can see this list
              </Text>
            </View>
            <View style={[styles.selectionIndicator, privacy === 'friends' && styles.selectedIndicator]}>
              {privacy === 'friends' && <Check size={16} color={tokens.colors.background.primary} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.privacyOption, privacy === 'private' && styles.selectedPrivacyOption]}
            onPress={() => setPrivacy('private')}
          >
            <Lock size={24} color={privacy === 'private' ? tokens.colors.primary : tokens.colors.gray[500]} />
            <View style={styles.privacyOptionContent}>
              <Text style={[styles.privacyOptionTitle, privacy === 'private' && styles.selectedPrivacyText]}>
                Private
              </Text>
              <Text style={styles.privacyOptionDescription}>
                Only you can see this list
              </Text>
            </View>
            <View style={[styles.selectionIndicator, privacy === 'private' && styles.selectedIndicator]}>
              {privacy === 'private' && <Check size={16} color={tokens.colors.background.primary} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.additionalSettingsContainer}>
          <TouchableOpacity
            style={styles.settingToggle}
            onPress={() => setAllowComments(!allowComments)}
          >
            <Text style={styles.settingToggleText}>Allow Comments</Text>
            <View style={[styles.toggle, allowComments && styles.toggleActive]}>
              <View style={[styles.toggleThumb, allowComments && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingToggle}
            onPress={() => setAllowCollaboration(!allowCollaboration)}
          >
            <Text style={styles.settingToggleText}>Allow Collaboration</Text>
            <View style={[styles.toggle, allowCollaboration && styles.toggleActive]}>
              <View style={[styles.toggleThumb, allowCollaboration && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Header
        showBackButton={true}
        onBackPress={handleBack}
        title={existingListId ? "Add to List" : "Create List"}
      />

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                step <= currentStep && styles.activeProgressStep
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 3</Text>
      </View>

      <View style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={20} color={tokens.colors.gray[500]} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === 3 ? 'Create List' : 'Next'}
          </Text>
          {currentStep < 3 && <ArrowRight size={20} color={tokens.colors.background.primary} />}
        </TouchableOpacity>
      </View>

      <BottomMenu 
        activeTab="create" 
        onTabPress={(tabId) => {
          if (tabId === 'home') {
            navigation.navigate('Home');
          } else if (tabId === 'notifications') {
            navigation.navigate('Notifications');
          } else if (tabId === 'profile') {
            navigation.navigate('Profile');
          } else if (tabId === 'create') {
            // Already on create screen
          } else {
            console.log('Tab pressed:', tabId);
          }
        }}
        onCategorySelect={(category) => {
          // Handle category selection - could reset current flow or start new
          console.log('New category selected:', category);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e5e5',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  activeProgressStep: {
    backgroundColor: '#f97316',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  videoSearchInput: {
    height: 48,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '500',
  },
  selectedItemsContainer: {
    marginBottom: 20,
  },
  selectedItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  selectedItem: {
    width: 120,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
    position: 'relative',
  },
  selectedItemImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItemTitle: {
    fontSize: 12,
    color: '#1a1a1a',
    lineHeight: 16,
  },
  removeItemButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsListContent: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedResultItem: {
    borderColor: '#f97316',
    backgroundColor: '#fff5f0',
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  selectionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  selectedIndicator: {
    backgroundColor: '#f97316',
  },
  listOptionContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  listOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedListOption: {
    borderColor: '#f97316',
    backgroundColor: '#fff5f0',
  },
  listOptionText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedListOptionText: {
    color: '#f97316',
    fontWeight: '600',
  },
  newListContainer: {
    gap: 16,
  },
  listInput: {
    height: 48,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  listDescriptionInput: {
    height: 96,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  existingListsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  existingListItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedExistingList: {
    borderColor: '#f97316',
    backgroundColor: '#fff5f0',
  },
  existingListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginBottom: 4,
  },
  existingListDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  privacyContainer: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPrivacyOption: {
    borderColor: '#f97316',
    backgroundColor: '#fff5f0',
  },
  privacyOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  selectedPrivacyText: {
    color: '#f97316',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  additionalSettingsContainer: {
    gap: 16,
  },
  settingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  settingToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#f97316',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
});

export default CreateListScreen;