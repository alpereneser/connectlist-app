import React, { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Performance optimization utilities for React Native
 */

/**
 * Debounce hook for search inputs and API calls
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependencies array
 */
export const useDebounce = (callback, delay, deps) => {
  const timeoutRef = useRef();

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Throttle hook for scroll events and frequent updates
 * @param {Function} callback - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 */
export const useThrottle = (callback, limit) => {
  const inThrottle = useRef(false);

  const throttledCallback = useCallback(
    (...args) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    },
    [callback, limit],
  );

  return throttledCallback;
};

/**
 * Memoized selector for complex data transformations
 * @param {Function} selector - Selector function
 * @param {Array} deps - Dependencies array
 */
export const useMemoizedSelector = (selector, deps) => {
  return useMemo(selector, deps);
};

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  static startTiming(label) {
    if (__DEV__) {
      console.time(label);
    }
  }

  static endTiming(label) {
    if (__DEV__) {
      console.timeEnd(label);
    }
  }

  static measureRender(componentName, renderFunction) {
    if (__DEV__) {
      const startTime = Date.now();
      const result = renderFunction();
      const endTime = Date.now();

      if (endTime - startTime > 16) {
        // More than one frame (16ms)
        console.warn(
          `Slow render detected in ${componentName}: ${endTime - startTime}ms`,
        );
      }

      return result;
    }
    return renderFunction();
  }

  static logMemoryUsage(label) {
    if (__DEV__ && performance.memory) {
      console.log(`${label} - Memory Usage:`, {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB',
      });
    }
  }
}

/**
 * Image optimization utilities
 */
export const ImageOptimizer = {
  /**
   * Get optimized image dimensions based on screen size
   * @param {Object} screenDimensions - Screen width and height
   * @param {Object} originalDimensions - Original image width and height
   * @param {number} maxSize - Maximum size for the image
   */
  getOptimizedDimensions(screenDimensions, originalDimensions, maxSize = 400) {
    const { width: screenWidth } = screenDimensions;
    const { width: originalWidth, height: originalHeight } = originalDimensions;

    const aspectRatio = originalHeight / originalWidth;
    const targetWidth = Math.min(screenWidth * 0.8, maxSize);
    const targetHeight = targetWidth * aspectRatio;

    return {
      width: targetWidth,
      height: targetHeight,
    };
  },

  /**
   * Generate srcSet for responsive images
   * @param {string} baseUrl - Base image URL
   * @param {Array} sizes - Array of sizes to generate
   */
  generateSrcSet(baseUrl, sizes = [200, 400, 800]) {
    return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ');
  },
};

/**
 * List optimization utilities for FlatList performance
 */
export const ListOptimizer = {
  /**
   * Get optimized FlatList props for better performance
   * @param {number} itemHeight - Estimated item height
   * @param {number} screenHeight - Screen height
   */
  getOptimizedProps(itemHeight = 100, screenHeight = 800) {
    const windowSize = Math.ceil(screenHeight / itemHeight) + 2;
    const initialNumToRender = Math.min(windowSize, 10);

    return {
      windowSize,
      initialNumToRender,
      maxToRenderPerBatch: 5,
      updateCellsBatchingPeriod: 100,
      removeClippedSubviews: true,
      getItemLayout: (data, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      }),
    };
  },

  /**
   * Memoized keyExtractor for FlatList
   * @param {Object} item - List item
   * @param {number} index - Item index
   */
  keyExtractor: (item, index) => item.id?.toString() || index.toString(),

  /**
   * Generic renderItem function with memoization
   * @param {Function} ItemComponent - Component to render
   */
  createMemoizedRenderItem(ItemComponent) {
    return ({ item, index }) => (
      <ItemComponent key={item.id || index} item={item} index={index} />
    );
  },
};

/**
 * Bundle size optimization helpers
 */
export const BundleOptimizer = {
  /**
   * Lazy load components
   * @param {Function} importFunction - Dynamic import function
   */
  lazyLoad(importFunction) {
    return React.lazy(importFunction);
  },

  /**
   * Check if feature should be loaded based on conditions
   * @param {Object} conditions - Conditions to check
   */
  shouldLoadFeature(conditions) {
    const { userTier, deviceCapability, networkSpeed } = conditions;

    // Only load heavy features for premium users with good devices and network
    return (
      userTier === 'premium' &&
      deviceCapability === 'high' &&
      networkSpeed !== 'slow'
    );
  },
};

export default {
  useDebounce,
  useThrottle,
  useMemoizedSelector,
  PerformanceMonitor,
  ImageOptimizer,
  ListOptimizer,
  BundleOptimizer,
};