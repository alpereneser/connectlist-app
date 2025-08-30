const fs = require('fs');
const path = require('path');

// Renk kodları
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log('green', `✅ Klasör oluşturuldu: ${dirPath}`);
  } else {
    log('yellow', `📁 Klasör zaten mevcut: ${dirPath}`);
  }
}

function createScreenshotDirectories() {
  log('blue', '📸 Screenshot klasörleri oluşturuluyor...');
  
  const screenshotDirs = [
    'store/screenshots/ios/iphone-6.7',
    'store/screenshots/ios/iphone-5.5',
    'store/screenshots/ios/ipad-12.9',
    'store/screenshots/ios/ipad-10.5',
    'store/screenshots/android/phone',
    'store/screenshots/android/7-inch-tablet',
    'store/screenshots/android/10-inch-tablet'
  ];
  
  screenshotDirs.forEach(dir => {
    createDirectory(dir);
  });
}

function createPlaceholderFiles() {
  log('blue', '📝 Placeholder dosyalar oluşturuluyor...');
  
  const placeholders = [
    {
      path: 'store/screenshots/ios/iphone-6.7/README.md',
      content: '# iPhone 6.7" Screenshots\n\nBoyut: 1290x2796\nFormat: PNG\nMaksimum: 10 adet\n\nGerekli ekranlar:\n1. Ana ekran\n2. Arama\n3. Liste detayı\n4. Profil\n5. Liste oluşturma'
    },
    {
      path: 'store/screenshots/android/phone/README.md',
      content: '# Android Phone Screenshots\n\nBoyut: 1080x1920\nFormat: PNG\nMaksimum: 8 adet\n\nGerekli ekranlar:\n1. Ana ekran\n2. Arama\n3. Liste detayı\n4. Profil\n5. Liste oluşturma'
    },
    {
      path: 'store/assets/feature-graphic-template.md',
      content: '# Feature Graphic\n\n**Google Play Store için gerekli**\n\nBoyut: 1024x500 px\nFormat: PNG veya JPG\nMaksimum boyut: 15MB\n\nİçerik:\n- Uygulama adı: ConnectList\n- Slogan: "Listeleyin, Paylaşın, Keşfedin"\n- Ana renkler: Mavi tonları\n- Görsel: Liste ve sosyal öğeler'
    },
    {
      path: 'store/metadata/release-notes-template.md',
      content: '# Release Notes Template\n\n## v1.0.0 - İlk Sürüm\n\n### 🎉 Yeni Özellikler\n- Film, kitap, müzik ve oyun listeleri\n- Sosyal paylaşım ve takip sistemi\n- Gelişmiş arama ve filtreleme\n- Güvenli kullanıcı hesabı yönetimi\n\n### 🔒 Güvenlik\n- End-to-end şifreleme\n- Gizlilik odaklı tasarım\n- GDPR uyumlu veri işleme\n\n### 📱 Platform Desteği\n- iOS 13.0+\n- Android 6.0+ (API 23)\n- React Native tabanlı'
    }
  ];
  
  placeholders.forEach(({ path: filePath, content }) => {
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    
    createDirectory(dir);
    
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content);
      log('green', `✅ Placeholder oluşturuldu: ${filePath}`);
    } else {
      log('yellow', `📄 Dosya zaten mevcut: ${filePath}`);
    }
  });
}

