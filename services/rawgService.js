import { API_CONFIG } from './apiConfig';

const { RAWG } = API_CONFIG;

const makeRequest = async (endpoint, params = {}) => {
  try {
    const url = new URL(`${RAWG.BASE_URL}${endpoint}`);
    url.searchParams.append('key', RAWG.API_KEY);
    
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('RAWG API Error:', error);
    throw error;
  }
};

export const rawgService = {
  // Search games
  searchGames: async (query, page = 1) => {
    const data = await makeRequest('/games', {
      search: query,
      page,
      page_size: 20,
    });
    
    return {
      results: data.results.map(game => ({
        id: game.id.toString(),
        title: game.name,
        description: game.description_raw || 'No description available',
        image_url: game.background_image || 'https://via.placeholder.com/300x200',
        released: game.released,
        rating: game.rating,
        platforms: game.platforms?.map(p => p.platform.name).join(', '),
        external_data: {
          rawg_id: game.id,
          category: 'game',
          genres: game.genres,
          stores: game.stores,
        },
      })),
      total_pages: Math.ceil(data.count / 20),
      total_results: data.count,
    };
  },

  // Get popular games
  getPopularGames: async (page = 1) => {
    const data = await makeRequest('/games', {
      page,
      page_size: 20,
      ordering: '-rating',
      metacritic: '80,100',
    });
    
    return {
      results: data.results.map(game => ({
        id: game.id.toString(),
        name: game.name,
        title: game.name,
        background_image: game.background_image,
        rating: game.rating,
        released: game.released,
        metacritic: game.metacritic,
      })),
      total_pages: Math.ceil(data.count / 20),
      total_results: data.count,
    };
  },
};