import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const CARD_CATEGORIES = [
  'Pokémon',
  'Cricket',
  'Football',
  'Rugby',
  'Avengers / Marvel',
  'Anime',
  'NBA / Basketball',
  'Formula 1',
  'Mythology / Legends',
  'Custom Hackathon Exclusives',
] as const;

export type CardCategory = (typeof CARD_CATEGORIES)[number];

export type CardRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Profile {
  id: string;
  username: string | null;
  wallet_balance: number;
  created_at: string;
}

export interface CardItem {
  id: string;
  name: string;
  category: CardCategory;
  image_url: string;
  rarity: CardRarity;
  power_score: number;
  market_value: number;
  claim_code: string;
  is_claimed: boolean;
  owner_id: string | null;
  created_at: string;
  owner?: {
    username: string | null;
  } | null;
}

export interface OfferItem {
  id: string;
  card_id: string;
  buyer_id: string;
  seller_id: string;
  offer_amount: number;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  card?: CardItem;
  buyer?: {
    username: string | null;
  };
  seller?: {
    username: string | null;
  };
}
