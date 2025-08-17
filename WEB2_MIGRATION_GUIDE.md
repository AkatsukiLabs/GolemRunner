# 🎯 Guía de Migración Web2 - Golem Runner

## 📊 Resumen del Análisis

Golem Runner tiene **integración blockchain muy profunda**:
- 15 hooks de Dojo que manejan toda la lógica del juego
- 13 dependencias Web3 en package.json
- Toda la lógica de negocio implementada en contratos Cairo
- Sistema de autenticación basado en Cartridge Controller
- GraphQL queries a Torii indexer para datos en tiempo real

La migración requiere reemplazar completamente la capa de datos manteniendo la experiencia de usuario.

## 🛠 Stack Web2 Recomendado

**Backend:** Supabase (ideal para este caso)
- ✅ Base de datos PostgreSQL escalable
- ✅ Auth integrado compatible con World App
- ✅ Real-time subscriptions para leaderboards
- ✅ Edge Functions para lógica de negocio
- ✅ Storage para assets del juego
- ✅ SDKs para React/TypeScript

**Alternativas:** Firebase, PlanetScale + Vercel, Railway

## 📋 Plan de Migración en 4 Fases (15 días)

### **Fase 1: Infraestructura Core (Días 1-4)**

#### 1.1 Setup Supabase Project
```bash
# Instalar dependencias
npm install @supabase/supabase-js
npm uninstall @cartridge/connector @cartridge/controller @dojoengine/core @dojoengine/create-burner @dojoengine/predeployed-connector @dojoengine/sdk @dojoengine/torii-client @dojoengine/torii-wasm @dojoengine/utils @starknet-react/chains @starknet-react/core starknet
```

#### 1.2 Schema de Base de Datos
```sql
-- Ejecutar en Supabase SQL Editor

-- Tabla principal de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE,
  world_id VARCHAR, -- Para integración World App
  coins BIGINT DEFAULT 0,
  total_points BIGINT DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  last_active_day DATE DEFAULT CURRENT_DATE,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de golems (NFTs → items del juego)
CREATE TABLE golems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR DEFAULT '',
  golem_type VARCHAR NOT NULL, -- 'Fire', 'Ice', 'Stone'
  rarity VARCHAR NOT NULL, -- 'Basic', 'Common', 'Uncommon', 'Rare', 'VeryRare', 'Epic', 'Unique'
  price BIGINT NOT NULL,
  is_starter BOOLEAN DEFAULT FALSE,
  is_unlocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de mundos
CREATE TABLE worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  world_type VARCHAR NOT NULL, -- 'Forest', 'Volcano', 'Glacier'
  description TEXT DEFAULT '',
  price BIGINT NOT NULL,
  is_starter BOOLEAN DEFAULT FALSE,
  is_unlocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de misiones
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_coins BIGINT NOT NULL,
  required_world VARCHAR NOT NULL,
  required_golem VARCHAR NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR DEFAULT 'Pending', -- 'Pending', 'Completed', 'Claimed'
  created_at DATE DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP,
  claimed_at TIMESTAMP
);

-- Tabla de rankings (leaderboards)
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  world_type VARCHAR NOT NULL,
  points BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, world_type)
);

-- Tabla de achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR NOT NULL,
  milestone_value BIGINT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de game sessions (para analytics)
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  world_type VARCHAR NOT NULL,
  golem_type VARCHAR NOT NULL,
  score BIGINT NOT NULL,
  coins_collected BIGINT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_golems_user_id ON golems(user_id);
CREATE INDEX idx_worlds_user_id ON worlds(user_id);
CREATE INDEX idx_missions_user_id_date ON missions(user_id, created_at);
CREATE INDEX idx_rankings_world_points ON rankings(world_type, points DESC);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rankings_updated_at BEFORE UPDATE ON rankings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 1.3 Row Level Security (RLS)
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE golems ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own golems" ON golems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own golems" ON golems FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own worlds" ON worlds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own worlds" ON worlds FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own missions" ON missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON missions FOR UPDATE USING (auth.uid() = user_id);

-- Rankings públicos para leaderboards
CREATE POLICY "Rankings are publicly readable" ON rankings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own rankings" ON rankings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON achievements FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions" ON game_sessions FOR INSERT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own game sessions" ON game_sessions FOR SELECT USING (auth.uid() = user_id);
```

