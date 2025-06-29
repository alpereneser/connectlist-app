// Yandex Places API Service
import { API_CONFIG } from './apiConfig';

const { YANDEX } = API_CONFIG;

// Yandex Places API implementation
class YandexPlacesService {
  constructor() {
    this.apiKey = YANDEX.PLACES_API_KEY;
    this.baseUrl = 'https://search-maps.yandex.ru/v1/';
  }

  // Make request to Yandex Places API
  async makeRequest(params = {}) {
    try {
      const url = new URL(this.baseUrl);
      
      // Add API key first (required parameter)
      url.searchParams.append('apikey', this.apiKey);
      
      // Add text and lang parameters (required)
      if (!params.text) {
        throw new Error('text parameter is required for Yandex Places API');
      }
      
      // Add other parameters in correct order
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          url.searchParams.append(key, params[key]);
        }
      });

      console.log('Making Yandex Places API request:', url.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'ConnectList/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Yandex Places API Error:', response.status, errorText);
        
        // Check for specific error types
        if (response.status === 403) {
          throw new Error('API key invalid or rate limit exceeded');
        }
        
        throw new Error(`Yandex Places API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Yandex Places API Response:', data);
      return data;
    } catch (error) {
      console.error('Yandex Places API Request Error:', error);
      throw error;
    }
  }

  // Search for places
  async searchPlaces(text, location = { lat: 41.0082, lon: 28.9784 }, options = {}) {
    try {
      const params = {
        text: text,
        lang: options.lang || 'en_US',
        ll: `${location.lon},${location.lat}`,
        spn: options.spn || '0.5,0.5',
        type: options.type || 'biz', // 'biz' for businesses, 'geo' for geographical objects
        results: options.results || 20,
        rspn: 1 // Restrict search to specified area
      };

      const data = await this.makeRequest(params);
      
      return {
        features: data.features || [],
        type: data.type,
        properties: data.properties || {}
      };
    } catch (error) {
      console.error('Error searching places:', error);
      return { features: [], error: error.message };
    }
  }

  // Get places by category
  async getPlacesByCategory(category, location = { lat: 41.0082, lon: 28.9784 }, options = {}) {
    const categoryMap = {
      restaurant: 'Restaurants',
      cafe: 'Cafes',
      hotel: 'Hotels',
      shopping: 'Shopping',
      entertainment: 'Entertainment',
      museum: 'Museums',
      park: 'Parks',
      hospital: 'Medical'
    };

    const searchText = categoryMap[category] || category;
    return this.searchPlaces(searchText, location, options);
  }

  // Get nearby places
  async getNearbyPlaces(location = { lat: 41.0082, lon: 28.9784 }, options = {}) {
    try {
      const params = {
        ll: `${location.lon},${location.lat}`,
        spn: options.spn || '0.1,0.1', // Smaller area for nearby
        type: options.type || 'biz',
        results: options.results || 10,
        rspn: 1
      };

      const data = await this.makeRequest(params);
      
      return {
        features: data.features || [],
        type: data.type,
        properties: data.properties || {}
      };
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return { features: [], error: error.message };
    }
  }

  // Format place data for UI
  formatPlaceData(place) {
    const properties = place.properties || {};
    const geometry = place.geometry || {};
    const coordinates = geometry.coordinates || [];
    
    return {
      id: properties.id || `place_${Date.now()}_${Math.random()}`,
      name: properties.name || 'Unknown Place',
      title: properties.name || 'Unknown Place',
      description: properties.description || properties.CompanyMetaData?.Categories?.join(', ') || '',
      address: properties.CompanyMetaData?.address || properties.description || '',
      category: properties.CompanyMetaData?.Categories?.[0] || 'place',
      phone: properties.CompanyMetaData?.Phones?.[0]?.formatted || null,
      url: properties.CompanyMetaData?.url || null,
      hours: properties.CompanyMetaData?.Hours?.text || null,
      coordinates: {
        latitude: coordinates[1] || 0,
        longitude: coordinates[0] || 0
      },
      geometry: {
        type: geometry.type || 'Point',
        coordinates: coordinates
      },
      image_url: this.generateStaticMapUrl(coordinates[0], coordinates[1]),
      raw: place // Keep original data
    };
  }

  // Generate static map URL for place
  generateStaticMapUrl(lon, lat, zoom = 15) {
    if (!lon || !lat) return null;
    
    return `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&size=300,200&z=${zoom}&l=map&pt=${lon},${lat},pm2rdm&lang=en_US`;
  }
}

// Export singleton instance
export const yandexPlacesService = new YandexPlacesService();

// Export search function for backward compatibility
export const searchYandexPlaces = async (query, latitude, longitude) => {
  const service = new YandexPlacesService();
  const result = await service.searchPlaces(query, { lat: latitude, lon: longitude });
  
  if (result.features && result.features.length > 0) {
    return {
      features: result.features.map(place => service.formatPlaceData(place)),
      total_results: result.features.length,
      provider: 'yandex_places'
    };
  }
  
  return {
    features: [],
    total_results: 0,
    provider: 'yandex_places',
    error: result.error
  };
};