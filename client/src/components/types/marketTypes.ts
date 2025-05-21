export interface MarketItem {
    id: number;
    name: string;
    description: string;
    image: string;
    price: number;
  }
  
  export interface MarketGolem extends MarketItem {
    rarity: string;
    owned: boolean;
  }
  
  export interface MarketMap extends MarketItem {
    theme: string;
    unlocked: boolean;
  }