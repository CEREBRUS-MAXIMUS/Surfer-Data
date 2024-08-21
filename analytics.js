import config from './config.json'
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabase = createClient(config.supabase_url, config.supabase_key);

export async function trackRun(status, company, name, lastStep) {

  const { data, error } = await supabase
    .from('runs')
    .insert([
      {
        timestamp: new Date().toISOString(),
        status: status,
        company: company,
        name: name,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'local',
        lastStep: lastStep ? lastStep : JSON.stringify({})
      },
    ]);

  if (error) {
    console.error('Error writing to Supabase:', error);
  }
}
