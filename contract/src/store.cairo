// Starknet imports
use starknet::{ContractAddress, get_caller_address, get_block_timestamp};

// Dojo imports
use dojo::world::WorldStorage;
use dojo::model::ModelStorage;

// Models imports
use golem_runner::models::player::{Player, PlayerTrait};
use golem_runner::models::golem::{Golem, GolemTrait, ZeroableGolemTrait};
use golem_runner::models::world::{World, WorldTrait, ZeroableWorldTrait};
use golem_runner::models::ranking::{Ranking};

// Types imports
use golem_runner::types::rarity::{Rarity};
use golem_runner::types::golem::{GolemType};
use golem_runner::types::world::{WorldType};

// Helpers import
use golem_runner::helpers::timestamp::Timestamp;
use golem_runner::helpers::experience::Experience;

// Store struct
#[derive(Copy, Drop)]
pub struct Store {
    world: WorldStorage,
}

//Implementation of the `StoreTrait` trait for the `Store` struct
#[generate_trait]
pub impl StoreImpl of StoreTrait {
    fn new(world: WorldStorage) -> Store {
        Store { world: world }
    }

    // --------- Getters ---------
    fn read_player_from_address(self: Store, player_address: ContractAddress) -> Player {
        self.world.read_model(player_address)
    }

    fn read_player(self: Store) -> Player {
        let player_address = get_caller_address();
        self.world.read_model(player_address)
    }

    fn read_golem(self: Store, golem_id: u256) -> Golem {
        let player_address = get_caller_address();
        self.world.read_model((golem_id, player_address))
    }

    fn read_world(self: Store, world_id: u256) -> World {
        let player_address = get_caller_address();
        self.world.read_model((world_id, player_address))
    }

    fn read_ranking(self: Store, world_id: u256) -> Ranking {
        let player_address = get_caller_address();
        self.world.read_model((world_id, player_address))
    }

    // --------- Setters ---------
    fn write_player(mut self: Store, player: @Player) {
        self.world.write_model(player)
    }

    fn write_golem(mut self: Store, golem: @Golem) {
        self.world.write_model(golem)
    }

    fn write_world(mut self: Store, world: @World) {
        self.world.write_model(world)
    }

    fn write_ranking(mut self: Store, ranking: @Ranking) {
        self.world.write_model(ranking)
    }
    
    // --------- New entities ---------
    fn new_player(mut self: Store) {
        let caller = get_caller_address();
        let current_timestamp = get_block_timestamp();

        let new_player = PlayerTrait::new(
            caller, 
            100000, // coins
            0, // total points
            0, // daily streak
            0, // last active day
            1, // level
            0, // experience
            Timestamp::unix_timestamp_to_day(current_timestamp), // creation_day
        );

        self.world.write_model(@new_player);
    }

    // --------- Golem methods ---------
    fn new_golem(mut self: Store, golem_type: GolemType, golem_id: u256) {
        let caller = get_caller_address();
        
        match golem_type {
            GolemType::Fire => self.new_fire_golem(caller, golem_id),
            GolemType::Ice => self.new_ice_golem(caller, golem_id),
            GolemType::Stone => self.new_stone_golem(caller, golem_id),
        }
    }

    fn new_fire_golem(mut self: Store, caller: ContractAddress, golem_id: u256) {
        let new_golem = GolemTrait::new(
            golem_id,
            caller,
            'Fire Golem',
            'A fiery elemental being',
            5000,
            Rarity::Uncommon,
            false, // is_starter
            false, // is_unlocked
        );

        self.world.write_model(@new_golem);
    }

    fn new_ice_golem(mut self: Store, caller: ContractAddress, golem_id: u256) {
        let new_golem = GolemTrait::new(
            golem_id,
            caller,
            'Ice Golem',
            'A frosty elemental being',
            10000,
            Rarity::Rare,
            false, // is_starter
            false, // is_unlocked
        );

        self.world.write_model(@new_golem);
    }

