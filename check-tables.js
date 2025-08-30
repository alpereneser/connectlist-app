import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynbwiarxodetyirhmcbp.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluYndpYXJ4b2RldHlpcmhtY2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MTQzMzMsImV4cCI6MjA1NjQ5MDMzM30.zwO86rBSmPBYCEmecINSQOHG-0e5_Tsb1ZLucR8QP6Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('Checking Supabase connection and tables...');

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (testError) {
      console.log('pg_tables query failed, trying alternative...');

      // Try to check auth status
      const { data: authData, error: authError } =
        await supabase.auth.getSession();
      console.log(
        'Auth session check:',
        authError ? authError.message : 'Success'
      );

      // Try some common table names
      const commonTables = ['users', 'profiles', 'todos', 'posts', 'messages'];

      for (const tableName of commonTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (!error) {
            console.log(`✓ Table '${tableName}' exists`);
            console.log(`  Sample data:`, data);
          } else {
            console.log(`✗ Table '${tableName}' error:`, error.message);
          }
        } catch (err) {
          console.log(`✗ Table '${tableName}' exception:`, err.message);
        }
      }

      return;
    }

    console.log('Available public tables:', testData);

    // Check each table
    for (const table of testData) {
      console.log(`\n--- Checking table: ${table.tablename} ---`);

      try {
        const { data, error } = await supabase
          .from(table.tablename)
          .select('*')
          .limit(3);

        if (error) {
          console.log(`Error accessing ${table.tablename}:`, error.message);
        } else {
          console.log(`Sample data from ${table.tablename}:`, data);
        }
      } catch (err) {
        console.log(`Exception accessing ${table.tablename}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

checkTables();
