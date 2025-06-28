// Multi-provider places service with fallback support
import { yandexService } from './yandexService';

// Mock places data for reliable fallback
const generateMockPlaces = (query = 'place', count = 15) => {
  const categories = [
    'Restaurant', 'Cafe', 'Shop', 'Mall', 'Hotel', 'Park', 
    'Museum', 'Cinema', 'Hospital', 'School', 'Bank', 'Gas Station',
    'Pharmacy', 'Gym', 'Library'
  ];
  
  const cities = [
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
    { name: 'Ankara', lat: 39.9334, lng: 32.8597 },
    { name: 'Izmir', lat: 38.4192, lng: 27.1287 },
    { name: 'Bursa', lat: 40.1826, lng: 29.0665 },
    { name: 'Antalya', lat: 36.8969, lng: 30.7133 }
  ];
  
  return Array.from({ length: count }, (_, index) => {
    const category = categories[index % categories.length];
    const city = cities[index % cities.length];
    const id = `mock_${query}_${category}_${index}_${Date.now()}`;
    
    // Add some randomness to coordinates
    const lat = city.lat + (Math.random() - 0.5) * 0.1;
    const lng = city.lng + (Math.random() - 0.5) * 0.1;
    
    return {
      id,
      name: `${query} ${category} ${index + 1}`,
      title: `${query} ${category} ${index + 1}`,
      description: `${category} located in ${city.name}, Turkey`,
      address: `Mock Address ${index + 1}, ${city.name}, Turkey`,
      category: category.toLowerCase(),
      properties: {
        name: `${query} ${category} ${index + 1}`,
        address: `Mock Address ${index + 1}, ${city.name}, Turkey`,
        kind: category.toLowerCase(),
        city: city.name,
        country: 'Turkey'
      },
      geometry: {
        coordinates: [lng, lat]
      },
      external_data: {
        mock_place: true,
        category: 'place',
        kind: category.toLowerCase(),
        precision: 'exact',
        provider: 'mock'
      },
      // Add image URL using static map
      image_url: `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=300,200&z=14&l=map&pt=${lng},${lat},pm2rdm&lang=en_US`
    };
  });
};

// Popular places by category for discover functionality
const getPopularPlacesByCategory = () => {
  const popularCategories = [
    { name: 'Restaurants', query: 'restaurant', emoji: '🍽️' },
    { name: 'Cafes', query: 'cafe', emoji: '☕' },
    { name: 'Shopping', query: 'shopping mall', emoji: '🛍️' },
    { name: 'Parks', query: 'park', emoji: '🌳' },
    { name: 'Museums', query: 'museum', emoji: '🏛️' },
    { name: 'Hotels', query: 'hotel', emoji: '🏨' },
    { name: 'Cinemas', query: 'cinema', emoji: '🎬' },
    { name: 'Hospitals', query: 'hospital', emoji: '🏥' }
  ];

  return popularCategories.map(category => ({
    ...category,
    places: generateMockPlaces(category.query, 10)
  }));
};

export const placesService = {
  // Search places with multiple provider fallback
  searchPlaces: async (query, latitude = 41.0082, longitude = 28.9784) => {
    console.log('PlacesService: Searching for places:', { query, latitude, longitude });
    
    // Always try Yandex first, but with improved error handling
    try {
      console.log('Trying Yandex API...');
      const yandexResult = await yandexService.searchPlaces(query, latitude, longitude);
      
      if (yandexResult && yandexResult.features && yandexResult.features.length > 0) {
        console.log('Yandex API returned', yandexResult.features.length, 'places');
        return {
          ...yandexResult,
          provider: 'yandex',
          total_results: yandexResult.features.length
        };
      }
    } catch (error) {
      console.error('Yandex API failed:', error);
    }
    
    // Fallback to mock data
    console.log('Using mock data for places search:', query);
    const mockPlaces = generateMockPlaces(query, 15);
    
    return {
      features: mockPlaces,
      total_results: mockPlaces.length,
      provider: 'mock',
      fallback: true
    };
  },

  // Get popular/discover places
  getPopularPlaces: async (latitude = 41.0082, longitude = 28.9784) => {
    console.log('PlacesService: Getting popular places near:', { latitude, longitude });
    
    // Try Yandex first
    try {
      console.log('Trying Yandex API for popular places...');
      const yandexResult = await yandexService.getPopularPlaces(latitude, longitude);
      
      if (yandexResult && yandexResult.features && yandexResult.features.length > 0) {
        console.log('Yandex API returned', yandexResult.features.length, 'popular places');
        return {
          ...yandexResult,
          provider: 'yandex'
        };
      }
    } catch (error) {
      console.error('Yandex API failed for popular places:', error);
    }
    
    // Fallback to curated mock data
    console.log('Using mock data for popular places');
    const mockPlaces = generateMockPlaces('Popular', 20);
    
    return {
      features: mockPlaces,
      total_results: mockPlaces.length,
      provider: 'mock',
      fallback: true
    };
  },

  // Get places by category for discover
  getPlacesByCategory: async (category, latitude = 41.0082, longitude = 28.9784) => {
    console.log('PlacesService: Getting places by category:', { category, latitude, longitude });
    
    try {
      // Use existing search functionality
      const result = await placesService.searchPlaces(category, latitude, longitude);
      
      return {
        ...result,
        category,
        query: category
      };
    } catch (error) {
      console.error('Error getting places by category:', error);
      
      // Fallback
      const mockPlaces = generateMockPlaces(category, 10);
      return {
        features: mockPlaces,
        total_results: mockPlaces.length,
        provider: 'mock',
        category,
        fallback: true
      };
    }
  },

  // Get place details
  getPlaceDetails: async (placeId, latitude, longitude) => {
    console.log('PlacesService: Getting place details:', { placeId, latitude, longitude });
    
    // If it's a mock place, return mock details
    if (placeId.includes('mock_')) {
      return {
        id: placeId,
        title: 'Mock Place Details',
        description: 'This is a mock place for testing purposes',
        address: 'Mock Address, Mock City, Turkey',
        coordinates: { latitude, longitude },
        image_url: `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&size=300,200&z=15&l=map&pt=${longitude},${latitude},pm2rdm&lang=en_US`,
        provider: 'mock'
      };
    }
    
    // Try Yandex for real places
    try {
      const result = await yandexService.getPlaceDetails(latitude, longitude);
      return {
        ...result,
        provider: 'yandex'
      };
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  },

  // Get categorized popular places for discover screen
  getDiscoverPlaces: () => {
    return getPopularPlacesByCategory();
  },

  // Check if a coordinate is in a valid range
  isValidCoordinate: (latitude, longitude) => {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  },

  // Get nearest places to coordinates
  getNearbyPlaces: async (latitude, longitude, radius = 1000) => {
    if (!placesService.isValidCoordinate(latitude, longitude)) {
      throw new Error('Invalid coordinates');
    }

    try {
      // Use search with a general query to find nearby places
      const result = await placesService.searchPlaces('place', latitude, longitude);
      
      // Filter places within radius (simplified calculation)
      const nearbyPlaces = result.features.filter(place => {
        const [placeLng, placeLat] = place.geometry.coordinates;
        const distance = Math.sqrt(
          Math.pow(placeLat - latitude, 2) + Math.pow(placeLng - longitude, 2)
        ) * 111000; // Rough conversion to meters
        
        return distance <= radius;
      });

      return {
        ...result,
        features: nearbyPlaces,
        total_results: nearbyPlaces.length,
        radius,
        center: { latitude, longitude }
      };
    } catch (error) {
      console.error('Error getting nearby places:', error);
      throw error;
    }
  }
};

export default placesService;