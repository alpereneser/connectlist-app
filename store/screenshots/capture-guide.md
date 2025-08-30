# Ekran Görüntüsü Alma Rehberi

## 📱 Gerekli Boyutlar

### iOS App Store
- **iPhone 6.7"** (1290x2796) - iPhone 14 Pro Max, 15 Pro Max
- **iPhone 5.5"** (1242x2208) - iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus
- **iPad 12.9"** (2048x2732) - iPad Pro 12.9"
- **iPad 10.5"** (1668x2224) - iPad Air, iPad Pro 10.5"

### Android Google Play
- **Phone** (1080x1920) - Standart telefon
- **7-inch Tablet** (1024x600) - Küçük tablet
- **10-inch Tablet** (1280x800) - Büyük tablet

## 🎯 Önerilen Ekran Görüntüleri (5 adet)

1. **Ana Ekran (Home)**
   - Liste görünümü
   - Popüler listeler
   - Navigasyon menüsü

2. **Arama Ekranı**
   - Arama çubuğu
   - Kategori filtreleri
   - Arama sonuçları

3. **Liste Detayı**
   - Liste içeriği
   - Beğeni ve yorum sayıları
   - Paylaşım seçenekleri

4. **Profil Ekranı**
   - Kullanıcı bilgileri
   - Oluşturulan listeler
   - Takipçi/takip edilen sayıları

5. **Liste Oluşturma**
   - Yeni liste formu
   - Kategori seçimi
   - İçerik ekleme

## 🛠️ Manuel Alma Yöntemi

### iOS Simulator
```bash
# iOS Simulator başlat
npx expo start --ios

# Simulator'da Device > Screenshots menüsünden
# Cmd+S ile ekran görüntüsü al
```

### Android Emulator
```bash
# Android Emulator başlat
npx expo start --android

# Emulator'da Extended Controls > Camera > Screenshot
# veya Ctrl+S (Windows) / Cmd+S (Mac)
```

## 📐 Boyut Ayarlama

### iOS Simulator Boyutları
```bash
# iPhone 14 Pro Max (6.7")
Device > iPhone 14 Pro Max

# iPhone 8 Plus (5.5")
Device > iPhone 8 Plus

# iPad Pro 12.9"
Device > iPad Pro (12.9-inch)

# iPad Air (10.5")
Device > iPad Air (4th generation)
```

### Android Emulator Boyutları
```bash
# Phone (1080x1920)
Pixel 4 - API 30

# 7-inch Tablet
Nexus 7 - API 30

# 10-inch Tablet
Pixel C - API 30
```

## 🎨 Screenshot İpuçları

1. **Temiz Veri Kullanın**
   - Demo hesabı ile gerçekçi veriler
   - Türkçe içerik kullanın
   - Sayfa yükleme göstergelerini bekleyin

2. **UI Durumu**
   - Status bar'ı temizleyin
   - Keyboard kapalı olsun
   - Loading state'leri göstermeyin

3. **İçerik Kalitesi**
   - Yüksek kaliteli görseller
   - Okunabilir metinler
   - Tutarlı tasarım

## 📁 Dosya Organizasyonu

```
screenshots/
├── ios/
│   ├── iphone-6.7/
│   │   ├── 01-home.png
│   │   ├── 02-search.png
│   │   ├── 03-list-detail.png
│   │   ├── 04-profile.png
│   │   └── 05-create-list.png
│   ├── iphone-5.5/
│   ├── ipad-12.9/
│   └── ipad-10.5/
└── android/
    ├── phone/
    ├── 7-inch-tablet/
    └── 10-inch-tablet/
```

## ✅ Kalite Kontrol

- [ ] Doğru boyutlarda
- [ ] PNG formatında
- [ ] Yüksek çözünürlük
- [ ] Temiz UI (loading yok)
- [ ] Gerçekçi içerik
- [ ] Tutarlı tasarım
- [ ] Okunabilir metinler
- [ ] Marka uyumlu renkler

## 🚀 Otomatik Alma (Gelecek)

```bash
# Detox ile otomatik screenshot
npm run test:e2e:screenshots

# Fastlane ile otomatik upload
npm run upload:screenshots
```