#### 1.4 Configuración de Supabase
```typescript
// /client/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos TypeScript generados automáticamente
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string | null;
          world_id: string | null;
          coins: number;
          total_points: number;
          daily_streak: number;
          last_active_day: string;
          level: number;
          experience: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          username: string;
          email?: string | null;
          world_id?: string | null;
        };
        Update: {
          username?: string;
          coins?: number;
          total_points?: number;
          daily_streak?: number;
          last_active_day?: string;
          level?: number;
          experience?: number;
        };
      };
      // ... otros tipos
    };
  };
};
```

### **Fase 2: Autenticación y Hooks API (Días 5-8)**

#### 2.1 Nuevo Sistema de Autenticación
```typescript
// /client/src/hooks/useAuth.ts (reemplaza useStarknetConnect)
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithWorldApp = async (worldProof: any) => {
    // Integración con World ID verificación
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'worldcoin',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          world_id_proof: JSON.stringify(worldProof)
        }
      }
    });
    return { data, error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    loading,
    signInWithWorldApp,
    signInWithEmail,
    signUp,
    signOut
  };
};
```

#### 2.2 Hooks API (reemplazar todos los hooks de Dojo)
```typescript
// /client/src/hooks/api/usePlayer.ts (reemplaza dojo/hooks/usePlayer.tsx)
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Database } from '../../config/supabase';

type User = Database['public']['Tables']['users']['Row'];

export const usePlayer = (userId?: string) => {
  const [player, setPlayer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPlayer = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setPlayer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();

    // Suscripción a cambios en tiempo real
    const subscription = supabase
      .channel('user_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        (payload) => setPlayer(payload.new as User)
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const updatePlayer = async (updates: Database['public']['Tables']['users']['Update']) => {
    if (!userId) return { error: 'No user ID' };
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (!error && data) {
      setPlayer(data);
    }

    return { data, error };
  };

  return { player, loading, error, updatePlayer };
};
```

```typescript
// /client/src/hooks/api/useGolems.ts (reemplaza dojo/hooks/useGolem.tsx)
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

export const useGolems = (userId?: string) => {
  const [golems, setGolems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchGolems = async () => {
      const { data, error } = await supabase
        .from('golems')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (data) setGolems(data);
      setLoading(false);
    };

    fetchGolems();
  }, [userId]);

  const unlockGolem = async (golemId: string) => {
    const { data, error } = await supabase
      .from('golems')
      .update({ is_unlocked: true })
      .eq('id', golemId)
      .eq('user_id', userId);

    return { data, error };
  };

  const updateGolemName = async (golemId: string, name: string) => {
    const { data, error } = await supabase
      .from('golems')
      .update({ name })
      .eq('id', golemId)
      .eq('user_id', userId);

    return { data, error };
  };

  return { golems, loading, unlockGolem, updateGolemName };
};
```

