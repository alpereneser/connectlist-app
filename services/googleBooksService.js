import { API_CONFIG } from './apiConfig';

const { GOOGLE_BOOKS } = API_CONFIG;

const makeRequest = async (endpoint, params = {}) => {
  try {
    const url = new URL(`${GOOGLE_BOOKS.BASE_URL}${endpoint}`);
    url.searchParams.append('key', GOOGLE_BOOKS.API_KEY);
    
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Google Books API Error:', error);
    throw error;
  }
};

export const googleBooksService = {
  // Search books
  searchBooks: async (query, startIndex = 0) => {
    const data = await makeRequest('/volumes', {
      q: query,
      startIndex,
      maxResults: 20,
      printType: 'books',
      orderBy: 'relevance',
    });
    
    if (!data.items) {
      return {
        results: [],
        total_pages: 0,
        total_results: 0,
      };
    }
    
    return {
      results: data.items.map(book => ({
        id: book.id,
        title: book.volumeInfo.title || 'Unknown Title',
        description: book.volumeInfo.description || 'No description available',
        image_url: book.volumeInfo.imageLinks?.thumbnail 
          ? book.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')
          : 'https://via.placeholder.com/300x450',
        authors: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
        published_date: book.volumeInfo.publishedDate,
        page_count: book.volumeInfo.pageCount,
        rating: book.volumeInfo.averageRating,
        external_data: {
          google_books_id: book.id,
          category: 'book',
          isbn: book.volumeInfo.industryIdentifiers,
          categories: book.volumeInfo.categories,
        },
      })),
      total_pages: Math.ceil((data.totalItems || 0) / 20),
      total_results: data.totalItems || 0,
    };
  },

  // Get bestseller books
  getBestsellerBooks: async () => {
    try {
      const data = await makeRequest('/volumes', {
        q: 'bestseller',
        maxResults: 20,
        printType: 'books',
        orderBy: 'relevance',
      });
      
      if (!data.items) {
        // Fallback to popular fiction books
        const fallbackData = await makeRequest('/volumes', {
          q: 'subject:fiction',
          maxResults: 20,
          printType: 'books',
          orderBy: 'newest',
        });
        
        return {
          items: fallbackData.items?.map(book => ({
            id: book.id,
            volumeInfo: {
              title: book.volumeInfo.title || 'Unknown Title',
              imageLinks: book.volumeInfo.imageLinks,
              authors: book.volumeInfo.authors,
              description: book.volumeInfo.description,
            },
          })) || [],
          total_results: fallbackData.totalItems || 0,
        };
      }
      
      return {
        items: data.items.map(book => ({
          id: book.id,
          volumeInfo: {
            title: book.volumeInfo.title || 'Unknown Title',
            imageLinks: book.volumeInfo.imageLinks,
            authors: book.volumeInfo.authors,
            description: book.volumeInfo.description,
          },
        })),
        total_results: data.totalItems || 0,
      };
    } catch (error) {
      console.error('Error getting bestseller books:', error);
      // Return mock data as fallback
      return {
        items: [
          {
            id: 'mock1',
            volumeInfo: {
              title: 'The Great Gatsby',
              imageLinks: { thumbnail: 'https://via.placeholder.com/128x192?text=Great+Gatsby' },
              authors: ['F. Scott Fitzgerald'],
              description: 'A classic American novel',
            },
          },
          {
            id: 'mock2',
            volumeInfo: {
              title: '1984',
              imageLinks: { thumbnail: 'https://via.placeholder.com/128x192?text=1984' },
              authors: ['George Orwell'],
              description: 'A dystopian social science fiction novel',
            },
          },
          {
            id: 'mock3',
            volumeInfo: {
              title: 'To Kill a Mockingbird',
              imageLinks: { thumbnail: 'https://via.placeholder.com/128x192?text=Mockingbird' },
              authors: ['Harper Lee'],
              description: 'A novel about racial injustice',
            },
          },
        ],
        total_results: 3,
      };
    }
  },
};