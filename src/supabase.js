import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://exhnphilqhlvwelbdjaf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4aG5waGlscWhsdndlbGJkamFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNjkxMjQsImV4cCI6MjA4OTc0NTEyNH0.U-jxLpjFZEMcqWvAgltHZGgMShjfdgD-svdsmlxATI0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);