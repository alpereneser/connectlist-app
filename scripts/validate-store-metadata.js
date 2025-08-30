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

function validateFile(filePath, maxLength = null) {
  if (!fs.existsSync(filePath)) {
    log('red', `❌ Eksik dosya: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8').trim();
  
  if (!content) {
    log('red', `❌ Boş dosya: ${filePath}`);
    return false;
  }
  
  if (maxLength && content.length > maxLength) {
    log('yellow', `⚠️  Uzun içerik (${content.length}/${maxLength}): ${filePath}`);
    return false;
  }
  
  log('green', `✅ ${path.basename(filePath)} - ${content.length} karakter`);
  return true;
}

function validateJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    log('red', `❌ Eksik JSON: ${filePath}`);
    return false;
  }
  
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    log('green', `✅ ${path.basename(filePath)} - Geçerli JSON`);
    return true;
  } catch (error) {
    log('red', `❌ Geçersiz JSON: ${filePath} - ${error.message}`);
    return false;
  }
}

function validateScreenshots(platform) {
  const screenshotDir = path.join(__dirname, '..', 'store', 'screenshots', platform);
  
  if (!fs.existsSync(screenshotDir)) {
    log('red', `❌ Screenshot klasörü bulunamadı: ${platform}`);
    return false;
  }
  
  const subdirs = fs.readdirSync(screenshotDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  if (subdirs.length === 0) {
    log('yellow', `⚠️  Screenshot alt klasörleri bulunamadı: ${platform}`);
    return false;
  }
  
  let hasScreenshots = false;
  
  subdirs.forEach(subdir => {
    const subdirPath = path.join(screenshotDir, subdir);
    const files = fs.readdirSync(subdirPath)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
    
    if (files.length > 0) {
      log('green', `✅ ${platform}/${subdir} - ${files.length} screenshot`);
      hasScreenshots = true;
    } else {
      log('yellow', `⚠️  ${platform}/${subdir} - Screenshot yok`);
    }
  });
  
  return hasScreenshots;
}

function main() {
  log('blue', '🔍 Store Metadata Doğrulaması Başlıyor...');
  console.log('');
  
  let isValid = true;
  
  // App Store Metadata
  log('blue', '📱 App Store Metadata:');
  isValid &= validateFile('store/metadata/app-store/description.txt', 4000);
  isValid &= validateFile('store/metadata/app-store/keywords.txt', 100);
  isValid &= validateJSON('store/metadata/app-store/app-store-info.json');
  console.log('');
  
  // Google Play Metadata
  log('blue', '🤖 Google Play Metadata:');
  isValid &= validateFile('store/metadata/google-play/description.txt', 4000);
  isValid &= validateFile('store/metadata/google-play/short-description.txt', 80);
  isValid &= validateJSON('store/metadata/google-play/play-store-info.json');
  console.log('');
  
  // Screenshots
  log('blue', '📸 Screenshots:');
  const iosScreenshots = validateScreenshots('ios');
  const androidScreenshots = validateScreenshots('android');
  isValid &= (iosScreenshots || androidScreenshots);
  console.log('');
  
  // App.json kontrolü
  log('blue', '⚙️  App Konfigürasyonu:');
  isValid &= validateJSON('app.json');
  isValid &= validateJSON('eas.json');
  console.log('');
  
  // Sonuç
  if (isValid) {
    log('green', '🎉 Tüm metadata doğrulaması başarılı!');
    log('green', '✅ Store\'a gönderilmeye hazır!');
  } else {
    log('red', '❌ Bazı dosyalar eksik veya hatalı!');
    log('yellow', '📋 Yukarıdaki hataları düzeltin ve tekrar deneyin.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateFile, validateJSON, validateScreenshots };