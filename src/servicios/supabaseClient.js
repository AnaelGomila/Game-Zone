import { createClient } from '@supabase/supabase-js';

// Las credenciales NUNCA se escriben acá a mano. Se leen desde variables
// de entorno (archivo .env local, o configuradas en Netlify al hacer deploy).
const urlSupabase = import.meta.env.VITE_SUPABASE_URL;
const claveSupabase = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!urlSupabase || !claveSupabase) {
  console.error(
    'Faltan las variables de entorno de Supabase. Revisá tu archivo .env'
  );
}

export const supabase = createClient(urlSupabase, claveSupabase);