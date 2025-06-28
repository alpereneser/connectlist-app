import { API_CONFIG } from './apiConfig';

const { YANDEX } = API_CONFIG;

const makeRequest = async (baseUrl, params = {}, apiKey) => {
  try {
    const url = new URL(baseUrl);
    
    // Add API key first
    url.searchParams.append('apikey', apiKey);
    
    // Add other parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log('Making request to:', url.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ConnectList/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yandex API Response Error:', response.status, errorText);
      throw new Error(`Yandex API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Yandex API Response:', data);
    return data;
  } catch (error) {
    console.error('Yandex API Request Error:', error);
    throw error;
  }
};

// Mock data for Places fallback
const createMockPlaceData = (query) => {
  const mockResults = [];
  const placeTypes = ['Restaurant', 'Cafe', 'Shop', 'Mall', 'Store', 'Business', 'Market', 'Hotel', 'Park'];
  
  for (let i = 1; i <= 15; i++) {
    const placeType = placeTypes[i % placeTypes.length];
    const latitude = 41.0082 + (Math.random() - 0.5) * 0.1;
    const longitude = 28.9784 + (Math.random() - 0.5) * 0.1;
    
    mockResults.push({
      id: `mock_place_${i}_${Date.now()}`,
      name: `${query} ${placeType} ${i}`,
      title: `${query} ${placeType} ${i}`,
      description: `${placeType} located in Istanbul, Turkey`,
      properties: {
        name: `${query} ${placeType} ${i}`,
        address: `Mock Address ${i}, Istanbul, Turkey`,
        kind: placeType.toLowerCase(),
      },
      geometry: {
        coordinates: [longitude, latitude]
      },
      external_data: {
        yandex_place: true,
        category: 'place',
        kind: placeType.toLowerCase(),
        precision: 'exact',
      },
    });
  }
  
  return {
    features: mockResults,
    total_results: mockResults.length,
  };
};

export const yandexService = {
  // Search places
  searchPlaces: async (query, latitude = 41.0082, longitude = 28.9784) => {
    console.log('Yandex searchPlaces called with:', { query, latitude, longitude });
    
    try {
      // First try with exact search using corrected API format
      console.log('Making Yandex Geocoder API request...');
      let data = await makeRequest(
        YANDEX.GEOCODER_BASE_URL,
        {
          geocode: query,
          format: 'json',
          results: 20,
          ll: `${longitude},${latitude}`,
          spn: '0.5,0.5',
          rspn: 1,
          lang: 'en_US',
          kind: 'house' // Search for buildings/places
        },
        YANDEX.GEOCODER_API_KEY
      );
      
      console.log('Yandex API response:', data);
      let places = data.response?.GeoObjectCollection?.featureMember || [];
      console.log('Places found:', places.length);
      
      // If not enough results, try different search strategies
      if (places.length < 5) {
        const searchStrategies = [
          { query: `${query} restaurant`, kind: 'house' },
          { query: `${query} cafe`, kind: 'house' },
          { query: `${query} shop`, kind: 'house' },
          { query: `${query} hotel`, kind: 'house' },
          { query: query, kind: 'locality' }, // Try locality search
        ];
        
        for (const strategy of searchStrategies) {
          try {
            const businessData = await makeRequest(
              YANDEX.GEOCODER_BASE_URL,
              {
                geocode: strategy.query,
                format: 'json',
                results: 10,
                ll: `${longitude},${latitude}`,
                spn: '0.5,0.5',
                rspn: 1,
                lang: 'en_US',
                kind: strategy.kind
              },
              YANDEX.GEOCODER_API_KEY
            );
            
            const businessPlaces = businessData.response?.GeoObjectCollection?.featureMember || [];
            places = [...places, ...businessPlaces];
            
            if (places.length >= 15) break;
          } catch (businessError) {
            console.log('Business search failed for:', strategy.query);
          }
        }
      }
      
      // Remove duplicates based on coordinates
      const uniquePlaces = places.filter((item, index, self) => {
        const coords = item.GeoObject.Point.pos;
        return index === self.findIndex(p => p.GeoObject.Point.pos === coords);
      });
      
      if (uniquePlaces.length === 0) {
        console.log('No real places found from Yandex API, using mock data for:', query);
        return createMockPlaceData(query);
      }
      
      console.log('Found', uniquePlaces.length, 'places from Yandex API');
      
      return {
        features: uniquePlaces.map((item, index) => {
          const place = item.GeoObject;
          const coords = place.Point.pos.split(' ');
          const longitude = parseFloat(coords[0]);
          const latitude = parseFloat(coords[1]);
          
          const placeName = place.name || place.metaDataProperty?.GeocoderMetaData?.text || 'Unknown Place';
          const placeAddress = place.metaDataProperty?.GeocoderMetaData?.Address?.formatted || '';
          const placeKind = place.metaDataProperty?.GeocoderMetaData?.kind || 'locality';
          
          // Better description based on place type
          let description = placeAddress;
          if (!description) {
            const country = place.metaDataProperty?.GeocoderMetaData?.Address?.Components?.find(c => c.kind === 'country')?.name || 'Unknown Location';
            const locality = place.metaDataProperty?.GeocoderMetaData?.Address?.Components?.find(c => c.kind === 'locality')?.name || '';
            description = `${placeKind.charAt(0).toUpperCase() + placeKind.slice(1)} in ${locality ? locality + ', ' : ''}${country}`;
          }
          
          return {
            id: `yandex_${index}_${Date.now()}`,
            name: placeName,
            title: placeName,
            description: description,
            properties: {
              name: placeName,
              address: placeAddress,
              kind: placeKind,
            },
            geometry: {
              coordinates: [longitude, latitude]
            },
            external_data: {
              yandex_place: true,
              category: 'place',
              kind: placeKind,
              precision: place.metaDataProperty?.GeocoderMetaData?.precision,
            },
          };
        }),
        total_results: uniquePlaces.length,
      };
    } catch (error) {
      console.error('Yandex Places Error:', error);
      console.log('Using mock data due to API error for:', query);
      return createMockPlaceData(query);
    }
  },

  // Get place details by coordinates
  getPlaceDetails: async (latitude, longitude) => {
    try {
      const data = await makeRequest(
        YANDEX.GEOCODER_BASE_URL,
        {
          geocode: `${longitude},${latitude}`,
          format: 'json',
          results: 1,
          lang: 'en_US'
        },
        YANDEX.GEOCODER_API_KEY
      );
      
      const places = data.response?.GeoObjectCollection?.featureMember || [];
      
      if (places.length === 0) {
        throw new Error('Place not found');
      }
      
      const place = places[0].GeoObject;
      
      return {
        id: `yandex_detail_${Date.now()}`,
        title: place.name || place.metaDataProperty?.GeocoderMetaData?.text || 'Unknown Place',
        description: place.description || place.metaDataProperty?.GeocoderMetaData?.Address?.formatted || 'No description available',
        image_url: `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&size=300,200&z=15&l=map&pt=${longitude},${latitude},pm2rdm&lang=en_US`,
        address: place.metaDataProperty?.GeocoderMetaData?.Address?.formatted,
        coordinates: {
          latitude,
          longitude,
        },
        external_data: {
          yandex_place: true,
          category: 'place',
          kind: place.metaDataProperty?.GeocoderMetaData?.kind,
          precision: place.metaDataProperty?.GeocoderMetaData?.precision,
        },
      };
    } catch (error) {
      console.error('Yandex Place Details Error:', error);
      throw error;
    }
  },

  // Get popular places
  getPopularPlaces: async (latitude = 41.0082, longitude = 28.9784) => {
    console.log('Getting popular places near:', { latitude, longitude });
    
    const popularPlaceTypes = [
      { name: 'restaurant', kind: 'house' },
      { name: 'cafe', kind: 'house' },
      { name: 'park', kind: 'vegetation' },
      { name: 'museum', kind: 'house' },
      { name: 'shopping mall', kind: 'house' },
      { name: 'hotel', kind: 'house' },
      { name: 'cinema', kind: 'house' },
      { name: 'hospital', kind: 'house' }
    ];

    const allPlaces = [];
    
    for (const placeType of popularPlaceTypes) {
      try {
        const data = await makeRequest(
          YANDEX.GEOCODER_BASE_URL,
          {
            geocode: placeType.name,
            format: 'json',
            results: 3,
            ll: `${longitude},${latitude}`,
            spn: '0.3,0.3',
            rspn: 1,
            lang: 'en_US',
            kind: placeType.kind
          },
          YANDEX.GEOCODER_API_KEY
        );
        
        const places = data.response?.GeoObjectCollection?.featureMember || [];
        
        places.forEach(item => {
          const place = item.GeoObject;
          const coords = place.Point.pos.split(' ');
          const placeLon = parseFloat(coords[0]);
          const placeLat = parseFloat(coords[1]);
          
          allPlaces.push({
            id: `yandex_${placeType.name}_${allPlaces.length}_${Date.now()}`,
            name: place.name || placeType.name.charAt(0).toUpperCase() + placeType.name.slice(1),
            title: place.name || placeType.name.charAt(0).toUpperCase() + placeType.name.slice(1),
            description: place.metaDataProperty?.GeocoderMetaData?.Address?.formatted || `Popular ${placeType.name} in the area`,
            properties: {
              name: place.name || placeType.name,
            },
            geometry: {
              coordinates: [placeLon, placeLat]
            }
          });
        });
      } catch (error) {
        console.log(`Error fetching ${placeType.name}:`, error);
      }
    }
    
    // If no real places found, return mock data
    if (allPlaces.length === 0) {
      console.log('No places found from Yandex API, returning mock data');
      return {
        features: popularPlaceTypes.map((type, index) => ({
          id: `mock_place_${index}`,
          name: `Popular ${type.name}`,
          title: `Popular ${type.name}`,
          description: `A nice ${type.name} to visit`,
          properties: {
            name: `Popular ${type.name}`,
          },
          geometry: {
            coordinates: [longitude + (Math.random() - 0.5) * 0.1, latitude + (Math.random() - 0.5) * 0.1]
          }
        }))
      };
    }
    
    return {
      features: allPlaces.slice(0, 15)
    };
  },
};