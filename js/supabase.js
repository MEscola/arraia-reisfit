// js/supabase.js

// Substitua com as credenciais que você copiou do painel web do Supabase
const SUPABASE_URL = "https://uqmxcmbbfghwzflxwmua.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_z5DXu-zAVBiVcJfNo3Fw6g_8Wb2zbIS";

// Cria e expõe o cliente para o ecossistema do front
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);