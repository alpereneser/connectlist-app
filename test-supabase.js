import { supabase } from './src/utils/supabase.js';

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Test basic connection
    const { data, error } = await supabase.from('todos').select('*').limit(1);

    if (error) {
      console.error('Error:', error.message);
      return;
    }

    console.log('Connection successful!');
    console.log('Sample data:', data);

    // Test creating a table if it doesn't exist
    const { data: tables, error: tableError } =
      await supabase.rpc('get_tables');

    if (tableError) {
      console.log('RPC not available, trying direct SQL...');

      // Try to create a simple test table
      const { data: createResult, error: createError } = await supabase
        .from('todos')
        .insert([{ title: 'Test todo', completed: false }]);

      if (createError) {
        console.error('Insert error:', createError.message);
      } else {
        console.log('Insert successful:', createResult);
      }
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

testSupabaseConnection();