#### 2.3 Estado Global Actualizado
```typescript
// /client/src/zustand/store.ts (actualizar para usar API en lugar de blockchain)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../config/supabase';

interface GameState {
  // Estado de autenticación
  user: any | null;
  isAuthenticated: boolean;
  
  // Estado del juego (mantener estructura actual)
  currentScreen: string;
  isGameStarted: boolean;
  currentScore: number;
  currentLives: number;
  coinsCollected: number;
  currentGolem: any | null;
  currentWorld: any | null;
  
  // Datos del jugador (cachear datos de API)
  playerData: any | null;
  golemCollection: any[];
  worldCollection: any[];
  missions: any[];
  rankings: any[];
  
  // Acciones
  setUser: (user: any) => void;
  setCurrentScreen: (screen: string) => void;
  setGameState: (state: any) => void;
  setPlayerData: (data: any) => void;
  refreshPlayerData: () => Promise<void>;
  submitGameResults: (score: number, coins: number, worldId: string) => Promise<void>;
}

export const useGlobalStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      currentScreen: 'Menu',
      isGameStarted: false,
      currentScore: 0,
      currentLives: 3,
      coinsCollected: 0,
      currentGolem: null,
      currentWorld: null,
      playerData: null,
      golemCollection: [],
      worldCollection: [],
      missions: [],
      rankings: [],

      // Acciones
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setCurrentScreen: (screen) => set({ currentScreen: screen }),
      
      setGameState: (gameState) => set(gameState),
      
      setPlayerData: (data) => set({ playerData: data }),
      
      refreshPlayerData: async () => {
        const { user } = get();
        if (!user) return;

        try {
          // Fetch player data
          const { data: playerData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          // Fetch golems
          const { data: golems } = await supabase
            .from('golems')
            .select('*')
            .eq('user_id', user.id);

          // Fetch worlds
          const { data: worlds } = await supabase
            .from('worlds')
            .select('*')
            .eq('user_id', user.id);

          // Fetch missions
          const { data: missions } = await supabase
            .from('missions')
            .select('*')
            .eq('user_id', user.id)
            .eq('created_at', new Date().toISOString().split('T')[0]);

          set({
            playerData,
            golemCollection: golems || [],
            worldCollection: worlds || [],
            missions: missions || []
          });
        } catch (error) {
          console.error('Error refreshing player data:', error);
        }
      },

      submitGameResults: async (score: number, coins: number, worldId: string) => {
        const { user } = get();
        if (!user) return;

        try {
          // Llamar Edge Function para procesar resultados del juego
          const { data, error } = await supabase.functions.invoke('complete-game', {
            body: {
              userId: user.id,
              score,
              coinsCollected: coins,
              worldId
            }
          });

          if (error) throw error;

          // Actualizar estado local
          get().refreshPlayerData();
        } catch (error) {
          console.error('Error submitting game results:', error);
        }
      }
    }),
    {
      name: 'golem-runner-store',
      partialize: (state) => ({
        currentGolem: state.currentGolem,
        currentWorld: state.currentWorld,
        // No persistir datos sensibles
      })
    }
  )
);
```

### **Fase 3: Game Flow y Lógica (Días 9-12)**

#### 3.1 Edge Functions para Lógica de Negocio
```typescript
// /supabase/functions/complete-game/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, score, coinsCollected, worldId } = await req.json();

    // Actualizar datos del jugador en transacción atómica
    const { data: userData, error: userError } = await supabase.rpc('complete_game_transaction', {
      p_user_id: userId,
      p_score: score,
      p_coins: coinsCollected,
      p_world_id: worldId
    });

    if (userError) throw userError;

    return new Response(
      JSON.stringify({ success: true, data: userData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

```sql
-- Función PostgreSQL para transacción atómica
CREATE OR REPLACE FUNCTION complete_game_transaction(
  p_user_id UUID,
  p_score BIGINT,
  p_coins BIGINT,
  p_world_id VARCHAR
) RETURNS JSON AS $$
DECLARE
  v_current_coins BIGINT;
  v_current_points BIGINT;
  v_current_experience INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
  v_level_up BOOLEAN := FALSE;
BEGIN
  -- Obtener datos actuales del usuario
  SELECT coins, total_points, experience, level 
  INTO v_current_coins, v_current_points, v_current_experience, v_current_level
  FROM users WHERE id = p_user_id;

  -- Calcular nueva experiencia y nivel
  v_current_experience := v_current_experience + (p_score / 100); -- 1 XP por cada 100 puntos
  v_new_level := v_current_level;
  
  -- Verificar level up (cada 1000 XP = 1 nivel)
  WHILE v_current_experience >= (v_new_level * 1000) LOOP
    v_new_level := v_new_level + 1;
    v_level_up := TRUE;
  END LOOP;

  -- Actualizar usuario
  UPDATE users SET
    coins = v_current_coins + p_coins,
    total_points = v_current_points + p_score,
    experience = v_current_experience,
    level = v_new_level,
    last_active_day = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Insertar/actualizar ranking
  INSERT INTO rankings (user_id, world_type, points)
  VALUES (p_user_id, p_world_id, p_score)
  ON CONFLICT (user_id, world_type)
  DO UPDATE SET 
    points = GREATEST(rankings.points, p_score),
    updated_at = NOW();

  -- Insertar sesión de juego
  INSERT INTO game_sessions (user_id, world_type, score, coins_collected)
  VALUES (p_user_id, p_world_id, p_score, p_coins);

  -- Verificar misiones completadas
  UPDATE missions SET 
    status = 'Completed',
    completed_at = NOW()
  WHERE user_id = p_user_id 
    AND status = 'Pending'
    AND required_world = p_world_id
    AND p_coins >= target_coins;

  RETURN json_build_object(
    'level_up', v_level_up,
    'new_level', v_new_level,
    'total_coins', v_current_coins + p_coins,
    'total_points', v_current_points + p_score
  );
