// Interface definition
#[starknet::interface]
pub trait IGame<T> {
    // --------- Core gameplay methods ---------
    fn spawn_player(ref self: T);
    fn reward_player(ref self: T, points: u64, coins_collected: u64);
    // --------- Unlock Items ---------
    fn unlock_golem_store(ref self: T, golem_id: u256) -> bool;
    fn unlock_world_store(ref self: T, world_id: u256) -> bool;
}

#[dojo::contract]
pub mod game {
    // Local import
    use super::super::super::models::player::PlayerTrait;
    use super::{IGame};

    // Store import
    use golem_runner::store::{StoreTrait};

    use core::num::traits::{SaturatingAdd, SaturatingMul};

    // Models import
    use golem_runner::models::player::{Player, PlayerAssert};

    // Dojo Imports
    #[allow(unused_imports)]
    use dojo::model::{ModelStorage};
    #[allow(unused_imports)]
    use dojo::world::{WorldStorage, WorldStorageTrait};

    // Constructor
    fn dojo_init(ref self: ContractState) {}

    // Implementation of the interface methods
    #[abi(embed_v0)]
    impl GameImpl of IGame<ContractState> {

        // --------- Core gameplay methods ---------
        
        // Method to create a new player with its initial items
        fn spawn_player(ref self: ContractState) {
            let mut world = self.world(@"golem_runner");
            let store = StoreTrait::new(world);

            // Create a new player
            store.new_player();
            
            // Init player items
            store.init_player_items();
        }

        // Method to reward the player after the game
        fn reward_player(ref self: ContractState, points: u64, coins_collected: u64) {
            let mut world = self.world(@"golem_runner");
            let store = StoreTrait::new(world);
            
            let mut player: Player = store.read_player();
            player.assert_exists();

            // Add coins to the player in the balance
            player.add_coins(coins_collected);

            // Add total points to the player
            player.add_points(points);

            // Calculate experience based on points and coins
            let exp_from_points: u16 = (points.saturating_mul(1) / 100).try_into().unwrap();
            let exp_from_coins:u16 = (coins_collected.saturating_mul(1) / 10).try_into().unwrap();
    
            // Use saturating_add for the final sum, ensuring it does not exceed the u16 limit
            let exp_earned: u16 = exp_from_points.saturating_add(exp_from_coins);
    
            // Add experience to the player
            player.add_experience(exp_earned);
    
            // Save the player state
            store.write_player(@player);
        }
        
        // --------- Unlock Player Items ---------
        
        // Method to unlock a golem (buy)
        fn unlock_golem_store(ref self: ContractState, golem_id: u256) -> bool {
            let mut world = self.world(@"golem_runner");
            let store = StoreTrait::new(world);
            
            store.unlock_golem(golem_id)
        }

        // Method to unlock a world (buy)
        fn unlock_world_store(ref self: ContractState, world_id: u256) -> bool {
            let mut world = self.world(@"golem_runner");
            let store = StoreTrait::new(world);
            
            store.unlock_world(world_id)
        }
    }
}