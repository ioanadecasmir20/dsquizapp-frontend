// ✅ Ensure Supabase JS Library is available
if (typeof supabase === "undefined") {
    console.error("❌ Supabase library is not loaded. Check script order in HTML.");
}

// config.js (New File)
const SUPABASE_URL = "https://shauymjcbfxixyvegujz.supabase.co"; // Replace with your Supabase URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYXV5bWpjYmZ4aXh5dmVndWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1Mzg2MzksImV4cCI6MjA1NDExNDYzOX0.tx8LNeuZDqSvP7vdklNO9HlPjtb3W-w8Dxa980LLQeU"; // Replace with your Supabase API key

// ✅ Create Supabase Client Correctly (v2 method)
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ Log Initialization
if (window.supabase.auth) {
    console.log("✅ Supabase initialized:", window.supabase);
    console.log("🔹 Supabase Auth:", window.supabase.auth);
} else {
    console.error("❌ Supabase Auth failed to initialize. Check Supabase setup.");
}
