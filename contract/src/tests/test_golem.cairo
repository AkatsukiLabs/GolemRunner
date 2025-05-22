// Integration tests for Golem functionality
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
    use golem_runner::models::golem::{Golem, ZeroableGolemTrait};

    // Types imports
    use golem_runner::types::rarity::Rarity;


    // Test utilities
    use golem_runner::tests::utils::utils::{
        PLAYER, cheat_caller_address, create_game_system, create_test_world,
    };

    #[test]
    #[available_gas(40000000)]
    fn test_starter_golem_creation() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player which should create starter golem
        game_system.spawn_player();

        // Verify the starter golem (Stone Golem)
        let golem_id: u256 = 1;
        let golem: Golem = world.read_model((golem_id, PLAYER()));

        // Check golem properties
        assert(golem.id == golem_id, 'Golem ID should match');
        assert(golem.player_id == PLAYER(), 'Player ID should match');
        assert(golem.name == 'Stone Golem', 'Name should be Stone Golem');
        assert(golem.price == 0, 'Starter golem should be free');
        assert(golem.is_starter, 'Should be marked as starter');
        assert(golem.is_unlocked, 'Should be unlocked by default');

        // Check rarity
        match golem.rarity {
            Rarity::Common => (), // This is correct
            _ => panic!("Starter golem is Common rarity"),
        }
    }

    #[test]
    #[available_gas(40000000)]
    fn test_fire_golem_creation() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player which creates all golems (locked and unlocked)
        game_system.spawn_player();

        // Verify the Fire Golem (should be created but locked)
        let golem_id: u256 = 2;
        let golem: Golem = world.read_model((golem_id, PLAYER()));

        // Check golem properties
        assert(golem.id == golem_id, 'Golem ID should match');
        assert(golem.player_id == PLAYER(), 'Player ID should match');
        assert(golem.name == 'Fire Golem', 'Name should be Fire Golem');
        assert(golem.price == 5000, 'Price should be 5000');
        assert(!golem.is_starter, 'Should not be a starter golem');
        assert(!golem.is_unlocked, 'Should be locked by default');

        // Check rarity
        match golem.rarity {
            Rarity::Uncommon => (), // This is correct
            _ => panic!("Fire golem is Uncommon rarity"),
        }
    }

    #[test]
    #[available_gas(40000000)]
    fn test_ice_golem_creation() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player which creates all golems (locked and unlocked)
        game_system.spawn_player();

        // Verify the Ice Golem (should be created but locked)
        let golem_id: u256 = 3;
        let golem: Golem = world.read_model((golem_id, PLAYER()));

        // Check golem properties
        assert(golem.id == golem_id, 'Golem ID should match');
        assert(golem.player_id == PLAYER(), 'Player ID should match');
        assert(golem.name == 'Ice Golem', 'Name should be Ice Golem');
        assert(golem.price == 10000, 'Price should be 10000');
        assert(!golem.is_starter, 'Should not be a starter golem');
        assert(!golem.is_unlocked, 'Should be locked by default');

        // Check rarity
        match golem.rarity {
            Rarity::Rare => (), // This is correct
            _ => panic!("Ice golem is Rare rarity"),
        }
    }

    #[test]
    #[available_gas(40000000)]
    fn test_unlock_golem_success() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Give the player enough coins to buy a golem
        let fire_golem_id: u256 = 2;
        let fire_golem: Golem = world.read_model((fire_golem_id, PLAYER()));
        let golem_price = fire_golem.price;

        // We need to add coins to the player
        // Let's simulate a game session that gives enough coins
        let points_needed = 0;
        let coins_needed = golem_price + 1000; // Extra coins to be safe
        game_system.reward_player(points_needed, coins_needed);

        // Verify player has enough coins
        let player_before: Player = world.read_model(PLAYER());
        assert(player_before.coins >= golem_price, 'Player should have enough coins');

        // Now try to unlock the Fire Golem
        let unlock_result = game_system.unlock_golem_store(fire_golem_id);
        assert(unlock_result, 'Unlock should succeed');

        // Verify the golem is now unlocked
        let golem_after: Golem = world.read_model((fire_golem_id, PLAYER()));
        assert(golem_after.is_unlocked, 'Golem should be unlocked');

        // Verify coins were deducted from player
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == player_before.coins - golem_price, 'Coins should be deducted');
    }

    // #[test]
    // #[available_gas(40000000)]
    // fn test_unlock_golem_failure_insufficient_funds() {
    //     // Create test environment
    //     let world = create_test_world();
    //     let game_system = create_game_system(world);

    //     // Set the caller address for the test
    //     cheat_caller_address(PLAYER());

    //     // Spawn a player
    //     game_system.spawn_player();

    //     // Try to unlock a golem without enough coins
    //     let fire_golem_id: u256 = 2;

    //     // Verify player doesn't have enough coins
    //     let player_before: Player = world.read_model(PLAYER());
    //     let golem: Golem = world.read_model((fire_golem_id, PLAYER()));
    //     assert(player_before.coins < golem.price, 'Player not have enough coins');

    //     // Try to unlock the golem
    //     let unlock_result = game_system.unlock_golem_store(fire_golem_id);
    //     assert(!unlock_result, 'Unlock fail for less funds');

    //     // Verify the golem is still locked
    //     let golem_after: Golem = world.read_model((fire_golem_id, PLAYER()));
    //     assert(!golem_after.is_unlocked, 'Golem should still be locked');

    //     // Verify player's coins are unchanged
    //     let player_after: Player = world.read_model(PLAYER());
    //     assert(player_after.coins == player_before.coins, 'Player coins are unchanged');
    // }

    #[test]
    #[available_gas(40000000)]
    fn test_unlock_already_unlocked_golem() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Try to unlock the starter golem which is already unlocked
        let stone_golem_id: u256 = 1;

        // Verify golem is already unlocked
        let golem: Golem = world.read_model((stone_golem_id, PLAYER()));
        assert(golem.is_unlocked, 'Starter golem is unlocked');

        // Note player's coins before the attempted unlock
        let player_before: Player = world.read_model(PLAYER());

        // Try to unlock an already unlocked golem
        let unlock_result = game_system.unlock_golem_store(stone_golem_id);
        assert(!unlock_result, 'Unlocking golem should fail');

        // Verify player's coins are unchanged
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == player_before.coins, 'Player coins are unchanged');
    }

    #[test]
    #[available_gas(60000000)]
    fn test_unlock_multiple_golems() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Get prices of the golems
        let fire_golem_id: u256 = 2;
        let ice_golem_id: u256 = 3;

        let fire_golem: Golem = world.read_model((fire_golem_id, PLAYER()));
        let ice_golem: Golem = world.read_model((ice_golem_id, PLAYER()));

        let fire_golem_price = fire_golem.price;
        let ice_golem_price = ice_golem.price;

        // Give player enough coins to buy both golems
        let total_needed = fire_golem_price + ice_golem_price + 1000; // Extra coins to be safe
        game_system.reward_player(0, total_needed);

        // Verify player has enough coins
        let player_before: Player = world.read_model(PLAYER());
        assert(player_before.coins >= total_needed - 1000, 'Player should have enough coins');

        // Unlock Fire Golem
        let fire_unlock_result = game_system.unlock_golem_store(fire_golem_id);
        assert(fire_unlock_result, 'Fire golem should succeed');

        // Verify Fire Golem is unlocked and coins deducted
        let fire_golem_after: Golem = world.read_model((fire_golem_id, PLAYER()));
        let player_after_fire: Player = world.read_model(PLAYER());

        assert(fire_golem_after.is_unlocked, 'Fire golem is unlocked');
        assert(player_after_fire.coins == player_before.coins - fire_golem_price, 'Coins should be deducted');

        // Unlock Ice Golem
        let ice_unlock_result = game_system.unlock_golem_store(ice_golem_id);
        assert(ice_unlock_result, 'Ice golem should succeed');

        // Verify Ice Golem is unlocked and coins deducted
        let ice_golem_after: Golem = world.read_model((ice_golem_id, PLAYER()));
        let player_after_ice: Player = world.read_model(PLAYER());

        assert(ice_golem_after.is_unlocked, 'Ice golem is unlocked');
        assert(player_after_ice.coins == player_after_fire.coins - ice_golem_price, 'Coins should be deducted');
    }

    #[test]
    #[available_gas(40000000)]
    fn test_unlock_nonexistent_golem() {
        // Create test environment
        let world = create_test_world();
        let game_system = create_game_system(world);

        // Set the caller address for the test
        cheat_caller_address(PLAYER());

        // Spawn a player
        game_system.spawn_player();

        // Give the player plenty of coins
        game_system.reward_player(0, 100000);

        // Try to unlock a golem that doesn't exist
        let nonexistent_golem_id: u256 = 999;

        // Get player coins before the attempted unlock
        let player_before: Player = world.read_model(PLAYER());

        // Try to unlock the nonexistent golem
        let unlock_result = game_system.unlock_golem_store(nonexistent_golem_id);
        assert(!unlock_result, 'Unlock should fail');

        // Verify player's coins are unchanged
        let player_after: Player = world.read_model(PLAYER());
        assert(player_after.coins == player_before.coins, 'Player coins are unchanged');
    }

}
