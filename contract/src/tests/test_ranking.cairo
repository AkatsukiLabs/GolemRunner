// Integration tests for Ranking functionality
#[cfg(test)]
mod tests {
    // Dojo imports
    #[allow(unused_imports)]
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use dojo::model::{ModelStorage};

    // System imports
    use golem_runner::systems::game::{IGameDispatcherTrait};

    // Models imports
    use golem_runner::models::player::{Player};
    use golem_runner::models::ranking::{Ranking};

    // Test utilities
    use golem_runner::tests::utils::utils::{
        PLAYER, cheat_caller_address, create_game_system, create_test_world,
    };

    #[test]
    #[available_gas(40000000)]
    fn test_ranking_creation() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Create a new ranking entry
        let world_id: u256 = 1; // Forest world ID
        let points: u64 = 500;

        // Update the player's ranking
        game_system.update_player_ranking(world_id, points);

        // Verify the ranking was created
        let ranking: Ranking = world.read_model((world_id, PLAYER()));

        assert(ranking.world_id == world_id, 'World ID should match');
        assert(ranking.player == PLAYER(), 'Player should match');
        assert(ranking.points == points, 'Points should match');
    }

    #[test]
    #[available_gas(60000000)]
    fn test_ranking_update_with_higher_score() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Create initial ranking
        let world_id: u256 = 1;
        let initial_points: u64 = 500;
        game_system.update_player_ranking(world_id, initial_points);

        // Verify initial ranking
        let initial_ranking: Ranking = world.read_model((world_id, PLAYER()));
        assert(initial_ranking.points == initial_points, 'Initial points should match');

        // Update with higher score
        let higher_points: u64 = 800;
        game_system.update_player_ranking(world_id, higher_points);

        // Verify ranking was updated
        let updated_ranking: Ranking = world.read_model((world_id, PLAYER()));
        assert(updated_ranking.points == higher_points, 'Points should be updated');
    }

    #[test]
    #[available_gas(60000000)]
    fn test_ranking_not_update_with_lower_score() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Create initial ranking with high score
        let world_id: u256 = 1;
        let high_points: u64 = 1000;
        game_system.update_player_ranking(world_id, high_points);

        // Verify initial ranking
        let initial_ranking: Ranking = world.read_model((world_id, PLAYER()));
        assert(initial_ranking.points == high_points, 'Init points should match');

        // Try to update with lower score
        let lower_points: u64 = 500;
        game_system.update_player_ranking(world_id, lower_points);

        // Verify ranking was NOT updated
        let final_ranking: Ranking = world.read_model((world_id, PLAYER()));
        assert(final_ranking.points == high_points, 'Points should not be updated');
    }

    #[test]
    #[available_gas(80000000)]
    fn test_rankings_across_multiple_worlds() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player and give enough coins to unlock worlds
        game_system.spawn_player();
        game_system.reward_player(0, 20000);

        // Unlock additional worlds
        game_system.unlock_world_store(2); // Volcano world
        game_system.unlock_world_store(3); // Glacier world

        // Set rankings for each world
        let forest_points: u64 = 500;
        let volcano_points: u64 = 750;
        let glacier_points: u64 = 1000;

        game_system.update_player_ranking(1, forest_points); // Forest
        game_system.update_player_ranking(2, volcano_points); // Volcano
        game_system.update_player_ranking(3, glacier_points); // Glacier

        // Verify each world has its own ranking
        let forest_ranking: Ranking = world.read_model((1_u256, PLAYER()));
        let volcano_ranking: Ranking = world.read_model((2_u256, PLAYER()));
        let glacier_ranking: Ranking = world.read_model((3_u256, PLAYER()));

        assert(forest_ranking.points == forest_points, 'Forest points should match');
        assert(volcano_ranking.points == volcano_points, 'Volcano points should match');
        assert(glacier_ranking.points == glacier_points, 'Glacier points should match');

        // Update one ranking and verify others remain unchanged
        let new_forest_points: u64 = 600;
        game_system.update_player_ranking(1, new_forest_points);

        let updated_forest_ranking: Ranking = world.read_model((1_u256, PLAYER()));
        let unchanged_volcano_ranking: Ranking = world.read_model((2_u256, PLAYER()));
        let unchanged_glacier_ranking: Ranking = world.read_model((3_u256, PLAYER()));

        assert(updated_forest_ranking.points == new_forest_points, 'Forest points are updated');
        assert(unchanged_volcano_ranking.points == volcano_points, 'Volcano points are unchanged');
        assert(unchanged_glacier_ranking.points == glacier_points, 'Glacier points are unchanged');
    }

    #[test]
    #[available_gas(60000000)]
    fn test_multiple_game_sessions_ranking_update() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Simulate multiple game sessions in the same world
        let world_id: u256 = 1;

        // First game session
        let points1: u64 = 500;
        game_system.update_player_ranking(world_id, points1);

        // Verify ranking after first session
        let ranking1: Ranking = world.read_model((world_id, PLAYER()));
        assert(ranking1.points == points1, 'Points after should match');

        // Second game session with higher score
        let points2: u64 = 800;
        game_system.update_player_ranking(world_id, points2);

        // Verify ranking after second session
        let ranking2: Ranking = world.read_model((world_id, PLAYER()));
        assert(ranking2.points == points2, 'Points should update session');

        // Third game session with lower score
        let points3: u64 = 700;
        game_system.update_player_ranking(world_id, points3);

        // Verify ranking after third session
        let ranking3: Ranking = world.read_model((world_id, PLAYER()));
        assert(ranking3.points == points2, 'Points not change session');

        // Fourth game session with new record
        let points4: u64 = 1000;
        game_system.update_player_ranking(world_id, points4);

        // Verify ranking after fourth session
        let ranking4: Ranking = world.read_model((world_id, PLAYER()));
        assert(ranking4.points == points4, 'Points update new record');
    }

    // #[test]
    // #[available_gas(100000000)]
    // fn test_game_flow_with_ranking() {
    //     // Create test environment
    //     let world = create_test_world();
    //     let game_system = create_game_system(world);

    //     // Set the caller address for the test
    //     cheat_caller_address(PLAYER());

    //     // Spawn a player
    //     game_system.spawn_player();

    //     // Simulate a complete game flow:
    //     // 1. Player earns points and coins
    //     // 2. Ranking is updated
    //     // 3. Player buys new golem with coins
    //     // 4. Player tries a different world

    //     // Step 1: Play in Forest world and earn rewards
    //     let forest_id: u256 = 1;
    //     let points_earned: u64 = 500;
    //     let coins_earned: u64 = 15000; // Increased to have enough for both purchases

    //     // Reward player for playing
    //     game_system.reward_player(points_earned, coins_earned);

    //     // Update ranking
    //     game_system.update_player_ranking(forest_id, points_earned);

    //     // Verify player state
    //     let player_after_forest: Player = world.read_model(PLAYER());
    //     assert(player_after_forest.coins == coins_earned, 'Player have earned coins');

    //     // Verify ranking
    //     let forest_ranking: Ranking = world.read_model((forest_id, PLAYER()));
    //     assert(forest_ranking.points == points_earned, 'Forest ranking is updated');

    //     // Step 2: Buy Fire Golem with coins
    //     let fire_golem_id: u256 = 2;
    //     let unlock_result = game_system.unlock_golem_store(fire_golem_id);
    //     assert(unlock_result, 'Should unlock Fire Golem');

    //     // Verify player's coins after buying Fire Golem
    //     let player_after_golem: Player = world.read_model(PLAYER());
    //     assert(player_after_golem.coins == coins_earned - 5000, 'Coins deducted for golem');

    //     // Step 3: Buy Volcano World with remaining coins
    //     let volcano_id: u256 = 2;
    //     let unlock_world_result = game_system.unlock_world_store(volcano_id);
    //     assert(unlock_world_result, 'Should unlock Volcano World');

    //     // Verify player's coins after buying Volcano World
    //     let player_after_world: Player = world.read_model(PLAYER());
    //     assert(player_after_world.coins == coins_earned - 5000 - 7500, 'Coins deducted for world');

    //     // Step 4: Play in Volcano world
    //     let volcano_points: u64 = 750;
    //     game_system.update_player_ranking(volcano_id, volcano_points);

    //     // Verify volcano ranking
    //     let volcano_ranking: Ranking = world.read_model((volcano_id, PLAYER()));
    //     assert(volcano_ranking.points == volcano_points, 'Volcano ranking is created');

    //     // Step 5: Play in Forest again with higher score
    //     let new_forest_points: u64 = 600;
    //     game_system.update_player_ranking(forest_id, new_forest_points);

    //     // Verify forest ranking is updated
    //     let updated_forest_ranking: Ranking = world.read_model((forest_id, PLAYER()));
    //     assert(updated_forest_ranking.points == new_forest_points, 'Forest ranking is updated');

    //     // Verify volcano ranking is unchanged
    //     let unchanged_volcano_ranking: Ranking = world.read_model((volcano_id, PLAYER()));
    //     assert(unchanged_volcano_ranking.points == volcano_points, 'Volcano ranking is unchanged');
    // }

    #[test]
    #[available_gas(40000000)]
    fn test_ranking_initialization() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Directly read the ranking for a world without updating it first
        let world_id: u256 = 1;
        let ranking: Ranking = world.read_model((world_id, PLAYER()));

        // Verify that ranking starts with zero points
        assert(ranking.points == 0, 'Init ranking has 0 pts');

        // Now update with some points
        let points: u64 = 500;
        game_system.update_player_ranking(world_id, points);

        // Verify ranking is updated
        let updated_ranking: Ranking = world.read_model((world_id, PLAYER()));
        assert(updated_ranking.points == points, 'Ranking should be updated');
    }
}
