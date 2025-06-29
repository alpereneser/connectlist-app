# Avatar Upload Setup Guide

## Supabase Storage Bucket Setup

Before using the avatar upload feature, you need to set up the storage bucket in Supabase.

### 1. Create Avatars Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** > **Buckets**
3. Click **"New bucket"**
4. Create a bucket named: `avatars`
5. Set it as **Public** (users need to access avatar images)

### 2. Set Up Storage Policies

Navigate to **Storage** > **Policies** and create these policies:

#### Insert Policy (Upload)
```sql
CREATE POLICY "Users can upload avatars to their own folder" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Select Policy (Read)
```sql
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

#### Update Policy (Replace)
```sql
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Delete Policy (Remove old avatars)
```sql
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. File Structure

The avatar service will create this folder structure:
```
avatars/
├── {user_id_1}/
│   ├── {user_id_1}_{timestamp}_{random}.jpg
│   └── {user_id_1}_{timestamp2}_{random}.jpg
├── {user_id_2}/
│   └── {user_id_2}_{timestamp}_{random}.jpg
└── ...
```

### 4. File Specifications

- **Max file size**: 5MB
- **Allowed formats**: JPEG, JPG, PNG, WebP
- **Processing**: Images are resized to 500x500px and compressed
- **Aspect ratio**: Square (1:1) enforced during selection
- **Quality**: 80% compression for optimal size/quality balance

### 5. Usage in Components

#### ProfileScreen (Own Profile)
```jsx
<AvatarUpload
  userId={profile.id}
  currentAvatarUrl={profile.avatar_url}
  fullName={profile.full_name}
  username={profile.username}
  size={120}
  onUploadSuccess={(result) => {
    // Update local state
    setProfile(prev => ({
      ...prev,
      avatar_url: result.avatarUrl
    }));
  }}
  onUploadError={(error) => {
    console.error('Avatar upload failed:', error);
  }}
/>
```

#### Other Screens (Display Only)
```jsx
<AvatarImage
  avatarUrl={user.avatar_url}
  fullName={user.full_name}
  username={user.username}
  size={48}
/>
```

### 6. Features

- **Permission handling**: Requests camera roll permissions
- **Image processing**: Automatic resize and compression
- **Fallback avatars**: Uses UI Avatars service for users without custom avatars
- **Old avatar cleanup**: Automatically deletes previous avatar when uploading new one
- **Error handling**: Comprehensive error messages and user feedback
- **Haptic feedback**: iOS haptic feedback for better UX
- **Accessibility**: Full accessibility support with screen reader labels

### 7. Security Features

- **User isolation**: Users can only upload to their own folder
- **File type validation**: Only image files allowed
- **Size limits**: 5MB maximum file size
- **Authenticated uploads**: Must be logged in to upload
- **Public read access**: Avatars are publicly readable (required for display)

### 8. Performance Optimizations

- **Image compression**: Reduces file sizes by ~80%
- **Resize processing**: Standardizes all avatars to 500x500px
- **CDN delivery**: Supabase Storage uses CDN for fast global delivery
- **Lazy loading**: Images load on-demand
- **Fallback URLs**: Instant fallback to generated avatars

### 9. Troubleshooting

#### Upload fails with "bucket not found"
- Ensure the `avatars` bucket exists in Supabase Storage
- Check bucket name is exactly `avatars`

#### Upload fails with "permission denied"
- Verify storage policies are created correctly
- Ensure user is authenticated
- Check user ID matches in policy

#### Images not displaying
- Verify bucket is set to **Public**
- Check the public URL structure
- Ensure Select policy allows public access

#### Large file upload fails
- Check file size (max 5MB)
- Verify image processing isn't failing
- Check device storage space