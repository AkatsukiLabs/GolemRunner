// Integration tests for World functionality
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
    use golem_runner::models::world::{World};
    
    // Test utilities
    use golem_runner::tests::utils::utils::{
        PLAYER, cheat_caller_address, create_game_system, create_test_world
    };
    
    #[test]
    #[available_gas(40000000)]
    fn test_starter_world_creation() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);
        
        // Set the caller address for the test
        cheat_caller_address(PLAYER());
        
        // Spawn a player which should create starter world
        game_system.spawn_player();
        
        // Verify the starter world (Forest)
        let world_id: u256 = 1;
        let game_world: World = world.read_model((world_id, PLAYER()));
        
        // Check world properties
        assert(game_world.id == world_id, 'World ID should match');
        assert(game_world.player_id == PLAYER(), 'Player ID should match');
        assert(game_world.name == 'Forest', 'Name should be Forest');
        assert(game_world.description == 'A nice forest with old trees', 'Description should match');
        assert(game_world.price == 0, 'Starter world should be free');
        assert(game_world.is_starter, 'Should be marked as starter');
        assert(game_world.is_unlocked, 'Should be unlocked by default');
    }
    
    #[test]
    #[available_gas(40000000)]
    fn test_volcano_world_creation() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);
        
        // Set the caller address for the test
        cheat_caller_address(PLAYER());
        
        // Spawn a player which creates all worlds (locked and unlocked)
        game_system.spawn_player();
        
        // Verify the Volcano World (should be created but locked)
        let world_id: u256 = 2;
        let game_world: World = world.read_model((world_id, PLAYER()));
        
        // Check world properties
        assert(game_world.id == world_id, 'World ID should match');
        assert(game_world.player_id == PLAYER(), 'Player ID should match');
        assert(game_world.name == 'Volcano', 'Name should be Volcano');
        assert(game_world.description == 'A dangerous volcanic zone', 'Description should match');
        assert(game_world.price == 7500, 'Price should be 7500');
        assert(!game_world.is_starter, 'Should not be a starter world');
        assert(!game_world.is_unlocked, 'Should be locked by default');
    }
    
    #[test]
    #[available_gas(40000000)]
    fn test_glacier_world_creation() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);
        
        // Set the caller address for the test
        cheat_caller_address(PLAYER());
        
        // Spawn a player which creates all worlds (locked and unlocked)
        game_system.spawn_player();
        
        // Verify the Glacier World (should be created but locked)
        let world_id: u256 = 3;
        let game_world: World = world.read_model((world_id, PLAYER()));
        
        // Check world properties
        assert(game_world.id == world_id, 'World ID should match');
        assert(game_world.player_id == PLAYER(), 'Player ID should match');
        assert(game_world.name == 'Glacier', 'Name should be Glacier');
        assert(game_world.description == 'A slippery ice world', 'Description should match');
        assert(game_world.price == 9000, 'Price should be 9000');
        assert(!game_world.is_starter, 'Should not be a starter world');
        assert(!game_world.is_unlocked, 'Should be locked by default');
    }
    
    #[test]
    #[available_gas(40000000)]
    fn test_unlock_world_success() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);
        
        // Set the caller address for the test
        cheat_caller_address(PLAYER());
        
        // Spawn a player
        game_system.spawn_player();
        
        // Give the player enough coins to buy a world
        let volcano_world_id: u256 = 2;
        let volcano_world: World = world.read_model((volcano_world_id, PLAYER()));
        let world_price = volcano_world.price;
        
        // We need to add coins to the player
        // Let's simulate a game session that gives enough coins
        let points_needed = 0;
        let coins_needed = world_price + 1000; // Extra coins to be safe
        game_system.reward_player(points_needed, coins_needed);
        
        // Verify player has enough coins
        let player_before: Player = world.read_model(PLAYER());
        assert(player_before.coins >= world_price, 'Player should have enough coins');
        
        // Now try to unlock the Volcano World
        let unlock_result = game_system.unlock_world_store(volcano_world_id);
        assert(unlock_result, 'Unlock should succeed');
        
        // Verify the world is now unlocked
        let world_after: World = world.read_model((volcano_world_id, PLAYER()));
        assert(world_after.is_unlocked, 'World unlocked after purchase');
        
        // Verify coins were deducted from player
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == player_before.coins - world_price, 'Coins should be deducted');
    }
    
    #[test]
    #[available_gas(40000000)]
    fn test_unlock_world_failure_insufficient_funds() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);
        
        // Set the caller address for the test
        cheat_caller_address(PLAYER());
        
        // Spawn a player
        game_system.spawn_player();
        
        // Try to unlock a world without enough coins
        let volcano_world_id: u256 = 2;
        
        // Verify player doesn't have enough coins
        let player_before: Player = world.read_model(PLAYER());
        let game_world: World = world.read_model((volcano_world_id, PLAYER()));
        assert(player_before.coins < game_world.price, 'Player not have enough coins');
        
        // Try to unlock the world
        let unlock_result = game_system.unlock_world_store(volcano_world_id);
        assert(!unlock_result, 'Should fail for less funds');
        
        // Verify the world is still locked
        let world_after: World = world.read_model((volcano_world_id, PLAYER()));
        assert(!world_after.is_unlocked, 'World should still be locked');
        
        // Verify player's coins are unchanged
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == player_before.coins, 'Player coins are unchanged');
    }
    
    #[test]
    #[available_gas(40000000)]
    fn test_unlock_already_unlocked_world() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);
        
        // Set the caller address for the test
        cheat_caller_address(PLAYER());
        
        // Spawn a player
        game_system.spawn_player();
        
        // Try to unlock the starter world which is already unlocked
        let forest_world_id: u256 = 1;
        
        // Verify world is already unlocked
        let game_world: World = world.read_model((forest_world_id, PLAYER()));
        assert(game_world.is_unlocked, 'Starter world is unlocked');
        
        // Note player's coins before the attempted unlock
        let player_before: Player = world.read_model(PLAYER());
        
        // Try to unlock an already unlocked world
        let unlock_result = game_system.unlock_world_store(forest_world_id);
        assert(!unlock_result, 'Unlocking world should fail');
        
        // Verify player's coins are unchanged
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == player_before.coins, 'Player coins are unchanged');
    }
    
    #[test]
    #[available_gas(60000000)]
    fn test_unlock_multiple_worlds() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);
        
        // Set the caller address for the test
        cheat_caller_address(PLAYER());
        
        // Spawn a player
        game_system.spawn_player();
        
        // Get prices of the worlds
        let volcano_world_id: u256 = 2;
        let glacier_world_id: u256 = 3;
        
        let volcano_world: World = world.read_model((volcano_world_id, PLAYER()));
        let glacier_world: World = world.read_model((glacier_world_id, PLAYER()));
        
        let volcano_world_price = volcano_world.price;
        let glacier_world_price = glacier_world.price;
        
        // Give player enough coins to buy both worlds
        let total_needed = volcano_world_price + glacier_world_price + 1000; // Extra coins to be safe
        game_system.reward_player(0, total_needed);
        
        // Verify player has enough coins
        let player_before: Player = world.read_model(PLAYER());
        assert(player_before.coins >= total_needed - 1000, 'Player should have enough coins');
        
        // Unlock Volcano World
        let volcano_unlock_result = game_system.unlock_world_store(volcano_world_id);
        assert(volcano_unlock_result, 'Volcano world should succeed');
        
        // Verify Volcano World is unlocked and coins deducted
        let volcano_world_after: World = world.read_model((volcano_world_id, PLAYER()));
        let player_after_volcano: Player = world.read_model(PLAYER());
        
        assert(volcano_world_after.is_unlocked, 'Volcano world is unlocked');
        assert(player_after_volcano.coins == player_before.coins - volcano_world_price, 'Coins should be deducted');
        
        // Unlock Glacier World
        let glacier_unlock_result = game_system.unlock_world_store(glacier_world_id);
        assert(glacier_unlock_result, 'Glacier world should succeed');
        
        // Verify Glacier World is unlocked and coins deducted
        let glacier_world_after: World = world.read_model((glacier_world_id, PLAYER()));
        let player_after_glacier: Player = world.read_model(PLAYER());
        
        assert(glacier_world_after.is_unlocked, 'Glacier world is unlocked');
        assert(player_after_glacier.coins == player_after_volcano.coins - glacier_world_price, 'Coins should be deducted');
    }
    
    #[test]
    #[available_gas(40000000)]
    fn test_unlock_nonexistent_world() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);
        
        // Set the caller address for the test
        cheat_caller_address(PLAYER());
        
        // Spawn a player
        game_system.spawn_player();
        
        // Give the player plenty of coins
        game_system.reward_player(0, 100000);
        
        // Try to unlock a world that doesn't exist
        let nonexistent_world_id: u256 = 999;
        
        // Get player coins before the attempted unlock
        let player_before: Player = world.read_model(PLAYER());
        
        // Try to unlock the nonexistent world
        let unlock_result = game_system.unlock_world_store(nonexistent_world_id);
        assert(!unlock_result, 'Unlock should fail');
        
        // Verify player's coins are unchanged
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == player_before.coins, 'Player coins are unchanged');
    }
}