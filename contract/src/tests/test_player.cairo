// Integration tests for Player functionality
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
    use golem_runner::models::golem::{Golem};
    use golem_runner::models::world::{World};
    use golem_runner::models::ranking::{Ranking};
    
    // Test utilities
    use golem_runner::tests::utils::utils::{
        PLAYER, cheat_caller_address, create_game_system, create_test_world
    };
    
    // Helpers import
    use golem_runner::helpers::experience::Experience;
    
    // #[test]
    // #[available_gas(40000000)]
    // fn test_spawn_player() {
    //     // Create test environment
    //     let world = create_test_world();
    //     let game_system = create_game_system(world);
        
    //     // Set the caller address for the test
    //     cheat_caller_address(PLAYER());
        
    //     // Test spawning a player
    //     game_system.spawn_player();
        
    //     // Verify player was created successfully
    //     let player: Player = world.read_model(PLAYER());
        
    //     // Basic player validation
    //     assert(player.level == 1, 'Player start at level 1');
    //     assert(player.coins == 0, 'Player start with 0 coins');
    //     assert(player.total_points == 0, 'Player start with 0 points');
    //     assert(player.experience == 0, 'Player start with 0 exp');
        
    //     // Verify starter golem was created and unlocked
    //     let golem_id: u256 = 1; // The ID for the starter golem (Stone Golem)
    //     let starter_golem: Golem = world.read_model((golem_id, PLAYER()));
        
    //     assert(starter_golem.is_starter, 'Should be starter golem');
    //     assert(starter_golem.is_unlocked, 'Starter golem is unlocked');
        
    //     // Verify starter world was created and unlocked
    //     let world_id: u256 = 1; // The ID for the starter world (Forest)
    //     let starter_world: World = world.read_model((world_id, PLAYER()));
        
    //     assert(starter_world.is_starter, 'Should be starter world');
    //     assert(starter_world.is_unlocked, 'Starter world is unlocked');
        
    //     // Verify other golems and worlds were created but locked
    //     let fire_golem: Golem = world.read_model((2_u256, PLAYER()));
    //     let ice_golem: Golem = world.read_model((3_u256, PLAYER()));
        
    //     assert(!fire_golem.is_unlocked, 'Fire golem is locked init');
    //     assert(!ice_golem.is_unlocked, 'Ice golem is locked init');
        
    //     let volcano_world: World = world.read_model((2_u256, PLAYER()));
    //     let glacier_world: World = world.read_model((3_u256, PLAYER()));
        
    //     assert(!volcano_world.is_unlocked, 'Volcano world is locked init');
    //     assert(!glacier_world.is_unlocked, 'Glacier world is locked init');
    // }
    
    // #[test]
    // #[available_gas(40000000)]
    // fn test_reward_player() {
    //     // Create test environment
    //     let world = create_test_world();
    //     let game_system = create_game_system(world);
        
    //     // Set the caller address for the test
    //     cheat_caller_address(PLAYER());
        
    //     // Spawn a player first
    //     game_system.spawn_player();
        
    //     // Reward the player with points and coins
    //     let points: u64 = 500;
    //     let coins: u64 = 50;
    //     game_system.reward_player(points, coins);
        
    //     // Verify player state after reward
    //     let player: Player = world.read_model(PLAYER());
        
    //     assert(player.coins == coins, 'Player received coins');
    //     assert(player.total_points == points, 'Player received points');
        
    //     // Calculate expected experience based on the formula in game.cairo
    //     // exp_from_points = (points * 1) / 100
    //     // exp_from_coins = (coins * 1) / 10
    //     // total_exp = exp_from_points + exp_from_coins
    //     let expected_exp_from_points: u16 = (points / 100).try_into().unwrap(); // 500/100 = 5
    //     let expected_exp_from_coins: u16 = (coins / 10).try_into().unwrap();    // 50/10 = 5
    //     let expected_total_exp: u16 = expected_exp_from_points + expected_exp_from_coins; // 5 + 5 = 10
        
    //     // Calculate if the player should level up
    //     let should_level_up = Experience::should_level_up(1, expected_total_exp);
    //     let expected_level = if should_level_up { 2 } else { 1 };
        
    //     // Calculate expected remaining exp after potential level up
    //     let expected_remaining_exp = if should_level_up {
    //         Experience::remaining_exp_after_level_up(1, expected_total_exp)
    //     } else {
    //         expected_total_exp
    //     };
        
    //     assert(player.level == expected_level, 'Player level incorrect');
    //     assert(player.experience == expected_remaining_exp, 'Player experience incorrect');
    // }
    
    // #[test]
    // #[available_gas(40000000)]
    // fn test_multiple_rewards_and_level_ups() {
    //     // Create test environment
    //     let world = create_test_world();
    //     let game_system = create_game_system(world);
        
    //     // Set the caller address for the test
    //     cheat_caller_address(PLAYER());
        
    //     // Spawn a player first
    //     game_system.spawn_player();
        
    //     // First reward - should get to level 1 with some exp
    //     game_system.reward_player(300, 30); // 3 exp from points + 3 exp from coins = 6 exp
        
    //     // Verify first reward
    //     let player_after_first: Player = world.read_model(PLAYER());
    //     assert(player_after_first.level == 1, 'Should still be level 1');
    //     assert(player_after_first.experience == 6, 'Should have 6 exp');
    //     assert(player_after_first.coins == 30, 'Should have 30 coins');
    //     assert(player_after_first.total_points == 300, 'Should have 300 points');
        
    //     // Second reward - should level up to level 2
    //     game_system.reward_player(500, 40); // 5 exp from points + 4 exp from coins = 9 exp
    //     // 6 (prev) + 9 (new) = 15 exp, which is > 10 exp needed for level 1
        
    //     // Verify second reward and level up
    //     let player_after_second: Player = world.read_model(PLAYER());
    //     assert(player_after_second.level == 2, 'Should now be level 2');
    //     assert(player_after_second.experience == 5, 'Should have 5 exp left after');
    //     assert(player_after_second.coins == 70, 'Should have 70 coins total');
    //     assert(player_after_second.total_points == 800, 'Should have 800 points total');
        
    //     // Third reward - large reward to trigger multiple level ups
    //     game_system.reward_player(9000, 900); // 90 exp from points + 90 exp from coins = 180 exp
    //     // 5 (prev) + 180 (new) = 185 exp
    //     // Level 2 needs 40 exp, level 3 needs 90 exp
    //     // After using 40 exp for level 2→3: 185 - 40 = 145 exp
    //     // After using 90 exp for level 3→4: 145 - 90 = 55 exp
    //     // So player should be level 4 with 55 exp
        
    //     // Verify third reward and multiple level ups
    //     let player_after_third: Player = world.read_model(PLAYER());
    //     assert(player_after_third.level == 4, 'Should now be level 4');
    //     assert(player_after_third.experience == 55, 'Should have 55 exp left');
    //     assert(player_after_third.coins == 970, 'Should have 970 coins total');
    //     assert(player_after_third.total_points == 9800, 'Should have 9800 points total');
    // }
    
    #[test]
    #[available_gas(60000000)]
    fn test_update_player_ranking() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);
        
        // Set the caller address for the test
        cheat_caller_address(PLAYER());
        
        // Spawn a player first
        game_system.spawn_player();
        
        // Set the world ID and points for ranking
        let world_id: u256 = 1; // Forest world ID
        let points: u64 = 1000;
        
        // Update the player's ranking
        game_system.update_player_ranking(world_id, points);
        
        // Read the ranking and verify it
        let ranking: Ranking = world.read_model((world_id, PLAYER()));
        
        assert(ranking.world_id == world_id, 'Ranking world_id incorrect');
        assert(ranking.player == PLAYER(), 'Ranking player incorrect');
        assert(ranking.points == points, 'Ranking points incorrect');
        
        // Update with higher points
        let higher_points: u64 = 1500;
        game_system.update_player_ranking(world_id, higher_points);
        
        // Verify ranking was updated with higher points
        let updated_ranking: Ranking = world.read_model((world_id, PLAYER()));
        assert(updated_ranking.points == higher_points, 'Ranking is updated with points');
        
        // Update with lower points
        let lower_points: u64 = 800;
        game_system.update_player_ranking(world_id, lower_points);
        
        // Verify ranking was NOT updated with lower points
        let final_ranking: Ranking = world.read_model((world_id, PLAYER()));
        assert(final_ranking.points == higher_points, 'Ranking is not updated less');
    }
    
}