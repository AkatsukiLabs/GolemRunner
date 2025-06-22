// Integration tests for Mission functionality
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
    use golem_runner::models::mission::{Mission};

    // Types imports
    use golem_runner::types::golem::GolemType;
    use golem_runner::types::world::WorldType;
    use golem_runner::types::mission_status::MissionStatus;

    // Test utilities
    use golem_runner::tests::utils::utils::{
        PLAYER, cheat_caller_address, create_game_system, create_test_world,
    };

    #[test]
    #[available_gas(70000000)]
    fn test_create_mission() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player first
        game_system.spawn_player();

        // Create a new mission
        let target_coins = 100;
        let required_world = WorldType::Forest;
        let required_golem = GolemType::Stone;
        let description = "Collect 100 coins in Forest with Stone golem";

        game_system.create_mission(
            target_coins,
            required_world,
            required_golem,
            description
        );

        // Verify the mission was created (assuming mission_id starts at 0)
        let mission_id: u256 = 1;
        let mission: Mission = world.read_model((mission_id, PLAYER()));

        // Check mission properties
        assert(mission.id == mission_id, 'Mission ID should match');
        assert(mission.player_id == PLAYER(), 'Player ID should match');
        assert(mission.target_coins == target_coins, 'Target coins should match');
        assert(mission.status == MissionStatus::Pending, 'Mission should be pending');
    }

    #[test]
    #[available_gas(70000000)]
    fn test_create_multiple_missions() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player first
        game_system.spawn_player();

        // Create first mission
        game_system.create_mission (
            75,
            WorldType::Glacier,
            GolemType::Ice,
            "Collect 75 coins in Ice Realm with Ice golem"
        );

        // Create second mission
        game_system.create_mission (
            150,
            WorldType::Volcano,
            GolemType::Fire,
            "Collect 150 coins in Volcano with Fire golem"
        );

        // Verify first mission
        let mission_id: u256 = 1;
        let mission1: Mission = world.read_model((mission_id, PLAYER()));
        // println!("Mission ID:{}, Mission Target: {}, Mission World: {}", mission1.id, mission1.target_coins, mission1.required_world);
        assert(mission1.target_coins == 75, 'Mission should be 75');
        assert(mission1.required_world == WorldType::Glacier, 'Mission should be Glacier');

        // Verify second mission
        let mission_id2: u256 = 2;
        let mission2: Mission = world.read_model((mission_id2, PLAYER()));
        assert(mission2.target_coins == 150, 'Mission is 150');
        assert(mission2.required_world == WorldType::Volcano, 'Mission is Volcano');

        // Both should be pending
        assert(mission1.status == MissionStatus::Pending, 'Mission is pending');
        assert(mission2.status == MissionStatus::Pending, 'Mission is pending');
    }

    #[test]
    #[available_gas(70000000)]
    fn test_update_mission_status() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player and create a mission
        game_system.spawn_player();
        game_system.create_mission(
            50,
            WorldType::Forest,
            GolemType::Stone,
            "Collect 50 coins in Forest with Stone golem"
        );

        // Verify mission is initially pending
        let mission_id: u256 = 1;
        let mission_before: Mission = world.read_model((mission_id, PLAYER()));
        assert(mission_before.status == MissionStatus::Pending, 'Mission should be pending');

        // Update mission status
        let update_result = game_system.update_mission(mission_id);
        assert(update_result, 'Mission update should succeed');

        // Verify mission is now completed
        let mission_after: Mission = world.read_model((mission_id, PLAYER()));
        assert(mission_after.status == MissionStatus::Completed, 'Mission should be completed');
    }

    #[test]
    #[available_gas(70000000)]
    fn test_update_nonexistent_mission() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player (but don't create any missions)
        game_system.spawn_player();

        // Try to update a mission that doesn't exist
        let nonexistent_mission_id: u256 = 999;
        let update_result = game_system.update_mission(nonexistent_mission_id);
        
        // Update should succeed (based on your store implementation that always returns true)
        // Note: You might want to add validation in your store to return false for non-existent missions
        assert(update_result, 'Update result should be true');
    }

    #[test]
    #[available_gas(70000000)]
    fn test_reward_completed_mission() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player and create a mission
        game_system.spawn_player();
        game_system.create_mission(
            80,
            WorldType::Volcano,
            GolemType::Fire,
            "Collect 80 coins in Volcano with Fire golem"
        );

        // Get player coins before completing mission
        let player_before: Player = world.read_model(PLAYER());
        let initial_coins = player_before.coins;

        // Complete the mission first
        let mission_id: u256 = 1;
        game_system.update_mission(mission_id);

        // Verify mission is completed
        let mission: Mission = world.read_model((mission_id, PLAYER()));
        assert(mission.status == MissionStatus::Completed, 'Mission should be completed');

        // Reward the mission
        let coins_collected = 80_u64;
        game_system.reward_current_mission(mission_id, coins_collected);

        // Verify player received the coins
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == initial_coins + coins_collected, 'Player should receive coins');
    }

    #[test]
    #[available_gas(70000000)]
    fn test_reward_pending_mission_should_fail() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player and create a mission
        game_system.spawn_player();
        game_system.create_mission(
            60,
            WorldType::Glacier,
            GolemType::Ice,
            "Collect 60 coins in Ice Realm with Ice golem"
        );

        // Get player coins before attempting reward
        let player_before: Player = world.read_model(PLAYER());
        let initial_coins = player_before.coins;

        // Try to reward mission without completing it first
        let mission_id: u256 = 1;
        let coins_collected = 60_u64;
        game_system.reward_current_mission(mission_id, coins_collected);

        // Verify player coins are unchanged (reward should fail for pending mission)
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == initial_coins, 'Player coins are unchanged');

        // Verify mission is still pending
        let mission: Mission = world.read_model((mission_id, PLAYER()));
        assert(mission.status == MissionStatus::Pending, 'Mission is pending');
    }

    #[test]
    #[available_gas(70000000)]
    fn test_reward_nonexistent_mission() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player (but don't create any missions)
        game_system.spawn_player();

        // Get player coins before attempting reward
        let player_before: Player = world.read_model(PLAYER());
        let initial_coins = player_before.coins;

        // Try to reward a mission that doesn't exist
        let nonexistent_mission_id: u256 = 999;
        let coins_collected = 100_u64;
        game_system.reward_current_mission(nonexistent_mission_id, coins_collected);

        // Verify player coins are unchanged
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == initial_coins, 'Player coins is unchanged');
    }

    #[test]
    #[available_gas(80000000)]
    fn test_complete_mission_workflow() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Create a mission
        let target_coins = 120_u64;
        game_system.create_mission(
            target_coins,
            WorldType::Forest,
            GolemType::Stone,
            "Collect 120 coins in Forest with Stone golem"
        );

        let mission_id: u256 = 1;

        // Step 1: Verify mission was created as pending
        let mission_initial: Mission = world.read_model((mission_id, PLAYER()));
        assert(mission_initial.status == MissionStatus::Pending, 'Mission should be pending');
        assert(mission_initial.target_coins == target_coins, 'Target coins should match');

        // Step 2: Complete the mission
        let update_result = game_system.update_mission(mission_id);
        assert(update_result, 'Mission update is succeed');

        // Step 3: Verify mission is completed
        let mission_completed: Mission = world.read_model((mission_id, PLAYER()));
        assert(mission_completed.status == MissionStatus::Completed, 'Mission should be completed');

        // Step 4: Get player coins before reward
        let player_before: Player = world.read_model(PLAYER());
        let initial_coins = player_before.coins;

        // Step 5: Reward the mission
        game_system.reward_current_mission(mission_id, target_coins);

        // Step 6: Verify player received the reward
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == initial_coins + target_coins, 'Player receive reward coins');
    }

    #[test]
    #[available_gas(80000000)]
    fn test_multiple_missions_workflow() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Create multiple missions
        game_system.create_mission(50, WorldType::Forest, GolemType::Stone, "Mission 1");
        game_system.create_mission(100, WorldType::Volcano, GolemType::Fire, "Mission 2");
        game_system.create_mission(75, WorldType::Glacier, GolemType::Ice, "Mission 3");

        // Get initial player coins
        let player_initial: Player = world.read_model(PLAYER());
        let initial_coins = player_initial.coins;

        // Complete and reward first mission
        game_system.update_mission(1);
        game_system.reward_current_mission(1, 50);

        // Complete and reward third mission (skip second)
        game_system.update_mission(3);
        game_system.reward_current_mission(3, 75);

        // Verify missions status
        let mission_id1: u256 = 1;
        let mission_id2: u256 = 2;
        let mission_id3: u256 = 3;
        let mission1: Mission = world.read_model((mission_id1, PLAYER()));
        let mission2: Mission = world.read_model((mission_id2, PLAYER()));
        let mission3: Mission = world.read_model((mission_id3, PLAYER()));

        assert(mission1.status == MissionStatus::Completed, 'Mission 1 is completed');
        assert(mission2.status == MissionStatus::Pending, 'Mission 2 is pending');
        assert(mission3.status == MissionStatus::Completed, 'Mission 3 is completed');

        // Verify player received coins from completed missions only
        let player_final: Player = world.read_model(PLAYER());
        let expected_coins = initial_coins + 50 + 75; // Mission 1 + Mission 3
        assert(player_final.coins == expected_coins, 'Player coins completed missions');
    }
}