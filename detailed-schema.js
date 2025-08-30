import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynbwiarxodetyirhmcbp.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluYndpYXJ4b2RldHlpcmhtY2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MTQzMzMsImV4cCI6MjA1NjQ5MDMzM30.zwO86rBSmPBYCEmecINSQOHG-0e5_Tsb1ZLucR8QP6Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getDetailedSchema() {
  console.log('🔍 DETAYLI SUPABASE ŞEMA ANALİZİ\n');

  try {
    // Bilinen tabloları test et ve detaylarını al
    const knownTables = ['profiles', 'messages'];

    for (const tableName of knownTables) {
      console.log(`\n📋 ${tableName.toUpperCase()} TABLOSU DETAYLARI:`);
      console.log('='.repeat(60));

      try {
        // Tablo sütunlarını al
        const { data: columns, error: columnsError } = await supabase.rpc(
          'get_table_columns',
          { table_name: tableName }
        );

        if (columnsError) {
          // RPC yoksa alternatif yöntem
          console.log('🔄 Alternatif yöntemle sütun bilgileri alınıyor...');

          // Örnek veri al ve sütunları çıkar
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (!sampleError && sampleData && sampleData.length > 0) {
            const sample = sampleData[0];
            console.log('📊 Sütunlar ve örnek değerler:');

            Object.entries(sample).forEach(([key, value]) => {
              const type = typeof value;
              const isNull = value === null;
              const valueStr = isNull
                ? 'NULL'
                : type === 'string'
                  ? `"${value.toString().substring(0, 50)}${value.toString().length > 50 ? '...' : ''}"`
                  : value.toString();

              console.log(`  • ${key}: ${type} = ${valueStr}`);
            });
          }
        } else if (columns) {
          console.log('📊 Sütun detayları:');
          columns.forEach(col => {
            console.log(
              `  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'}`
            );
            if (col.column_default) {
              console.log(`    Default: ${col.column_default}`);
            }
          });
        }

        // Tablo istatistikleri
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!countError) {
          console.log(`\n📈 Toplam kayıt sayısı: ${count}`);
        }

        // Son 3 kaydı göster
        const { data: recentData, error: recentError } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (!recentError && recentData) {
          console.log(`\n🕒 Son ${recentData.length} kayıt:`);
          recentData.forEach((record, index) => {
            console.log(`\n  ${index + 1}. Kayıt:`);
            Object.entries(record).forEach(([key, value]) => {
              const displayValue =
                value === null
                  ? 'NULL'
                  : typeof value === 'string' && value.length > 100
                    ? `"${value.substring(0, 100)}..."`
                    : typeof value === 'string'
                      ? `"${value}"`
                      : value;
              console.log(`     ${key}: ${displayValue}`);
            });
          });
        }
      } catch (err) {
        console.log(`❌ ${tableName} tablosu analiz edilemedi:`, err.message);
      }
    }

    // Diğer olası tabloları test et
    console.log('\n🔍 DİĞER OLASI TABLOLAR:');
    console.log('='.repeat(60));

    const possibleTables = [
      'users',
      'posts',
      'comments',
      'categories',
      'lists',
      'connections',
      'conversations',
      'notifications',
      'follows',
      'likes',
      'bookmarks',
      'tags',
      'media',
      'settings',
      'reports',
      'blocks',
    ];

    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error) {
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          console.log(`✅ ${tableName}: ${count || 0} kayıt`);

          if (data && data.length > 0) {
            console.log(`   Sütunlar: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        // Tablo mevcut değil, sessizce geç
      }
    }

    // Auth şemasını kontrol et
    console.log('\n🔐 AUTH ŞEMASI:');
    console.log('='.repeat(60));

    try {
      // Auth kullanıcılarını listele (eğer izin varsa)
      const { data: authUsers, error: authError } =
        await supabase.auth.admin.listUsers();

      if (!authError && authUsers) {
        console.log(
          `✅ Auth kullanıcıları: ${authUsers.users.length} kullanıcı`
        );
        if (authUsers.users.length > 0) {
          console.log('Örnek kullanıcı yapısı:');
          const user = authUsers.users[0];
          console.log(`  ID: ${user.id}`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Created: ${user.created_at}`);
          console.log(`  Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        }
      } else {
        console.log('ℹ️ Auth kullanıcıları listelenemedi (izin gerekli)');
      }
    } catch (err) {
      console.log('ℹ️ Auth şeması erişilemedi (normal durum)');
    }

    // Storage buckets kontrol et
    console.log('\n📁 STORAGE BUCKETS:');
    console.log('='.repeat(60));

    try {
      const { data: buckets, error: bucketsError } =
        await supabase.storage.listBuckets();

      if (!bucketsError && buckets) {
        console.log(`✅ ${buckets.length} storage bucket bulundu:`);
        buckets.forEach(bucket => {
          console.log(
            `  • ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`
          );
          console.log(`    Created: ${bucket.created_at}`);
          console.log(`    Updated: ${bucket.updated_at}`);
        });
      } else {
        console.log('ℹ️ Storage buckets listelenemedi');
      }
    } catch (err) {
      console.log('ℹ️ Storage erişilemedi');
    }

    console.log('\n✅ Detaylı şema analizi tamamlandı!');
  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

// Scripti çalıştır
getDetailedSchema();
