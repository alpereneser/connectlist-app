import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Colors, Fonts } from '../constants';

const TermsOfService = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Kullanım Şartları</Text>
      <Text style={styles.lastUpdated}>Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Kabul ve Onay</Text>
        <Text style={styles.text}>
          ConnectList uygulamasını kullanarak bu kullanım şartlarını kabul etmiş sayılırsınız. Bu şartları kabul etmiyorsanız, lütfen uygulamayı kullanmayın.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Hizmet Tanımı</Text>
        <Text style={styles.text}>
          ConnectList, kullanıcıların liste oluşturmasına, paylaşmasına ve diğer kullanıcılarla etkileşim kurmasına olanak sağlayan bir sosyal platform uygulamasıdır.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Kullanıcı Hesabı</Text>
        <Text style={styles.subTitle}>3.1 Hesap Oluşturma</Text>
        <Text style={styles.text}>
          • 13 yaş ve üzeri olmalısınız{"\n"}
          • Doğru ve güncel bilgiler sağlamalısınız{"\n"}
          • Hesap güvenliğinden sorumlusunuz{"\n"}
          • Şifrenizi kimseyle paylaşmamalısınız
        </Text>
        
        <Text style={styles.subTitle}>3.2 Hesap Sorumluluğu</Text>
        <Text style={styles.text}>
          Hesabınız altında gerçekleşen tüm aktivitelerden sorumlusunuz. Yetkisiz erişim durumunda derhal bizi bilgilendirin.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Kabul Edilebilir Kullanım</Text>
        <Text style={styles.subTitle}>4.1 İzin Verilen Kullanım</Text>
        <Text style={styles.text}>
          • Kişisel, ticari olmayan kullanım{"\n"}
          • Yasal içerik paylaşımı{"\n"}
          • Saygılı iletişim{"\n"}
          • Topluluk kurallarına uyum
        </Text>
        
        <Text style={styles.subTitle}>4.2 Yasaklanan Aktiviteler</Text>
        <Text style={styles.text}>
          • Yasadışı içerik paylaşımı{"\n"}
          • Spam veya istenmeyen mesajlar{"\n"}
          • Telif hakkı ihlali{"\n"}
          • Nefret söylemi veya taciz{"\n"}
          • Sahte hesap oluşturma{"\n"}
          • Sistem güvenliğini tehdit etme{"\n"}
          • Diğer kullanıcıları aldatma
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. İçerik ve Fikri Mülkiyet</Text>
        <Text style={styles.subTitle}>5.1 Kullanıcı İçeriği</Text>
        <Text style={styles.text}>
          • Paylaştığınız içeriğin sahibi sizsiniz{"\n"}
          • İçeriğinizin yasal olduğunu garanti edersiniz{"\n"}
          • Bize sınırlı kullanım lisansı verirsiniz{"\n"}
          • İçeriğinizi istediğiniz zaman silebilirsiniz
        </Text>
        
        <Text style={styles.subTitle}>5.2 Uygulama İçeriği</Text>
        <Text style={styles.text}>
          Uygulama tasarımı, logosu ve özellikleri ConnectList'in fikri mülkiyetidir. İzinsiz kullanım yasaktır.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Gizlilik</Text>
        <Text style={styles.text}>
          Kişisel verilerinizin işlenmesi Gizlilik Politikamız kapsamında düzenlenir. Gizlilik Politikasını okuyup anladığınızı kabul edersiniz.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Hizmet Değişiklikleri</Text>
        <Text style={styles.text}>
          • Hizmeti istediğimiz zaman değiştirebiliriz{"\n"}
          • Önemli değişiklikleri önceden duyururuz{"\n"}
          • Hizmeti geçici olarak durdurabilir veya sonlandırabiliriz{"\n"}
          • Yeni özellikler ekleyebilir veya mevcut özellikleri kaldırabiliriz
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Hesap Sonlandırma</Text>
        <Text style={styles.subTitle}>8.1 Kullanıcı Tarafından</Text>
        <Text style={styles.text}>
          Hesabınızı istediğiniz zaman silebilirsiniz. Silme işlemi geri alınamaz.
        </Text>
        
        <Text style={styles.subTitle}>8.2 Platform Tarafından</Text>
        <Text style={styles.text}>
          Kullanım şartlarını ihlal etmeniz durumunda hesabınızı askıya alabilir veya sonlandırabiliriz.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Sorumluluk Reddi</Text>
        <Text style={styles.text}>
          • Hizmet "olduğu gibi" sağlanır{"\n"}
          • Kesintisiz hizmet garantisi vermeyiz{"\n"}
          • Kullanıcı içeriğinden sorumlu değiliz{"\n"}
          • Üçüncü taraf bağlantılarından sorumlu değiliz{"\n"}
          • Veri kaybından sorumlu değiliz
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. Sorumluluk Sınırlaması</Text>
        <Text style={styles.text}>
          Yasal olarak izin verilen maksimum ölçüde, ConnectList'in sorumluluğu sınırlıdır. Dolaylı, özel veya sonuçsal zararlardan sorumlu değiliz.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>11. Uygulanacak Hukuk</Text>
        <Text style={styles.text}>
          Bu şartlar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklar Türkiye mahkemelerinde çözülür.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>12. Değişiklikler</Text>
        <Text style={styles.text}>
          Bu kullanım şartlarını zaman zaman güncelleyebiliriz. Önemli değişiklikleri uygulama içinde duyururuz. Güncellemelerden sonra uygulamayı kullanmaya devam etmeniz yeni şartları kabul ettiğiniz anlamına gelir.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>13. İletişim</Text>
        <Text style={styles.text}>
          Kullanım şartları ile ilgili sorularınız için:{"\n\n"}
          E-posta: legal@connectlist.app{"\n"}
          Adres: [Şirket Adresi]{"\n"}
          Telefon: [İletişim Numarası]
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>14. Yürürlük</Text>
        <Text style={styles.text}>
          Bu kullanım şartları {new Date().toLocaleDateString('tr-TR')} tarihinden itibaren yürürlüktedir.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  text: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.text,
    lineHeight: 20,
  },
});

export default TermsOfService;