# Store Deployment Rehberi

## 📁 Klasör Yapısı

```
store/
├── metadata/
│   ├── app-store/
│   │   ├── description.txt
│   │   ├── keywords.txt
│   │   ├── release-notes.txt
│   │   └── app-store-info.json
│   └── google-play/
│       ├── description.txt
│       ├── short-description.txt
│       ├── release-notes.txt
│       └── play-store-info.json
├── screenshots/
│   ├── ios/
│   │   ├── iphone-6.5/
│   │   ├── iphone-5.5/
│   │   ├── ipad-12.9/
│   │   └── ipad-10.5/
│   └── android/
│       ├── phone/
│       ├── 7-inch-tablet/
│       └── 10-inch-tablet/
└── assets/
    ├── feature-graphic.png
    ├── promo-video.mp4
    └── marketing-materials/
```

## 📝 Store Metadata

### App Store (iOS)
- **Konum:** `store/metadata/app-store/`
- **Gerekli Dosyalar:**
  - `description.txt` - Uygulama açıklaması (4000 karakter)
  - `keywords.txt` - Anahtar kelimeler (100 karakter)
  - `release-notes.txt` - Sürüm notları
  - `app-store-info.json` - Kategori, yaş sınırı vb.

### Google Play Store (Android)
- **Konum:** `store/metadata/google-play/`
- **Gerekli Dosyalar:**
  - `description.txt` - Uzun açıklama (4000 karakter)
  - `short-description.txt` - Kısa açıklama (80 karakter)
  - `release-notes.txt` - Sürüm notları
  - `play-store-info.json` - Kategori, içerik derecelendirmesi vb.

## 📱 Ekran Görüntüleri

### iOS Gereksinimleri
- **iPhone 6.7"** (1290x2796): Ana ekranlar için
- **iPhone 5.5"** (1242x2208): Eski cihazlar için
- **iPad 12.9"** (2048x2732): Büyük tablet
- **iPad 10.5"** (1668x2224): Küçük tablet

### Android Gereksinimleri
- **Phone** (1080x1920): Telefon ekranları
- **7-inch Tablet** (1024x600): Küçük tablet
- **10-inch Tablet** (1280x800): Büyük tablet

## 🎯 Önerilen Ekran Görüntüleri

1. **Ana Ekran** - Liste görünümü
2. **Arama Ekranı** - Arama fonksiyonu
3. **Liste Detayı** - Liste içeriği
4. **Profil Ekranı** - Kullanıcı profili
5. **Kayıt Ekranı** - Kullanıcı kaydı

## 🚀 Deployment Süreci

### 1. Metadata Hazırlığı
```bash
# Metadata dosyalarını doldur
npm run prepare:metadata
```

### 2. Ekran Görüntüleri
```bash
# Otomatik screenshot alma
npm run capture:screenshots
```

### 3. Build Hazırlığı
```bash
# Production build
npm run build:production
```

### 4. Store Upload
```bash
# App Store
npm run deploy:ios

# Google Play
npm run deploy:android
```

## 📋 Checklist

### Metadata
- [ ] App Store açıklaması yazıldı
- [ ] Google Play açıklaması yazıldı
- [ ] Anahtar kelimeler belirlendi
- [ ] Kategori seçildi
- [ ] Yaş sınırı belirlendi

### Görsel Materyaller
- [ ] iOS ekran görüntüleri çekildi
- [ ] Android ekran görüntüleri çekildi
- [ ] Feature graphic hazırlandı
- [ ] App icon kontrol edildi

### Teknik
- [ ] Production build test edildi
- [ ] Signing sertifikaları hazır
- [ ] Privacy Policy ve Terms eklendi
- [ ] Crash reporting aktif

## 🔧 Araçlar

- **Fastlane**: Otomatik deployment
- **Expo Application Services (EAS)**: Build ve submit
- **Screenshot automation**: Detox + screenshots
- **Metadata management**: deliver (fastlane)