END;
$$ LANGUAGE plpgsql;
```

#### 3.2 Sistema de Misiones
```typescript
// /supabase/functions/daily-missions/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { userId } = await req.json();
    
    // Verificar si ya tiene misiones para hoy
    const today = new Date().toISOString().split('T')[0];
    const { data: existingMissions } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', userId)
      .eq('created_at', today);

    if (existingMissions && existingMissions.length > 0) {
      return new Response(JSON.stringify({ missions: existingMissions }));
    }

    // Generar misiones diarias (3 misiones por día)
    const missions = [
      {
        user_id: userId,
        target_coins: 500 + Math.floor(Math.random() * 500),
        required_world: ['Forest', 'Volcano', 'Glacier'][Math.floor(Math.random() * 3)],
        required_golem: ['Fire', 'Ice', 'Stone'][Math.floor(Math.random() * 3)],
        description: await generateMissionDescription(), // Llamar a Eliza API
        created_at: today
      },
      // ... generar 2 misiones más
    ];

    const { data, error } = await supabase
      .from('missions')
      .insert(missions)
      .select();

    return new Response(JSON.stringify({ missions: data }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});

async function generateMissionDescription() {
  // Mantener integración con Eliza API para generar descripciones
  // Similar al código existente en /client/src/services/agentApi.ts
}
```

### **Fase 4: World App Integration y Optimización (Días 13-15)**

#### 4.1 Integración World App
```typescript
// /client/src/components/auth/WorldAppLogin.tsx
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import { useAuth } from '../../hooks/useAuth';

export const WorldAppLogin = () => {
  const { signInWithWorldApp } = useAuth();

  const handleVerify = async (proof: ISuccessResult) => {
    try {
      const { data, error } = await signInWithWorldApp(proof);
      if (error) throw error;
      
      // Usuario autenticado y registrado
      console.log('Usuario autenticado con World ID:', data.user);
    } catch (error) {
      console.error('Error en verificación World ID:', error);
    }
  };

  return (
    <IDKitWidget
      app_id="app_staging_your_app_id" // Configurar en World App
      action="login"
      verification_level={VerificationLevel.Device}
      handleVerify={handleVerify}
      onSuccess={() => console.log('Verificación exitosa')}
    >
      {({ open }) => (
        <button 
          onClick={open}
          className="world-app-login-btn"
        >
          Conectar con World App
        </button>
      )}
    </IDKitWidget>
  );
};
```

#### 4.2 Real-time Leaderboards
```typescript
// /client/src/hooks/api/useRankings.ts
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

