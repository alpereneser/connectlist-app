import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynbwiarxodetyirhmcbp.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluYndpYXJ4b2RldHlpcmhtY2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MTQzMzMsImV4cCI6MjA1NjQ5MDMzM30.zwO86rBSmPBYCEmecINSQOHG-0e5_Tsb1ZLucR8QP6Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreDatabase() {
  console.log('🔍 Supabase Veritabanı Yapısı Analizi\n');

  try {
    // 1. Tüm tabloları listele
    console.log('📋 TABLOLAR:');
    console.log('='.repeat(50));

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_type', 'BASE TABLE')
      .in('table_schema', ['public', 'auth', 'storage']);

    if (tablesError) {
      console.log('❌ Tablolar alınamadı:', tablesError.message);

      // Alternatif yöntem: Bilinen tabloları test et
      console.log('\n🔄 Alternatif yöntemle tablolar kontrol ediliyor...');
      const testTables = [
        'profiles',
        'messages',
        'users',
        'posts',
        'comments',
        'categories',
        'lists',
        'connections',
      ];

      for (const tableName of testTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (!error) {
            console.log(`✅ ${tableName} tablosu mevcut`);

            // Tablo yapısını öğren
            const { data: columns, error: columnsError } = await supabase
              .from('information_schema.columns')
              .select('column_name, data_type, is_nullable, column_default')
              .eq('table_name', tableName)
              .eq('table_schema', 'public');

            if (!columnsError && columns) {
              console.log(`   Sütunlar:`);
              columns.forEach(col => {
                console.log(
                  `   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`
                );
              });
            }

            // Örnek veri göster
            if (data && data.length > 0) {
              console.log(`   Örnek veri:`, JSON.stringify(data[0], null, 2));
            }
            console.log('');
          }
        } catch (err) {
          // Tablo mevcut değil, sessizce geç
        }
      }
    } else if (tables) {
      tables.forEach(table => {
        console.log(`📄 ${table.table_schema}.${table.table_name}`);
      });
    }

    // 2. Mevcut tabloların detaylı analizi
    console.log('\n🔍 DETAYLI TABLO ANALİZİ:');
    console.log('='.repeat(50));

    // Profiles tablosu
    console.log('\n👤 PROFILES TABLOSU:');
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(3);

      if (!profilesError) {
        console.log('✅ Profiles tablosu erişilebilir');
        console.log('Kayıt sayısı:', profilesData?.length || 0);
        if (profilesData && profilesData.length > 0) {
          console.log('Örnek kayıt:', JSON.stringify(profilesData[0], null, 2));
          console.log('Tüm sütunlar:', Object.keys(profilesData[0]).join(', '));
        }
      } else {
        console.log('❌ Profiles tablosu hatası:', profilesError.message);
      }
    } catch (err) {
      console.log('❌ Profiles tablosu erişim hatası:', err.message);
    }

    // Messages tablosu
    console.log('\n💬 MESSAGES TABLOSU:');
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .limit(3);

      if (!messagesError) {
        console.log('✅ Messages tablosu erişilebilir');
        console.log('Kayıt sayısı:', messagesData?.length || 0);
        if (messagesData && messagesData.length > 0) {
          console.log('Örnek kayıt:', JSON.stringify(messagesData[0], null, 2));
          console.log('Tüm sütunlar:', Object.keys(messagesData[0]).join(', '));
        }
      } else {
        console.log('❌ Messages tablosu hatası:', messagesError.message);
      }
    } catch (err) {
      console.log('❌ Messages tablosu erişim hatası:', err.message);
    }

    // 3. Auth kullanıcıları kontrol et
    console.log('\n🔐 AUTH KULLANICILARI:');
    console.log('='.repeat(50));

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (user) {
        console.log('✅ Aktif kullanıcı var:', user.email);
        console.log('Kullanıcı ID:', user.id);
        console.log(
          'E-posta doğrulandı:',
          user.email_confirmed_at ? 'Evet' : 'Hayır'
        );
        console.log('Son giriş:', user.last_sign_in_at);
      } else {
        console.log('ℹ️ Aktif kullanıcı yok');
      }
    } catch (err) {
      console.log('❌ Auth kullanıcı bilgisi alınamadı:', err.message);
    }

    // 4. RLS (Row Level Security) politikalarını kontrol et
    console.log('\n🛡️ GÜVENLİK POLİTİKALARI:');
    console.log('='.repeat(50));

    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('tablename, policyname, permissive, roles, cmd, qual')
        .in('schemaname', ['public']);

      if (!policiesError && policies) {
        console.log(`✅ ${policies.length} güvenlik politikası bulundu:`);
        policies.forEach(policy => {
          console.log(
            `- ${policy.tablename}.${policy.policyname} (${policy.cmd})`
          );
        });
      } else {
        console.log('ℹ️ Güvenlik politikaları görüntülenemedi (normal durum)');
      }
    } catch (err) {
      console.log('ℹ️ Güvenlik politikaları kontrol edilemedi (normal durum)');
    }

    // 5. Veritabanı istatistikleri
    console.log('\n📊 VERİTABANI İSTATİSTİKLERİ:');
    console.log('='.repeat(50));

    // Profiles tablosu istatistikleri
    try {
      const { count: profilesCount, error: profilesCountError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (!profilesCountError) {
        console.log(`👤 Profiles: ${profilesCount} kayıt`);
      }
    } catch (err) {
      console.log('👤 Profiles: Sayım yapılamadı');
    }

    // Messages tablosu istatistikleri
    try {
      const { count: messagesCount, error: messagesCountError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      if (!messagesCountError) {
        console.log(`💬 Messages: ${messagesCount} kayıt`);
      }
    } catch (err) {
      console.log('💬 Messages: Sayım yapılamadı');
    }

    // 6. Supabase yapılandırması
    console.log('\n⚙️ SUPABASE YAPILANDIRMASI:');
    console.log('='.repeat(50));
    console.log('URL:', supabaseUrl);
    console.log('Proje Ref:', 'ynbwiarxodetyirhmcbp');
    console.log('Anahtar türü: Anon (Public)');

    // 7. Realtime özelliklerini kontrol et
    console.log('\n🔄 REALTIME ÖZELLİKLERİ:');
    console.log('='.repeat(50));

    try {
      // Realtime bağlantısını test et
      const channel = supabase.channel('test-channel');
      console.log('✅ Realtime kanalı oluşturulabilir');

      // Kanalı temizle
      supabase.removeChannel(channel);
    } catch (err) {
      console.log('❌ Realtime özelliği kullanılamıyor:', err.message);
    }

    console.log('\n✅ Veritabanı analizi tamamlandı!');
  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

// Scripti çalıştır
exploreDatabase();
