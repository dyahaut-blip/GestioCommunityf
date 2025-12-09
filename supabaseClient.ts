
import { createClient } from '@supabase/supabase-js';

// Récupération sécurisée des variables d'environnement (Compatible Vite et Vercel)
// En production sur Vercel, import.meta.env est remplacé au build, ou process.env fonctionne si configuré.

const getEnv = (key: string) => {
  // 1. Essayer import.meta.env (Vite standard)
  try {
    // @ts-ignore
    if (import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}
  
  // 2. Essayer process.env (Node/Vercel standard)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return '';
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Valeurs par défaut (Vos identifiants réels) pour garantir le fonctionnement sans .env
const defaultUrl = 'https://nsfndqdgxbauhauodbtj.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZm5kcWRneGJhdWhhdW9kYnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTEzNzMsImV4cCI6MjA4MDc4NzM3M30.Bwg7vz_1HqMfuyI_tBFc5JzNfhbILuRg-F_OIXkQUKw';

const supabaseUrl = envUrl || defaultUrl;
const supabaseAnonKey = envKey || defaultKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
