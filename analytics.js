import { createClient } from '@supabase/supabase-js';

let supabase;
let config;


  try {
    config = require('./config.json');
    supabase = createClient(config.supabase_url, config.supabase_key);
  } catch (err) {
    console.error('No analytics config or supabase client found:', err);
  }



export async function trackRun(status, company, name, lastStep) {
  if (!config || !supabase) return;
  const { data, error } = await supabase.from('runs').insert([
    {
      timestamp: new Date().toISOString(),
      status: status,
      company: company,
      name: name,
      environment:
        process.env.NODE_ENV === 'production' ? 'production' : 'local',
      lastStep: lastStep ? lastStep : JSON.stringify({}),
    },
  ]);

  if (error) {
    console.error('Error writing to Supabase:', error);
  }
}