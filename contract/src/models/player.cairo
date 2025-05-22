// Starknet import
use starknet::ContractAddress;
use core::num::traits::zero::Zero;

// Constants imports
use golem_runner::constants;

// Helpers import
use golem_runner::helpers::timestamp::Timestamp;
use golem_runner::helpers::experience::Experience;

// Model
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Player {
    #[key]
    pub address: ContractAddress,
    pub coins: u64,
    pub total_points: u64,
    pub daily_streak: u16,
    pub last_active_day: u32,
    pub level: u8, 
    pub experience: u16,
    pub creation_day: u32,
}

// Traits Implementations
#[generate_trait]
pub impl PlayerImpl of PlayerTrait {
    fn new(
        address: ContractAddress,
        coins: u64,
        total_points: u64,
        daily_streak: u16,
        last_active_day: u32,
        level: u8, 
        experience: u16,
        creation_day: u32,
    ) -> Player {
        Player {
            address,
            coins,
            total_points,
            daily_streak,
            last_active_day,
            level,
            experience,
            creation_day,
        }
    }

    fn update_daily_streak(ref self: Player, current_timestamp: u64) {
        let current_day: u32 = Timestamp::unix_timestamp_to_day(current_timestamp);

        if current_day == self.last_active_day {
            return;
        }
        if current_day == self.last_active_day + 1 {
            self.daily_streak += 1;
        } 
        else {
            self.daily_streak = 0;
        }

        self.last_active_day = current_day;
    }
   
    fn add_coins(ref self: Player, amount: u64) {
        self.coins += amount;
    }

    fn decrease_coins(ref self: Player, amount: u64) -> bool {
        // Verify that the player has enough coins
        if self.coins < amount {
            return false; // Insufficient coins
        }
        
        // Subtract coins safely
        self.coins -= amount;
        
        return true; 
    }

    fn add_points(ref self: Player, points: u64) {
        self.total_points += points;
    }

    fn add_experience(ref self: Player, exp: u16) {
        self.experience += exp;
        
        // Check if player can level up
        self.check_level_up();
    }

    fn check_level_up(ref self: Player) {
        // Use helper Experience to check the level
        let should_level_up = Experience::should_level_up(self.level, self.experience);
        
        if should_level_up {
            // Calculate remaining experience after leveling up
            self.experience = Experience::remaining_exp_after_level_up(self.level, self.experience);
            self.level += 1;
            
            // Check if player can level up again in a recursive manner
            self.check_level_up();
        }
    }
}

#[generate_trait]
pub impl PlayerAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Player) {
        assert(self.is_non_zero(), 'Player: Does not exist');
    }

    #[inline(always)]
    fn assert_not_exists(self: Player) {
        assert(self.is_zero(), 'Player: Already exist');
    }
}

pub impl ZeroablePlayerTrait of Zero<Player> {
    #[inline(always)]
    fn zero() -> Player {
        Player {
            address: constants::ZERO_ADDRESS(),
            coins: 0,
            total_points: 0,
            daily_streak: 0,
            last_active_day: 0,
            level: 1,
            experience: 0,
            creation_day: 0,
        }
    }

    #[inline(always)]
    fn is_zero(self: @Player) -> bool {
       *self.address == constants::ZERO_ADDRESS()
    }

    #[inline(always)]
    fn is_non_zero(self: @Player) -> bool {
        !self.is_zero()
    }
}

// Tests
#[cfg(test)]
mod tests {
    use super::{Player, ZeroablePlayerTrait, PlayerImpl, PlayerTrait};
    use golem_runner::helpers::experience::Experience;
    use golem_runner::constants;
    use starknet::{ContractAddress, contract_address_const};

