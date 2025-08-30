import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Colors, Fonts } from '../constants';

const PrivacyPolicy = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gizlilik Politikası</Text>
      <Text style={styles.lastUpdated}>Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Giriş</Text>
        <Text style={styles.text}>
          ConnectList uygulaması olarak, kullanıcılarımızın gizliliğini korumayı ve kişisel verilerini güvenli bir şekilde işlemeyi taahhüt ediyoruz. Bu gizlilik politikası, kişisel verilerinizi nasıl topladığımızı, kullandığımızı, sakladığımızı ve koruduğumuzu açıklamaktadır.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Topladığımız Bilgiler</Text>
        <Text style={styles.subTitle}>2.1 Hesap Bilgileri</Text>
        <Text style={styles.text}>
          • E-posta adresi{"\n"}
          • Kullanıcı adı{"\n"}
          • Profil fotoğrafı (isteğe bağlı){"\n"}
          • Biyografi (isteğe bağlı)
        </Text>
        
        <Text style={styles.subTitle}>2.2 Uygulama Kullanım Verileri</Text>
        <Text style={styles.text}>
          • Oluşturduğunuz listeler ve içerikleri{"\n"}
          • Mesajlaşma geçmişi{"\n"}
          • Beğeni ve yorumlar{"\n"}
          • Uygulama içi aktiviteler
        </Text>
        
        <Text style={styles.subTitle}>2.3 Teknik Bilgiler</Text>
        <Text style={styles.text}>
          • Cihaz bilgileri (model, işletim sistemi){"\n"}
          • IP adresi{"\n"}
          • Uygulama kullanım istatistikleri{"\n"}
          • Hata raporları (anonim)
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Bilgileri Nasıl Kullanıyoruz</Text>
        <Text style={styles.text}>
          • Hesabınızı oluşturmak ve yönetmek{"\n"}
          • Uygulama hizmetlerini sağlamak{"\n"}
          • Kullanıcı deneyimini geliştirmek{"\n"}
          • Güvenlik ve dolandırıcılık önleme{"\n"}
          • Teknik destek sağlamak{"\n"}
          • Yasal yükümlülükleri yerine getirmek
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Bilgi Paylaşımı</Text>
        <Text style={styles.text}>
          Kişisel verilerinizi üçüncü taraflarla paylaşmayız, satmayız veya kiralamayız. Aşağıdaki durumlar istisnadır:{"\n\n"}
          • Yasal zorunluluklar{"\n"}
          • Güvenlik tehditleri{"\n"}
          • Hizmet sağlayıcıları (şifrelenmiş veri){"\n"}
          • Kullanıcı onayı ile
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Veri Güvenliği</Text>
        <Text style={styles.text}>
          • Tüm veriler şifrelenerek saklanır{"\n"}
          • Güvenli sunucu altyapısı (Supabase){"\n"}
          • Düzenli güvenlik güncellemeleri{"\n"}
          • Erişim kontrolü ve izleme{"\n"}
          • HTTPS protokolü kullanımı
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Kullanıcı Hakları</Text>
        <Text style={styles.text}>
          KVKK kapsamında aşağıdaki haklara sahipsiniz:{"\n\n"}
          • Verilerinize erişim hakkı{"\n"}
          • Düzeltme hakkı{"\n"}
          • Silme hakkı{"\n"}
          • İşlemeyi sınırlama hakkı{"\n"}
          • Veri taşınabilirliği hakkı{"\n"}
          • İtiraz etme hakkı
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Çerezler ve Takip</Text>
        <Text style={styles.text}>
          Uygulama deneyimini geliştirmek için minimal düzeyde yerel depolama kullanıyoruz. Bu veriler cihazınızda saklanır ve kişisel kimlik bilgilerinizi içermez.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Çocukların Gizliliği</Text>
        <Text style={styles.text}>
          Uygulamamız 13 yaş altındaki çocuklara yönelik değildir. 13 yaş altındaki kullanıcılardan bilerek kişisel bilgi toplamayız.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Değişiklikler</Text>
        <Text style={styles.text}>
          Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler durumunda kullanıcılarımızı bilgilendireceğiz.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. İletişim</Text>
        <Text style={styles.text}>
          Gizlilik politikası ile ilgili sorularınız için:{"\n\n"}
          E-posta: privacy@connectlist.app{"\n"}
          Adres: [Şirket Adresi]{"\n"}
          Telefon: [İletişim Numarası]
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

export default PrivacyPolicy;