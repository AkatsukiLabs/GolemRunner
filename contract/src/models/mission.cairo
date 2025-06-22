// Starknet imports
use starknet::ContractAddress;
use core::num::traits::zero::Zero;

// Constants imports
use golem_runner::constants;

// Types imports
use golem_runner::types::golem::GolemType;
use golem_runner::types::world::WorldType;
use golem_runner::types::mission_status::MissionStatus;

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct Mission {
    #[key]
    pub id: u256,
    #[key]
    pub player_id: ContractAddress,
    pub target_coins: u64,           // Amount of coins to collect
    pub required_world: WorldType,   // World where mission must be completed
    pub required_golem: GolemType,   // Golem that must be used
    pub description: ByteArray,      // Human readable description
    pub status: MissionStatus,       // Current status
    pub created_at: u32,             // Day when mission was created
}

// Traits Implementation
#[generate_trait]
pub impl MissionImpl of MissionTrait {
    fn new_mission(
        id: u256,
        player_id: ContractAddress,
        target_coins: u64,
        required_world: WorldType,
        required_golem: GolemType,
        description: ByteArray,
        created_at: u32,
    ) -> Mission {
        Mission {
            id,
            player_id,
            target_coins,
            required_world,
            required_golem,
            description,
            status: MissionStatus::Pending,
            created_at,
        }
    }

    fn update_mission_status(ref self: Mission) {
        if self.status == MissionStatus::Pending {
            self.status = MissionStatus::Completed;
        }
    }

    fn validate_requirements(self: @Mission, world_used: WorldType, golem_used: GolemType) -> bool {
        world_used == *self.required_world && golem_used == *self.required_golem
    }
}

#[generate_trait]
pub impl MissionAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Mission) {
        assert(self.is_non_zero(), 'Mission: Does not exist');
    }

    #[inline(always)]
    fn assert_not_exists(self: Mission) {
        assert(self.is_zero(), 'Mission: Already exists');
    }

    #[inline(always)]
    fn assert_pending(self: Mission) {
        assert(self.status == MissionStatus::Pending, 'Mission: Not pending');
    }

    #[inline(always)]
    fn assert_completed(self: Mission) {
        assert(self.status == MissionStatus::Completed, 'Mission: Not completed');
    }
}

pub impl ZeroableMissionTrait of Zero<Mission> {
    #[inline(always)]
    fn zero() -> Mission {
        Mission {
            id: 0,
            player_id: constants::ZERO_ADDRESS(),
            target_coins: 0,
            required_world: WorldType::Forest,
            required_golem: GolemType::Stone,
            description: "",
            status: MissionStatus::Pending,
            created_at: 0,
        }
    }

    #[inline(always)]
    fn is_zero(self: @Mission) -> bool {
        *self.id == 0
    }

    #[inline(always)]
    fn is_non_zero(self: @Mission) -> bool {
        !self.is_zero()
    }
}

// Tests
#[cfg(test)]
mod tests {
    use super::{MissionImpl, MissionTrait, MissionStatus, ZeroableMissionTrait};
    use golem_runner::types::golem::GolemType;
    use golem_runner::types::world::WorldType;
    use starknet::{ContractAddress, contract_address_const};

    #[test]
    #[available_gas(1000000)]
    fn test_new_mission() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mission = MissionTrait::new_mission(
            1, // id
            mock_address,
            75, // target_coins
            WorldType::Glacier, // required_world (Ice Realm)
            GolemType::Stone, // required_golem
            "Collect 75 coins in the Ice Realm with your Stone golem",
            1, // created_day
        );

        assert_eq!(mission.id, 1, "Mission ID should match");
        assert_eq!(mission.player_id, mock_address, "Player ID should match");
        assert_eq!(mission.target_coins, 75, "Target coins should match");
        assert_eq!(mission.status, MissionStatus::Pending, "Mission should be pending");
        assert_eq!(mission.created_at, 1, "Created day should match");
        assert_eq!(mission.description, "Collect 75 coins in the Ice Realm with your Stone golem", "Description should match");
        
        match mission.required_world {
            WorldType::Glacier => (), // Correct (Ice Realm)
            _ => panic!("Required world should be Glacier"),
        }
        