    fn new_stone_golem(mut self: Store, caller: ContractAddress, golem_id: u256) {
        let new_golem = GolemTrait::new(
            golem_id,
            caller,
            'Stone Golem',
            'A sturdy elemental being',
            0,
            Rarity::Common,
            true, // is_starter
            true, // is_unlocked
        );

        self.world.write_model(@new_golem);
    }

    // --------- World methods ---------
    fn new_world(mut self: Store, world_type: WorldType, world_id: u256) {
        let caller = get_caller_address();
        
        match world_type {
            WorldType::Forest => self.new_forest_world(caller, world_id),
            WorldType::Volcano => self.new_volcano_world(caller, world_id),
            WorldType::Glacier => self.new_glacier_world(caller, world_id),
        }
    }

    fn new_forest_world(mut self: Store, caller: ContractAddress, world_id: u256) {
        let new_world = WorldTrait::new(
            world_id,
            caller,
            'Forest',
            'A nice forest with old trees',
            0,
            true, // is_starter
            true, // is_unlocked
        );

        self.world.write_model(@new_world);
    }

    fn new_volcano_world(mut self: Store, caller: ContractAddress, world_id: u256) {
        let new_world = WorldTrait::new(
            world_id,
            caller,
            'Volcano',
            'A dangerous volcanic zone',
            7500,
            false, // is_starter
            false, // is_unlocked
        );

        self.world.write_model(@new_world);
    }

    fn new_glacier_world(mut self: Store, caller: ContractAddress, world_id: u256) {
        let new_world = WorldTrait::new(
            world_id,
            caller,
            'Glacier',
            'A slippery ice world',
            9000,
            false, // is_starter
            false, // is_unlocked
        );

        self.world.write_model(@new_world);
    }
    
    // --------- Initialization ---------
    fn init_player_items(mut self: Store) {
        // Create items for the new player
        self.new_golem(GolemType::Stone, 1);  // Stone Golem (starter, unlocked by default)
        self.new_golem(GolemType::Fire, 2);   // Fire Golem (locked)
        self.new_golem(GolemType::Ice, 3);    // Ice Golem (locked)
        
        self.new_world(WorldType::Forest, 1);   // Forest (starter, unlocked by default)
        self.new_world(WorldType::Volcano, 2);  // Volcano (locked)
        self.new_world(WorldType::Glacier, 3);  // Glacier (locked)
    }
    
    // --------- Helper "Purchase" methods ---------
    fn unlock_golem(mut self: Store, golem_id: u256) -> bool {
        let mut golem = self.read_golem(golem_id);
        
        // Verify that the golem exists
        if golem.name == '' {
            return false; // Golem does not exist
        }
        
        // Verify if the golem is already unlocked
        if golem.is_unlocked {
            return false; // It's already unlocked
        }
        
        // For non-starter golems, check the cost
        let mut player = self.read_player();
        let golem_price: u64 = golem.price.try_into().unwrap();
        
        // Try to decrease coins (decrease_coins includes fund verification)
        if !player.decrease_coins(golem_price) {
            return false; // No hay suficientes monedas
        }

        // Save the player with updated coins
        self.world.write_model(@player);
        
        // Unlock the golem
        golem.is_unlocked = true;
        self.world.write_model(@golem);
        
        return true;
    }

    fn unlock_world(mut self: Store, world_id: u256) -> bool {
        let mut world = self.read_world(world_id);
        
        // Verify that the world exists
        if world.name == '' {
            return false; // World does not exist
        }
        
        // Verify if the world is already unlocked
        if world.is_unlocked {
            return false; // It's already unlocked
        }
        
        // Get the price and make the payment
        let mut player = self.read_player();
        let world_price: u64 = world.price.try_into().unwrap();
        
        // Try to decrease coins (decrease_coins includes fund verification)
        if !player.decrease_coins(world_price) {
            return false; // Insufficient coins
        }
        
        // Save the player with updated coins
        self.world.write_model(@player);
        
        // Unlock the world
        world.is_unlocked = true;
        self.world.write_model(@world);
        
        return true;
    }
    
    
}