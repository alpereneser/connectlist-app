# ConnectList - Social List Sharing App

ConnectList is a modern social platform built with React Native and Expo that allows users to create, share, and discover curated lists of content across multiple categories including movies, books, games, places, and more.

## 🚀 Features

### Core Functionality
- **Multi-Category Lists**: Create lists for movies, TV shows, books, games, videos, music, poetry, places, and people
- **Social Feed**: Discover and interact with lists shared by other users
- **Real-time Search**: Search across different content categories using integrated APIs
- **User Profiles**: View your own and others' profiles with list collections
- **Social Interactions**: Like, comment, and share lists with the community

### User Experience
- **Modern UI/UX**: Clean, intuitive interface following iOS and Android design guidelines
- **Responsive Design**: Optimized for mobile devices with touch-friendly interactions
- **Dark/Light Themes**: Customizable appearance (coming soon)
- **Offline Support**: Basic caching for improved performance

### Technical Features
- **Authentication**: Secure user authentication with Supabase
- **Real-time Data**: Live updates using Supabase real-time subscriptions
- **API Integrations**: Multiple external APIs for content discovery
- **Image Handling**: Optimized image loading and caching
- **Navigation**: Smooth navigation with React Navigation

## 📱 Screenshots

*Screenshots will be added here*

## 🛠 Tech Stack

### Frontend
- **React Native** with Expo SDK
- **React Navigation** for routing
- **Phosphor React Native** for icons
- **React Native Status Bar Height** for safe area handling

### Backend & Services
- **Supabase** - Backend as a Service (Database, Auth, Real-time)
- **PostgreSQL** - Primary database
- **Supabase Storage** - File and image storage

### External APIs
- **TMDB API** - Movies, TV shows, and celebrity data
- **Google Books API** - Book information and search
- **RAWG API** - Video game database
- **YouTube API** - Video content search
- **Yandex Maps API** - Places and location search

## 🏗 Project Structure

```
connectlist_expo/
├── components/          # Reusable UI components
│   ├── Header.js       # App header with navigation
│   ├── BottomMenu.js   # Bottom navigation menu
│   ├── SubHeader.js    # Category filter header
│   └── CategoryPopup.js # Category selection modal
├── screens/            # Application screens
│   ├── HomeScreen.js   # Main feed screen
│   ├── SearchScreen.js # Search functionality
│   ├── ProfileScreen.js # User profiles
│   ├── CreateListScreen.js # List creation flow
│   ├── ListDetailScreen.js # Individual list view
│   └── auth/          # Authentication screens
├── services/          # API service layers
│   ├── tmdbService.js  # TMDB API integration
│   ├── googleBooksService.js # Google Books API
│   ├── rawgService.js  # RAWG Games API
│   ├── youtubeService.js # YouTube API
│   └── yandexService.js # Yandex Places API
├── contexts/          # React contexts
│   └── AuthContext.js # Authentication state management
└── assets/           # Static assets (images, fonts)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alpereneser/connectlist-app.git
   cd connectlist-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_SUPABASE_SERVICE_ROLE=your_supabase_service_role_key
   SUPABASE_JWT_SECRET=your_supabase_jwt_secret
   
   # External API Keys
   TMDB_API_KEY=your_tmdb_api_key
   GOOGLE_BOOKS_API_KEY=your_google_books_api_key
   RAWG_API_KEY=your_rawg_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   YANDEX_API_KEY=your_yandex_api_key
   ```

4. **Set up Supabase Database**
   
   Run the following SQL commands in your Supabase SQL editor:
   
   ```sql
   -- Create categories table
   CREATE TABLE categories (
     id SERIAL PRIMARY KEY,
     name VARCHAR(50) UNIQUE NOT NULL,
     icon VARCHAR(50),
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Insert default categories
   INSERT INTO categories (name) VALUES 
   ('movie'), ('tv'), ('book'), ('game'), 
   ('video'), ('music'), ('poetry'), ('place'), ('person');
   
   -- Create other necessary tables (lists, list_items, users, etc.)
   -- See Supabase documentation for complete schema
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

6. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## 🔧 Configuration

### API Keys Setup
You'll need to obtain API keys from the following services:

1. **Supabase**: Create a project at [supabase.com](https://supabase.com)
2. **TMDB**: Get API key from [themoviedb.org](https://www.themoviedb.org/settings/api)
3. **Google Books**: Enable Books API in [Google Cloud Console](https://console.cloud.google.com)
4. **RAWG**: Register at [rawg.io](https://rawg.io/apidocs)
5. **YouTube**: Enable YouTube Data API v3 in Google Cloud Console
6. **Yandex**: Get API key from [Yandex Developer](https://developer.tech.yandex.ru/)

### Database Schema
The app uses Supabase with the following main tables:
- `users` - User profiles and authentication
- `categories` - Content categories
- `lists` - User-created lists
- `list_items` - Items within lists
- `likes` - List likes/favorites
- `comments` - List comments
- `follows` - User follow relationships

## 🎨 UI/UX Features

### Design System
- **Colors**: Orange primary (#f97316), neutral grays
- **Typography**: System fonts with proper scaling
- **Spacing**: Consistent 4px grid system
- **Icons**: Phosphor icon family for consistency

### Responsive Design
- **Touch Targets**: Minimum 44px for accessibility
- **Scaling**: %20 larger UI elements for better usability
- **Layout**: Adaptive layouts for different screen sizes

### User Interactions
- **Gestures**: Intuitive swipe and tap interactions
- **Feedback**: Visual feedback for all interactions
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages

## 🚀 Deployment

### Expo Build
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure build
eas build:configure

# Build for production
eas build --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow React Native best practices
- Use TypeScript for new features (migration in progress)
- Write meaningful commit messages
- Test on both iOS and Android
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Alperen Eser**
- GitHub: [@alpereneser](https://github.com/alpereneser)
- Email: [your-email@example.com]

## 🙏 Acknowledgments

- **Expo Team** for the amazing development platform
- **Supabase** for the backend infrastructure
- **Phosphor Icons** for the beautiful icon set
- **TMDB, Google Books, RAWG, YouTube, Yandex** for their APIs
- **React Native Community** for the ecosystem

## 📊 Roadmap

### Version 2.0
- [ ] Real-time messaging system
- [ ] Push notifications
- [ ] Advanced search filters
- [ ] List collaboration features
- [ ] Analytics dashboard

### Version 2.1
- [ ] Dark theme implementation
- [ ] Offline-first architecture
- [ ] Advanced recommendation engine
- [ ] Social features expansion

### Version 3.0
- [ ] Web application (React)
- [ ] Desktop application (Electron)
- [ ] Advanced moderation tools
- [ ] Monetization features

## 🐛 Known Issues

- [ ] Places API occasionally returns demo data
- [ ] Image loading optimization needed for large lists
- [ ] Search debouncing could be improved

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/alpereneser/connectlist-app/issues) page
2. Create a new issue with detailed description
3. Include device/OS information and steps to reproduce

---

**Built with ❤️ using React Native and Expo**