function updateAppJson() {
  log('blue', '⚙️  app.json güncelleniyor...');
  
  const appJsonPath = 'app.json';
  
  if (!fs.existsSync(appJsonPath)) {
    log('red', '❌ app.json bulunamadı!');
    return;
  }
  
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Store için gerekli alanları kontrol et ve ekle
    if (!appJson.expo.description) {
      appJson.expo.description = 'Sevdiğiniz film, kitap, müzik ve oyunları listeleyin, arkadaşlarınızla paylaşın!';
    }
    
    if (!appJson.expo.keywords) {
      appJson.expo.keywords = ['liste', 'film', 'kitap', 'müzik', 'sosyal', 'paylaşım'];
    }
    
    if (!appJson.expo.privacy) {
      appJson.expo.privacy = 'public';
    }
    
    if (!appJson.expo.category) {
      appJson.expo.category = 'social';
    }
    
    // iOS store bilgileri
    if (!appJson.expo.ios.config) {
      appJson.expo.ios.config = {};
    }
    
    if (!appJson.expo.ios.config.usesNonExemptEncryption) {
      appJson.expo.ios.config.usesNonExemptEncryption = false;
    }
    
    // Android store bilgileri
    if (!appJson.expo.android.versionCode) {
      appJson.expo.android.versionCode = 1;
    }
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    log('green', '✅ app.json güncellendi');
    
  } catch (error) {
    log('red', `❌ app.json güncellenirken hata: ${error.message}`);
  }
}

function generateChecklist() {
  log('blue', '📋 Store deployment checklist oluşturuluyor...');
  
  const checklist = `# Store Deployment Checklist

## 📝 Metadata
- [ ] App Store açıklaması (store/metadata/app-store/description.txt)
- [ ] Google Play açıklaması (store/metadata/google-play/description.txt)
- [ ] Anahtar kelimeler belirlendi
- [ ] Kategori seçildi
- [ ] Yaş sınırı belirlendi
- [ ] Privacy Policy URL'i eklendi
- [ ] Support URL'i eklendi

## 📱 Görsel Materyaller
- [ ] iOS screenshots (5 boyut için)
- [ ] Android screenshots (3 boyut için)
- [ ] App icon (1024x1024)
- [ ] Feature graphic (1024x500)
- [ ] Adaptive icon (Android)

## ⚙️ Teknik Hazırlık
- [ ] Production build test edildi
- [ ] EAS CLI kuruldu (npm install -g @expo/eas-cli)
- [ ] EAS hesabı oluşturuldu (eas login)
- [ ] Apple Developer hesabı (iOS için)
- [ ] Google Play Console hesabı (Android için)
- [ ] Signing certificates hazırlandı

## 🔒 Güvenlik & Uyumluluk
- [ ] Privacy Policy eklendi
- [ ] Terms of Service eklendi
- [ ] GDPR uyumluluğu kontrol edildi
- [ ] Crash reporting aktif
- [ ] Analytics kuruldu

## 🚀 Deployment
- [ ] \`npm run store:validate\` başarılı
- [ ] \`npm run build:all\` başarılı
- [ ] Test build'ler kontrol edildi
- [ ] Store listing bilgileri dolduruldu
- [ ] Review için gönderildi

## 📊 Post-Launch
- [ ] Store performansı takip ediliyor
- [ ] User feedback izleniyor
- [ ] Crash reports kontrol ediliyor
- [ ] Update planı hazırlandı
`;
  
  const checklistPath = 'store/deployment-checklist.md';
  fs.writeFileSync(checklistPath, checklist);
  log('green', `✅ Checklist oluşturuldu: ${checklistPath}`);
}

function main() {
  log('blue', '🚀 Store Assets Hazırlığı Başlıyor...');
  console.log('');
  
  try {
    createScreenshotDirectories();
    console.log('');
    
    createPlaceholderFiles();
    console.log('');
    
    updateAppJson();
    console.log('');
    
    generateChecklist();
    console.log('');
    
    log('green', '🎉 Store assets hazırlığı tamamlandı!');
    log('blue', '📋 Sonraki adımlar:');
    log('yellow', '1. Screenshots çekin (store/screenshots/capture-guide.md)');
    log('yellow', '2. Metadata\'ları gözden geçirin');
    log('yellow', '3. npm run store:validate çalıştırın');
    log('yellow', '4. EAS CLI ile build alın');
    
  } catch (error) {
    log('red', `❌ Hata oluştu: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createDirectory, createScreenshotDirectories, updateAppJson };