import { API_CONFIG } from './apiConfig';

const { YOUTUBE } = API_CONFIG;

const makeRequest = async (endpoint, params = {}) => {
  try {
    const url = new URL(`${YOUTUBE.BASE_URL}${endpoint}`);
    url.searchParams.append('key', YOUTUBE.API_KEY);
    
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('YouTube API Error:', error);
    throw error;
  }
};

// Extract video ID from various YouTube URL formats
const extractVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
};

// Mock data for YouTube API fallback
const createMockVideoData = (query, isUrl = false) => {
  if (isUrl) {
    const videoId = extractVideoId(query);
    return {
      id: videoId || Date.now().toString(),
      title: 'YouTube Video',
      description: 'Video content from YouTube',
      image_url: 'https://via.placeholder.com/480x360?text=YouTube+Video',
      channel: 'YouTube Channel',
      published_at: new Date().toISOString(),
      view_count: '1000',
      like_count: '100',
      external_data: {
        youtube_id: videoId || Date.now().toString(),
        category: 'video',
        url: query,
        channel_id: 'channel123',
      },
    };
  }
  
  // Mock search results
  const mockResults = [];
  for (let i = 1; i <= 10; i++) {
    mockResults.push({
      id: `mock_video_${i}_${Date.now()}`,
      title: `${query} Video ${i}`,
      description: `Mock video about ${query}. This is a sample video description.`,
      image_url: `https://via.placeholder.com/480x360?text=${encodeURIComponent(query)}+Video+${i}`,
      channel: `Creator ${i}`,
      published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      external_data: {
        youtube_id: `mock_video_${i}`,
        category: 'video',
        url: `https://www.youtube.com/watch?v=mock_video_${i}`,
        channel_id: `channel${i}`,
      },
    });
  }
  
  return {
    results: mockResults,
    nextPageToken: null,
    total_results: mockResults.length,
  };
};

export const youtubeService = {
  // Extract video info from YouTube URL
  getVideoFromUrl: async (url) => {
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    try {
      const data = await makeRequest('/videos', {
        part: 'snippet,statistics',
        id: videoId,
      });
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }
      
      const video = data.items[0];
      
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description || 'No description available',
        image_url: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        channel: video.snippet.channelTitle,
        published_at: video.snippet.publishedAt,
        view_count: video.statistics.viewCount,
        like_count: video.statistics.likeCount,
        external_data: {
          youtube_id: video.id,
          category: 'video',
          url: `https://www.youtube.com/watch?v=${video.id}`,
          channel_id: video.snippet.channelId,
        },
      };
    } catch (error) {
      console.log('YouTube API failed, using mock data for URL:', url);
      return createMockVideoData(url, true);
    }
  },

  // Search videos
  searchVideos: async (query, pageToken = '') => {
    try {
      const data = await makeRequest('/search', {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 20,
        pageToken,
        order: 'relevance',
      });
      
      return {
        results: data.items.map(video => ({
          id: video.id.videoId,
          title: video.snippet.title,
          description: video.snippet.description || 'No description available',
          image_url: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
          channel: video.snippet.channelTitle,
          published_at: video.snippet.publishedAt,
          external_data: {
            youtube_id: video.id.videoId,
            category: 'video',
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            channel_id: video.snippet.channelId,
          },
        })),
        nextPageToken: data.nextPageToken,
        total_results: data.pageInfo.totalResults,
      };
    } catch (error) {
      console.log('YouTube API failed, using mock data for query:', query);
      return createMockVideoData(query, false);
    }
  },
};