const SUPABASE_URL = "https://shauymjcbfxixyvegujz.supabase.co"; // Replace with your Supabase URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYXV5bWpjYmZ4aXh5dmVndWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1Mzg2MzksImV4cCI6MjA1NDExNDYzOX0.tx8LNeuZDqSvP7vdklNO9HlPjtb3W-w8Dxa980LLQeU";

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