export const useRankings = (worldType?: string) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase
      .from('rankings')
      .select(`
        *,
        users!inner(username)
      `)
      .order('points', { ascending: false })
      .limit(100);

    if (worldType) {
      query = query.eq('world_type', worldType);
    }

    const fetchRankings = async () => {
      const { data, error } = await query;
      if (data) setRankings(data);
      setLoading(false);
    };

    fetchRankings();

    // Suscripción a cambios en tiempo real
    const subscription = supabase
      .channel('rankings_changes')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'rankings',
          filter: worldType ? `world_type=eq.${worldType}` : undefined
        },
        () => fetchRankings() // Refetch cuando hay cambios
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [worldType]);

  return { rankings, loading };
};
```

## 🗂 Archivos a Modificar/Eliminar

### **Eliminar Completamente:**
- `/client/src/dojo/` (todo el directorio)
- `/client/src/config/cartridgeConnector.tsx`
- `/contract/` (todo el directorio de contratos Cairo)
- Dependencias Web3 en `package.json`:
  ```json
  "@cartridge/connector": "0.5.9",
  "@cartridge/controller": "0.5.9",
  "@dojoengine/core": "1.2.1",
  "@dojoengine/create-burner": "1.2.1",
  "@dojoengine/predeployed-connector": "1.2.1",
  "@dojoengine/sdk": "1.2.1",
  "@dojoengine/torii-client": "1.2.1",
  "@dojoengine/torii-wasm": "1.2.1",
  "@dojoengine/utils": "1.2.1",
  "@starknet-react/chains": "3.1.0",
  "@starknet-react/core": "3.5.0",
  "starknet": "6.11.0"
  ```

### **Reemplazar:**
- `useStarknetConnect.ts` → `useAuth.ts`
- Todos los hooks en `/client/src/dojo/hooks/` → `/client/src/hooks/api/`
- `/client/src/zustand/store.ts` (mantener estructura, cambiar fuente de datos)

### **Actualizar:**
- `/client/src/components/screens/Login/LoginScreen.tsx`
- `/client/src/components/screens/Game/Map.tsx`
- `/client/src/components/screens/Leaderboard/LeaderboardScreen.tsx`
- `/client/src/components/screens/Missions/MissionsScreen.tsx`
- `/client/src/components/screens/Store/StoreScreen.tsx`

### **Crear:**
- `/client/src/config/supabase.ts`
- `/client/src/hooks/api/` (directorio completo)
- `/client/src/components/auth/WorldAppLogin.tsx`
- `/supabase/functions/` (Edge Functions)

## 💰 Estimación de Costos Web2

**Supabase Pricing:**
- **Free Tier:** 50,000 MAU, 500MB DB, 1GB storage
- **Pro Plan:** $25/mes - 100,000 MAU, 8GB DB, 100GB storage
- **Scaling:** ~$0.00325 por MAU adicional

**Para World App Scale:**
- 100K usuarios activos: ~$25-50/mes
- 1M usuarios activos: ~$300-500/mes

## 🚀 Ventajas de la Migración

1. **UX Inmediato:** Sin wallets, gas fees o esperas
2. **Escalabilidad:** Supabase maneja millones de usuarios
3. **World App Ready:** Auth compatible con WorldCoin
4. **Costo Predecible:** Sin volatilidad de gas fees
5. **Desarrollo Rápido:** Menos complejidad que blockchain

## ⚡ Timeline Acelerado (15 días)

- **Días 1-4:** Setup Supabase + Schema + Auth básico
- **Días 5-8:** Migración de hooks + Estado global
- **Días 9-12:** Game flow + Edge Functions + Misiones
- **Días 13-15:** World App integration + Testing + Deploy

## 🔄 Variables de Entorno

```env
# .env - Agregar estas variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# World App (cuando esté listo)
VITE_WORLD_APP_ID=app_staging_your_app_id
VITE_WORLD_ACTION_ID=login
```

## 📝 Notas Importantes

1. **Mantener UX:** La experiencia del usuario debe ser idéntica
2. **Datos Existentes:** Planificar migración de datos de blockchain si es necesario
3. **Testing:** Probar exhaustivamente cada funcionalidad migrada
4. **Rollback Plan:** Mantener versión blockchain como backup durante transición
5. **Performance:** Optimizar queries y usar índices apropiados
6. **Security:** Implementar RLS y validación en Edge Functions

## 🎯 Checklist de Migración

### Fase 1 ✅
- [ ] Proyecto Supabase configurado
- [ ] Schema de base de datos creado
- [ ] RLS y políticas de seguridad implementadas
- [ ] Configuración de cliente Supabase

### Fase 2 ✅
- [ ] Sistema de autenticación migrado
- [ ] Hooks API creados para reemplazar Dojo
- [ ] Estado global actualizado
- [ ] Dependencias Web3 removidas

### Fase 3 ✅
- [ ] Edge Functions para lógica de juego
- [ ] Sistema de misiones migrado
- [ ] Integración con Eliza API mantenida
- [ ] Transacciones atómicas implementadas

### Fase 4 ✅
- [ ] World App integration
- [ ] Real-time leaderboards
- [ ] Testing completo
- [ ] Deployment a producción