    #[test]
    #[available_gas(1000000)]
    fn test_player_new_constructor() {
        // Use contract_address_const to create a mock address
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        // Test the new constructor
        let player = PlayerTrait::new(
            mock_address,
            100,  // coins
            200,  // total_points
            1,    // daily_streak
            1,    // last_active_day
            2,    // level
            50,   // experience
            42,   // creation_day
        );

        assert_eq!(
            player.address, 
            mock_address, 
            "Player address should match the initialized address"
        );
        assert_eq!(player.coins, 100, "Coins should be initialized to 100");
        assert_eq!(player.total_points, 200, "Total points should be initialized to 200");
        assert_eq!(player.level, 2, "Level should be initialized to 2");
        assert_eq!(player.experience, 50, "Experience should be initialized to 50");
        assert_eq!(player.creation_day, 42, "Creation day should be initialized to 42");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_initialization() {
        // Use contract_address_const to create a mock address
        let mock_address: ContractAddress = contract_address_const::<0x123>();

        let player = Player {
            address: mock_address,
            coins: 0,
            total_points: 0,
            daily_streak: 0,
            last_active_day: 0,
            level: 1,
            experience: 0,
            creation_day: 1,
        };

        assert_eq!(
            player.address, 
            mock_address, 
            "Player address should match the initialized address"
        );
        assert_eq!(
            player.coins, 
            0, 
            "Initial coins should be 0"
        );
        assert_eq!(
            player.level, 
            1, 
            "Initial level should be 1"
        );
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_zero_values() {
        let player: Player = ZeroablePlayerTrait::zero();

        assert_eq!(
            player.address, 
            constants::ZERO_ADDRESS(), 
            "Player address should match the zero address"
        );
        assert_eq!(
            player.level, 
            1, 
            "Zero player level should be 1"
        );
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_add_coins() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        // Use the constructor instead of direct initialization
        let mut player = PlayerTrait::new(
            mock_address,
            0,    // coins
            0,    // total_points
            0,    // daily_streak
            0,    // last_active_day
            1,    // level
            0,    // experience
            1,    // creation_day
        );

        player.add_coins(50);
        assert_eq!(
            player.coins, 
            50, 
            "Player should have 50 coins after adding 50"
        );

        player.add_coins(100);
        assert_eq!(
            player.coins, 
            150, 
            "Player should have 150 coins after adding 100 more"
        );
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_level_up() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        // Use the constructor instead of direct initialization
        let mut player = PlayerTrait::new(
            mock_address,
            0,    // coins
            0,    // total_points
            0,    // daily_streak
            0,    // last_active_day
            1,    // level
            0,    // experience
            1,    // creation_day
        );

        // Level 1 needs 10 exp to level up (using Experience helper)
        let exp_needed_level_1 = Experience::calculate_exp_needed_for_level(1);
        assert_eq!(exp_needed_level_1, 10, "Level 1 should need 10 exp");
        
        player.add_experience(5);
        assert_eq!(player.level, 1, "Player should still be level 1");
        assert_eq!(player.experience, 5, "Player should have 5 experience");

        // Add 5 more exp to reach 10 and level up
        player.add_experience(5);
        assert_eq!(player.level, 2, "Player should be level 2 after leveling up");
        assert_eq!(player.experience, 0, "Player should have 0 experience after leveling up");

        // Test multiple level ups at once
        // Level 2 needs 40 exp, level 3 needs 90 exp
        player.add_experience(150); // Should reach level 4 with some exp left
        assert_eq!(player.level, 4, "Player should be level 4 after multiple level ups");
        assert_eq!(player.experience, 20, "Player should have correct experience left after leveling up multiple times");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_add_points() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        // Use the constructor instead of direct initialization
        let mut player = PlayerTrait::new(
            mock_address,
            0,    // coins
            0,    // total_points
            0,    // daily_streak
            0,    // last_active_day
            1,    // level
            0,    // experience
            1,    // creation_day
        );

        player.add_points(100);
        assert_eq!(
            player.total_points, 
            100, 
            "Player should have 100 points after adding 100"
        );

        player.add_points(250);
        assert_eq!(
            player.total_points, 
            350, 
            "Player should have 350 points after adding 250 more"
        );
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_complex_scenario() {
        let mock_address: ContractAddress = contract_address_const::<0x789>();
        
        // Initialize player with some starting values
        let mut player = PlayerTrait::new(
            mock_address,
            50,   // coins
            0,    // total_points
            0,    // daily_streak
            0,    // last_active_day
            2,    // level
            15,   // experience
            10,   // creation_day
        );
        
        // Simulate a game session
        player.add_coins(75);      // Collected coins during gameplay
        player.add_points(1500);   // Scored points
        player.add_experience(100); // Gained experience - should trigger multiple level ups
        
        // Verify final state
        assert_eq!(player.coins, 125, "Player should have 125 coins total");
        assert_eq!(player.total_points, 1500, "Player should have 1500 total points");
        assert_eq!(player.level, 3, "Player should be level 3 after gaining experience");
        
        // Calculate expected remaining exp:
        // Starting: Level 2 with 15 exp
        // Add 100 exp = 115 exp
        // Level 2 needs 40 exp, so after level up: 115 - 40 = 75 exp at level 3
        // Level 3 needs 90 exp, not enough to level up again
        assert_eq!(player.experience, 75, "Player should have 75 remaining experience");
        assert_eq!(player.creation_day, 10, "Creation day should remain unchanged");
    }
}