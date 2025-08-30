# Apple App Store Connect API Key Kurulumu

EAS Build'de iOS uygulamanızı yayınlamak için Apple App Store Connect API Key'i gereklidir.

## 1. ASC API Key Oluşturma

### Apple Developer Portal'da:
1. [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)'a giriş yapın
2. **Certificates, Identifiers & Profiles** > **Keys** bölümüne gidin
3. **+** butonuna tıklayarak yeni key oluşturun
4. Key adını girin (örn: "EAS Build Key")
5. **App Store Connect API** seçeneğini işaretleyin
6. **Continue** ve **Register** butonlarına tıklayın
7. **.p8 dosyasını indirin** (bu dosyayı kaybetmeyin!)
8. **Key ID**'yi not alın (10 karakter)

### App Store Connect'te:
1. [App Store Connect](https://appstoreconnect.apple.com)'e giriş yapın
2. **Users and Access** > **Keys** bölümüne gidin
3. **Issuer ID**'yi kopyalayın (UUID formatında)

### Apple Team ID:
1. [Apple Developer Portal](https://developer.apple.com/account/)'da **Membership** bölümüne gidin
2. **Team ID**'yi kopyalayın (10 karakter)

## 2. EAS Dashboard'da Environment Variables Ekleme

### EAS Dashboard'a giriş:
1. [EAS Dashboard](https://expo.dev/)'a giriş yapın
2. Projenizi seçin
3. **Environment Variables** bölümüne gidin

### Gerekli Variables:

#### 1. ASC API Key Dosyası (Secret File):
- **Name:** `EXPO_ASC_API_KEY_PATH`
- **Type:** Secret File
- **Environment:** production
- **File:** İndirdiğiniz .p8 dosyasını yükleyin

#### 2. Key ID (Sensitive):
- **Name:** `EXPO_ASC_KEY_ID`
- **Type:** Sensitive
- **Environment:** production
- **Value:** 10 karakterlik Key ID

#### 3. Issuer ID (Sensitive):
- **Name:** `EXPO_ASC_ISSUER_ID`
- **Type:** Sensitive
- **Environment:** production
- **Value:** UUID formatındaki Issuer ID

#### 4. Apple Team ID (Sensitive):
- **Name:** `EXPO_APPLE_TEAM_ID`
- **Type:** Sensitive
- **Environment:** production
- **Value:** 10 karakterlik Team ID

#### 5. Apple Team Type (Plain Text):
- **Name:** `EXPO_APPLE_TEAM_TYPE`
- **Type:** Plain Text
- **Environment:** production
- **Value:** `COMPANY_OR_ORGANIZATION` (veya `INDIVIDUAL` / `IN_HOUSE`)

## 3. Build Komutu

Environment variables ayarlandıktan sonra:

```bash
# iOS production build
npx eas build --platform ios --profile production

# Veya her iki platform
npx eas build --platform all --profile production
```

## 4. Sorun Giderme

### Bundle Identifier Uyumsuzluğu:
- `app.json`'daki `ios.bundleIdentifier` değeri provisioning profile ile eşleşmelidir
- Mevcut değer: `me.connectlist.app`

### Credentials Sorunları:
- EAS Dashboard'da **Credentials** bölümünden mevcut sertifikaları kontrol edin
- Gerekirse yeni provisioning profile oluşturun

### Environment Variables:
- Tüm gerekli environment variables'ların doğru environment'ta (production) tanımlandığından emin olun
- Secret file'ların doğru yüklendiğini kontrol edin

## 5. Güvenlik Notları

- ⚠️ **ASC API Key dosyasını (.p8) asla git repository'ye eklemeyin**
- ⚠️ **Key ID, Issuer ID ve Team ID'yi kod içinde hardcode etmeyin**
- ✅ **Sadece EAS Dashboard environment variables kullanın**
- ✅ **Secret ve Sensitive tiplerini kullanın**

## Daha Fazla Bilgi

- [EAS Build Environment Variables](https://docs.expo.dev/eas/environment-variables/)
- [Building on CI](https://docs.expo.dev/build/building-on-ci/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api)