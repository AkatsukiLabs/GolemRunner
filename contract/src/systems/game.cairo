// Interface definition
#[starknet::interface]
pub trait IGame<T> {
    // --------- Core gameplay methods ---------
    fn spawn_player(ref self: T);
    fn reward_player(ref self: T, points: u64, coins_collected: u64);
    fn update_player_ranking(ref self: T, world_id: u256, points: u64);
    // --------- Unlock Items ---------
    fn unlock_golem_store(ref self: T, golem_id: u256) -> bool;
    fn unlock_world_store(ref self: T, world_id: u256) -> bool;
}

#[dojo::contract]
pub mod game {
    // Local import
    use super::super::super::models::player::PlayerTrait;
    use super::{IGame};

    // Achievement import
    use golem_runner::achievements::achievement::{Achievement, AchievementTrait};

    // Store import
    use golem_runner::store::{StoreTrait};

    // Starknet imports
    use core::num::traits::{SaturatingAdd, SaturatingMul};
    use starknet::{get_block_timestamp};

    // Constant import
    use golem_runner::constants;

    // Models import
    use golem_runner::models::player::{Player, PlayerAssert};
    use golem_runner::models::ranking::{RankingTrait};

    // Dojo achievements imports
    use achievement::components::achievable::AchievableComponent;
    use achievement::store::{StoreTrait as AchievementStoreTrait};
    component!(path: AchievableComponent, storage: achievable, event: AchievableEvent);
    impl AchievableInternalImpl = AchievableComponent::InternalImpl<ContractState>;

    // Dojo Imports
    #[allow(unused_imports)]
    use dojo::model::{ModelStorage};
    #[allow(unused_imports)]
    use dojo::world::{WorldStorage, WorldStorageTrait};
    #[allow(unused_imports)]
    use dojo::event::EventStorage;

    use starknet::{get_caller_address};

    #[storage]
    struct Storage {
        #[substorage(v0)]
        achievable: AchievableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AchievableEvent: AchievableComponent::Event,
    }

    // Constructor
    fn dojo_init(ref self: ContractState) {
        let mut world = self.world(@"golem_runner");

        let mut achievement_id: u8 = 1;
        while achievement_id <= constants::ACHIEVEMENTS_COUNT {
            let achievement: Achievement = achievement_id.into();
            self
                .achievable
                .create(
                    world,
                    id: achievement.identifier(),
                    hidden: achievement.hidden(),
                    index: achievement.index(),
                    points: achievement.points(),
                    start: achievement.start(),
                    end: achievement.end(),
                    group: achievement.group(),
                    icon: achievement.icon(),
                    title: achievement.title(),
                    description: achievement.description(),
                    tasks: achievement.tasks(),
                    data: achievement.data(),
                );
            achievement_id += 1;
        }
    }

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
            let exp_from_coins: u16 = (coins_collected.saturating_mul(1) / 10).try_into().unwrap();

            // Use saturating_add for the final sum, ensuring it does not exceed the u16 limit
            let exp_earned: u16 = exp_from_points.saturating_add(exp_from_coins);

            // Add experience to the player
            player.add_experience(exp_earned);

            // Save the player state
            store.write_player(@player);
        }

        // Method to update the ranking of the player
        fn update_player_ranking(ref self: ContractState, world_id: u256, points: u64) {
            let mut world = self.world(@"golem_runner");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player_address = get_caller_address();

            // Read the ranking of the player
            let mut ranking = store.read_ranking(world_id);

            // If it's a new ranking (points = 0) or if the score is better
            if ranking.points == 0 {
                let new_ranking = RankingTrait::new(world_id, player_address, points);
                store.write_ranking(@new_ranking);
            } else if points > ranking.points {
                // Update the ranking
                if ranking.update_ranking(points) {
                    store.write_ranking(@ranking);
                }
            }

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID;
            let counter = constants::ACHIEVEMENTS_COUNT;
            let stop = counter + achievement_id;

            let player = store.read_player();
            player.assert_exists();
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.address.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
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
