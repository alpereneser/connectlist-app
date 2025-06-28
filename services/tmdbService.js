import { API_CONFIG } from './apiConfig';

const { TMDB } = API_CONFIG;

const makeRequest = async (endpoint, params = {}) => {
  try {
    const url = new URL(`${TMDB.BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', TMDB.API_KEY);
    
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('TMDB API Error:', error);
    throw error;
  }
};

export const tmdbService = {
  // Search movies
  searchMovies: async (query, page = 1) => {
    const data = await makeRequest('/search/movie', {
      query,
      page,
      language: 'en-US',
    });
    
    return {
      results: data.results.map(movie => ({
        id: movie.id.toString(),
        title: movie.title,
        description: movie.overview || 'No description available',
        image_url: movie.poster_path 
          ? `${TMDB.IMAGE_BASE_URL}${movie.poster_path}`
          : 'https://via.placeholder.com/300x450',
        release_date: movie.release_date,
        rating: movie.vote_average,
        external_data: {
          tmdb_id: movie.id,
          category: 'movie',
          backdrop_path: movie.backdrop_path,
        },
      })),
      total_pages: data.total_pages,
      total_results: data.total_results,
    };
  },

  // Search TV shows
  searchTVShows: async (query, page = 1) => {
    const data = await makeRequest('/search/tv', {
      query,
      page,
      language: 'en-US',
    });
    
    return {
      results: data.results.map(show => ({
        id: show.id.toString(),
        title: show.name,
        description: show.overview || 'No description available',
        image_url: show.poster_path 
          ? `${TMDB.IMAGE_BASE_URL}${show.poster_path}`
          : 'https://via.placeholder.com/300x450',
        first_air_date: show.first_air_date,
        rating: show.vote_average,
        external_data: {
          tmdb_id: show.id,
          category: 'tv',
          backdrop_path: show.backdrop_path,
        },
      })),
      total_pages: data.total_pages,
      total_results: data.total_results,
    };
  },

  // Search people
  searchPeople: async (query, page = 1) => {
    const data = await makeRequest('/search/person', {
      query,
      page,
      language: 'en-US',
    });
    
    return {
      results: data.results.map(person => ({
        id: person.id.toString(),
        title: person.name,
        description: person.known_for_department 
          ? `Known for: ${person.known_for_department}`
          : 'Actor/Actress',
        image_url: person.profile_path 
          ? `${TMDB.IMAGE_BASE_URL}${person.profile_path}`
          : 'https://via.placeholder.com/300x450',
        popularity: person.popularity,
        external_data: {
          tmdb_id: person.id,
          category: 'person',
          known_for: person.known_for,
        },
      })),
      total_pages: data.total_pages,
      total_results: data.total_results,
    };
  },

  // Get popular movies
  getPopularMovies: async (page = 1) => {
    const data = await makeRequest('/movie/popular', {
      page,
      language: 'en-US',
    });
    
    return {
      results: data.results.map(movie => ({
        id: movie.id.toString(),
        title: movie.title,
        name: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
      })),
      total_pages: data.total_pages,
      total_results: data.total_results,
    };
  },

  // Get popular TV shows
  getPopularTVShows: async (page = 1) => {
    const data = await makeRequest('/tv/popular', {
      page,
      language: 'en-US',
    });
    
    return {
      results: data.results.map(show => ({
        id: show.id.toString(),
        name: show.name,
        title: show.name,
        overview: show.overview,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        vote_average: show.vote_average,
        first_air_date: show.first_air_date,
      })),
      total_pages: data.total_pages,
      total_results: data.total_results,
    };
  },

  // Get trending content
  getTrending: async (mediaType = 'all', timeWindow = 'week') => {
    const data = await makeRequest(`/trending/${mediaType}/${timeWindow}`, {
      language: 'en-US',
    });
    
    return {
      results: data.results.map(item => ({
        id: item.id.toString(),
        title: item.title || item.name,
        name: item.title || item.name,
        overview: item.overview,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average,
        media_type: item.media_type,
      })),
      total_pages: data.total_pages,
      total_results: data.total_results,
    };
  },
};