import { API_CONFIG } from './apiConfig';

const { YANDEX } = API_CONFIG;

const makeRequest = async (baseUrl, endpoint, params = {}, apiKey) => {
  try {
    const url = new URL(`${baseUrl}${endpoint}`);
    url.searchParams.append('apikey', apiKey);
    
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Yandex API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Yandex API Error:', error);
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
      // First try with exact search
      console.log('Making Yandex API request...');
      let data = await makeRequest(
        YANDEX.GEOCODER_BASE_URL,
        '',
        {
          geocode: query,
          format: 'json',
          results: 20,
          ll: `${longitude},${latitude}`,
          spn: '0.5,0.5', // Increased search area
          rspn: 1,
          lang: 'en_US',
        },
        YANDEX.GEOCODER_API_KEY
      );
      
      console.log('Yandex API response:', data);
      let places = data.response?.GeoObjectCollection?.featureMember || [];
      console.log('Places found:', places.length);
      
      // If not enough results, try with category-based search
      if (places.length < 5) {
        const businessQueries = [
          `${query} shop`,
          `${query} store`,
          `${query} business`,
          `${query} restaurant`,
          `${query} cafe`,
        ];
        
        for (const businessQuery of businessQueries) {
          try {
            const businessData = await makeRequest(
              YANDEX.GEOCODER_BASE_URL,
              '',
              {
                geocode: businessQuery,
                format: 'json',
                results: 10,
                ll: `${longitude},${latitude}`,
                spn: '0.5,0.5',
                rspn: 1,
                lang: 'en_US',
              },
              YANDEX.GEOCODER_API_KEY
            );
            
            const businessPlaces = businessData.response?.GeoObjectCollection?.featureMember || [];
            places = [...places, ...businessPlaces];
            
            if (places.length >= 15) break;
          } catch (businessError) {
            console.log('Business search failed for:', businessQuery);
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
        '',
        {
          geocode: `${longitude},${latitude}`,
          format: 'json',
          results: 1,
          lang: 'en_US', // Force English language
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
      'restaurant',
      'cafe',
      'park',
      'museum',
      'shopping mall',
      'tourist attraction',
      'cinema',
      'landmark'
    ];

    const allPlaces = [];
    
    for (const placeType of popularPlaceTypes) {
      try {
        const data = await makeRequest(
          YANDEX.GEOCODER_BASE_URL,
          '',
          {
            geocode: placeType,
            format: 'json',
            results: 5,
            ll: `${longitude},${latitude}`,
            spn: '0.3,0.3',
            rspn: 1,
            lang: 'en_US',
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
            id: `yandex_${placeType}_${allPlaces.length}_${Date.now()}`,
            name: place.name || placeType.charAt(0).toUpperCase() + placeType.slice(1),
            title: place.name || placeType.charAt(0).toUpperCase() + placeType.slice(1),
            description: place.metaDataProperty?.GeocoderMetaData?.Address?.formatted || `Popular ${placeType} in the area`,
            properties: {
              name: place.name || placeType,
            },
            geometry: {
              coordinates: [placeLon, placeLat]
            }
          });
        });
      } catch (error) {
        console.log(`Error fetching ${placeType}:`, error);
      }
    }
    
    // If no real places found, return mock data
    if (allPlaces.length === 0) {
      return {
        features: popularPlaceTypes.map((type, index) => ({
          id: `mock_place_${index}`,
          name: `Popular ${type}`,
          title: `Popular ${type}`,
          description: `A nice ${type} to visit`,
          properties: {
            name: `Popular ${type}`,
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