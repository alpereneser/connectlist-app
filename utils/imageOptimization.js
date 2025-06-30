import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();

// Image optimization configurations
export const ImageConfig = {
  avatar: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  cover: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  message: {
    maxWidth: 1080,
    maxHeight: 1080,
    quality: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  thumbnail: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  },
};

// Calculate optimal image size based on screen dimensions
export const calculateOptimalSize = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  const aspectRatio = originalWidth / originalHeight;
  
  let targetWidth = Math.min(originalWidth, maxWidth);
  let targetHeight = Math.min(originalHeight, maxHeight);
  
  // Maintain aspect ratio
  if (targetWidth / aspectRatio > targetHeight) {
    targetWidth = targetHeight * aspectRatio;
  } else {
    targetHeight = targetWidth / aspectRatio;
  }
  
  // Account for pixel ratio for better quality on high-density screens
  const scaleFactor = Math.min(pixelRatio, 2); // Cap at 2x for performance
  
  return {
    width: Math.round(targetWidth * scaleFactor),
    height: Math.round(targetHeight * scaleFactor),
  };
};

// Progressive image loading utility
export const generateImageSizes = (originalUri, type = 'cover') => {
  const config = ImageConfig[type] || ImageConfig.cover;
  
  return {
    thumbnail: `${originalUri}?w=200&h=200&q=60`,
    small: `${originalUri}?w=400&h=400&q=75`,
    medium: `${originalUri}?w=${config.maxWidth}&h=${config.maxHeight}&q=${Math.round(config.quality * 100)}`,
    large: `${originalUri}?w=${config.maxWidth * 2}&h=${config.maxHeight * 2}&q=${Math.round(config.quality * 100)}`,
    original: originalUri,
  };
};

// Optimize image for upload
export const optimizeImageForUpload = async (uri, type = 'cover') => {
  try {
    const config = ImageConfig[type];
    
    // Get image info
    const imageInfo = await FileSystem.getInfoAsync(uri);
    if (!imageInfo.exists) {
      throw new Error('Image file does not exist');
    }
    
    // Get image dimensions
    const manipulatorResult = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // Read image to get actual dimensions (workaround for expo-image-manipulator)
    const { width: originalWidth, height: originalHeight } = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = uri;
    }).catch(() => ({ width: config.maxWidth, height: config.maxHeight }));
    
    // Calculate optimal size
    const { width, height } = calculateOptimalSize(
      originalWidth,
      originalHeight,
      config.maxWidth,
      config.maxHeight
    );
    
    // Optimize image
    const optimizedResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width, height } }],
      {
        compress: config.quality,
        format: config.format,
      }
    );
    
    // Get file size info
    const originalSize = imageInfo.size;
    const optimizedInfo = await FileSystem.getInfoAsync(optimizedResult.uri);
    const optimizedSize = optimizedInfo.size;
    
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`Image optimized: ${formatFileSize(originalSize)} → ${formatFileSize(optimizedSize)} (${compressionRatio}% reduction)`);
    
    return {
      uri: optimizedResult.uri,
      width,
      height,
      originalSize,
      optimizedSize,
      compressionRatio: parseFloat(compressionRatio),
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
};

// Create thumbnail from image
export const createThumbnail = async (uri, size = 200) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: size, height: size } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw error;
  }
};

// Lazy loading image component utility
export const createImageLoader = () => {
  const loadedImages = new Map();
  const loadingImages = new Map();
  
  return {
    loadImage: async (uri) => {
      if (loadedImages.has(uri)) {
        return loadedImages.get(uri);
      }
      
      if (loadingImages.has(uri)) {
        return loadingImages.get(uri);
      }
      
      const loadPromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          loadedImages.set(uri, true);
          loadingImages.delete(uri);
          resolve(true);
        };
        img.onerror = () => {
          loadingImages.delete(uri);
          reject(new Error('Failed to load image'));
        };
        img.src = uri;
      });
      
      loadingImages.set(uri, loadPromise);
      return loadPromise;
    },
    
    preloadImages: async (uris) => {
      const promises = uris.map(uri => this.loadImage(uri).catch(() => null));
      return Promise.allSettled(promises);
    },
    
    clearCache: () => {
      loadedImages.clear();
      loadingImages.clear();
    },
  };
};

// Memory-efficient image caching
export class ImageCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const lru = this.accessOrder.shift();
      this.cache.delete(lru);
    }
    
    this.cache.set(key, value);
    this.accessOrder.push(key);
  }
  
  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
      return this.cache.get(key);
    }
    return null;
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }
  
  size() {
    return this.cache.size;
  }
}

// Global image cache instance
export const globalImageCache = new ImageCache(100);

// Helper functions
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getImageDimensions = (uri) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = uri;
  });
};

// Responsive image utility
export const getResponsiveImageSize = (containerWidth, aspectRatio = 1) => {
  const maxWidth = Math.min(containerWidth, screenWidth);
  const height = maxWidth / aspectRatio;
  
  return {
    width: maxWidth,
    height: Math.min(height, screenHeight * 0.6), // Max 60% of screen height
  };
};

// Batch image optimization for multiple images
export const batchOptimizeImages = async (imageUris, type = 'cover', onProgress) => {
  const results = [];
  
  for (let i = 0; i < imageUris.length; i++) {
    try {
      const result = await optimizeImageForUpload(imageUris[i], type);
      results.push({ success: true, ...result });
      
      if (onProgress) {
        onProgress(i + 1, imageUris.length, result);
      }
    } catch (error) {
      results.push({ 
        success: false, 
        error: error.message, 
        originalUri: imageUris[i] 
      });
      
      if (onProgress) {
        onProgress(i + 1, imageUris.length, null);
      }
    }
  }
  
  return results;
};

export default {
  ImageConfig,
  calculateOptimalSize,
  generateImageSizes,
  optimizeImageForUpload,
  createThumbnail,
  createImageLoader,
  ImageCache,
  globalImageCache,
  formatFileSize,
  getImageDimensions,
  getResponsiveImageSize,
  batchOptimizeImages,
};