        match mission.required_golem {
            GolemType::Stone => (), // Correct
            _ => panic!("Required golem should be Stone"),
        }
    }

    #[test]
    #[available_gas(1000000)]
    fn test_update_mission_status_from_pending() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mut mission = MissionTrait::new_mission(
            1,
            mock_address,
            100, // target_coins
            WorldType::Volcano, // required_world
            GolemType::Fire, // required_golem
            "Collect 100 coins in Volcano with Fire golem",
            1,
        );

        // Initially should be pending
        assert_eq!(mission.status, MissionStatus::Pending, "Mission should be pending");

        // Update status to completed
        mission.update_mission_status();
        assert_eq!(mission.status, MissionStatus::Completed, "Mission should be completed");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_update_mission_status_already_completed() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mut mission = MissionTrait::new_mission(
            1,
            mock_address,
            50,
            WorldType::Forest,
            GolemType::Stone,
            "Collect 50 coins in Forest with Stone golem",
            1,
        );

        // Complete the mission first
        mission.update_mission_status();
        assert_eq!(mission.status, MissionStatus::Completed, "Mission should be completed");

        // Try to update again (should remain completed)
        mission.update_mission_status();
        assert_eq!(mission.status, MissionStatus::Completed, "Mission should still be completed");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_validate_requirements_correct() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mission = MissionTrait::new_mission(
            1,
            mock_address,
            80,
            WorldType::Glacier, // Required: Ice Realm
            GolemType::Ice, // Required: Ice golem
            "Collect 80 coins in Ice Realm with Ice golem",
            1,
        );

        // Test with correct requirements
        let valid = mission.validate_requirements(WorldType::Glacier, GolemType::Ice);
        assert!(valid, "Should accept correct world and golem");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_validate_requirements_wrong_world() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mission = MissionTrait::new_mission(
            1,
            mock_address,
            60,
            WorldType::Volcano, // Required: Volcano
            GolemType::Fire,
            "Collect 60 coins in Volcano with Fire golem",
            1,
        );

        // Test with wrong world
        let invalid = mission.validate_requirements(WorldType::Forest, GolemType::Fire);
        assert!(!invalid, "Should reject wrong world");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_validate_requirements_wrong_golem() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mission = MissionTrait::new_mission(
            1,
            mock_address,
            40,
            WorldType::Forest,
            GolemType::Stone, // Required: Stone golem
            "Collect 40 coins in Forest with Stone golem",
            1,
        );

        // Test with wrong golem
        let invalid = mission.validate_requirements(WorldType::Forest, GolemType::Fire);
        assert!(!invalid, "Should reject wrong golem");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_validate_requirements_both_wrong() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mission = MissionTrait::new_mission(
            1,
            mock_address,
            90,
            WorldType::Glacier,
            GolemType::Ice,
            "Collect 90 coins in Ice Realm with Ice golem",
            1,
        );

        // Test with both wrong
        let invalid = mission.validate_requirements(WorldType::Volcano, GolemType::Fire);
        assert!(!invalid, "Should reject both wrong world and golem");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_mission_different_targets() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        // Test different coin targets
        let mission_25 = MissionTrait::new_mission(
            1, mock_address, 25, WorldType::Forest, GolemType::Stone,
            "Collect 25 coins", 1
        );
        
        let mission_100 = MissionTrait::new_mission(
            2, mock_address, 100, WorldType::Volcano, GolemType::Fire,
            "Collect 100 coins", 1
        );
        
        let mission_500 = MissionTrait::new_mission(
            3, mock_address, 500, WorldType::Glacier, GolemType::Ice,
            "Collect 500 coins", 1
        );

        assert_eq!(mission_25.target_coins, 25, "First mission should target 25 coins");
        assert_eq!(mission_100.target_coins, 100, "Second mission should target 100 coins");
        assert_eq!(mission_500.target_coins, 500, "Third mission should target 500 coins");

        // All should start as pending
        assert_eq!(mission_25.status, MissionStatus::Pending, "Mission should be pending");
        assert_eq!(mission_100.status, MissionStatus::Pending, "Mission should be pending");
        assert_eq!(mission_500.status, MissionStatus::Pending, "Mission should be pending");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_mission_complete_workflow() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        // Create a new mission
        let mut mission = MissionTrait::new_mission(
            1,
            mock_address,
            75,
            WorldType::Glacier,
            GolemType::Ice,
            "Collect 75 coins in Ice Realm with Ice golem",
            5,
        );

        // Verify initial state
        assert_eq!(mission.status, MissionStatus::Pending, "Mission should start pending");
        assert_eq!(mission.target_coins, 75, "Target should be 75 coins");
        assert_eq!(mission.created_at, 5, "Created day should be 5");

        // Validate with wrong requirements (should fail)
        let wrong_validation = mission.validate_requirements(WorldType::Forest, GolemType::Stone);
        assert!(!wrong_validation, "Wrong requirements should not validate");

        // Validate with correct requirements (should pass)
        let correct_validation = mission.validate_requirements(WorldType::Glacier, GolemType::Ice);
        assert!(correct_validation, "Correct requirements should validate");

        // Complete the mission
        mission.update_mission_status();
        assert_eq!(mission.status, MissionStatus::Completed, "Mission should be completed");

        // Validation should still work after completion
        let still_valid = mission.validate_requirements(WorldType::Glacier, GolemType::Ice);
        assert!(still_valid, "Requirements should still validate after completion");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_mission_non_zero() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mission = MissionTrait::new_mission(
            1, // non-zero id
            mock_address,
            100,
            WorldType::Volcano,
            GolemType::Fire,
            "Non-zero mission",
            1,
        );

        // Mission with non-zero ID should not be considered "zero"
        assert!(!mission.is_zero(), "Non-zero mission should not be zero");
        assert!(mission.is_non_zero(), "Non-zero mission should be non-zero");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_mission_display_formatting() {
        // Test status display formatting
        let pending_str = format!("{}", MissionStatus::Pending);
        let completed_str = format!("{}", MissionStatus::Completed);
        
        assert_eq!(pending_str, "Pending", "Pending should display correctly");
        assert_eq!(completed_str, "Completed", "Completed should display correctly");
    }
}