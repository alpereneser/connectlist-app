import { supabase } from '../utils/supabase';

// Returns a public URL for a given storage path or returns the input if it's already a full URL
export function getPublicUrl(path, bucket = 'avatars') {
  if (!path) {
    console.log('getPublicUrl: No path provided');
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    console.log('getPublicUrl: Path is already a full URL:', path);
    return path;
  }

  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    console.log(
      'getPublicUrl: Generated URL for path',
      path,
      ':',
      data?.publicUrl,
    );
    return data?.publicUrl || null;
  } catch (error) {
    console.log('getPublicUrl: Error generating URL:', error);
    return null;
  }
}
