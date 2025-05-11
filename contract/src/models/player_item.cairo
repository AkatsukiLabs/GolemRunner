// Starknet imports
use starknet::ContractAddress;

// Types imports
use golem_runner::types::item::{ItemType, ItemTypeTrait};

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct PlayerItem {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub item_type: ItemType,
    #[key]
    pub item_id: u256,
    pub is_unlocked: bool  
}

// Traits Implementations
#[generate_trait]
pub impl PlayerItemImpl of PlayerItemTrait {
    fn new(
        player: ContractAddress,
        item_type: ItemType,
        item_id: u256,
        is_unlocked: bool,
    ) -> PlayerItem {
        PlayerItem {
            player,
            item_type,
            item_id,
            is_unlocked,
        }
    }
    
    // Helper to unlock an item
    fn unlock(ref self: PlayerItem) {
        self.is_unlocked = true;
    }
    
    // Helper to check if the item is a golem
    fn is_golem(self: @PlayerItem) -> bool {
        self.item_type.is_golem()
    }
    
    // Helper to check if the item is a world
    fn is_world(self: @PlayerItem) -> bool {
        self.item_type.is_world()
    }
}


// Tests
#[cfg(test)]
mod tests {
    use super::{PlayerItemImpl, PlayerItemTrait};
    use golem_runner::types::item::{ItemType, ItemTypeTrait};
    use starknet::{ContractAddress, contract_address_const};

    #[test]
    #[available_gas(1000000)]
    fn test_player_item_new_constructor() {
        let player_address: ContractAddress = contract_address_const::<0x123>();
        let item_type = ItemType::Golem;
        let item_id: u256 = 42;
        let is_unlocked = true;
        
        let player_item = PlayerItemTrait::new(
            player_address,
            item_type,
            item_id,
            is_unlocked,
        );
        
        assert_eq!(player_item.player, player_address, "Player address should match");
        
        // Verify item type
        match player_item.item_type {
            ItemType::Golem => (), // Correct
            _ => panic!("Item type should be Golem"),
        }
        
        assert_eq!(player_item.item_id, item_id, "Item ID should match");
        assert_eq!(player_item.is_unlocked, is_unlocked, "Unlock status should match");
    }
    
    
    #[test]
    #[available_gas(1000000)]
    fn test_player_item_unlock() {
        let player_address: ContractAddress = contract_address_const::<0x123>();
        let mut player_item = PlayerItemTrait::new(
            player_address,
            ItemType::World,
            1,
            false,
        );
        
        // Initially not unlocked
        assert_eq!(player_item.is_unlocked, false, "Item should start as locked");
        
        // Unlock the item
        player_item.unlock();
        
        // Verify that the item is now unlocked
        assert_eq!(player_item.is_unlocked, true, "Item should be unlocked after unlock()");
    }
    
    #[test]
    #[available_gas(1000000)]
    fn test_player_item_type_helpers() {
        let player_address: ContractAddress = contract_address_const::<0x123>();
        
        // Create golem and world items
        let golem_item = PlayerItemTrait::new(
            player_address,
            ItemType::Golem,
            1,
            true,
        );
        
        let world_item = PlayerItemTrait::new(
            player_address,
            ItemType::World,
            2,
            true,
        );
        
        // Verify item type helpers
        assert(golem_item.is_golem(), 'Item should identified golem');
        assert(!golem_item.is_world(), 'Item should no identified world');
        
        assert(world_item.is_world(), 'Item should identified as world');
        assert(!world_item.is_golem(), 'Item should no identified golem');
    }
    
    #[test]
    #[available_gas(1000000)]
    fn test_item_type_trait_methods() {
        // Test ItemType methods
        let world_type = ItemType::World;
        let golem_type = ItemType::Golem;
        
        assert(world_type.is_world(), 'Type should identified as world');
        assert(!world_type.is_golem(), 'Type should no identified golem');
        
        assert(golem_type.is_golem(), 'Type should identified as golem');
        assert(!golem_type.is_world(), 'Type should no identified world');
    }
    
    #[test]
    #[available_gas(1000000)]
    fn test_player_item_complex_scenario() {
        let player_address: ContractAddress = contract_address_const::<0x789>();
        
        // Create a collection of items for a player
        let mut golem_1 = PlayerItemTrait::new(
            player_address,
            ItemType::Golem,
            1,
            true,  // Initial golem unlocked
        );
        
        let mut golem_2 = PlayerItemTrait::new(
            player_address,
            ItemType::Golem,
            2,
            false, // Premium golem unlocked
        );
        
        let mut world_1 = PlayerItemTrait::new(
            player_address,
            ItemType::World,
            1,
            true,  // Initial world unlocked
        );
        
        let mut world_2 = PlayerItemTrait::new(
            player_address,
            ItemType::World,
            2,
            false, // Premium world unlocked
        );
        
        // Simulate unlocking premium items
        golem_2.unlock();
        world_2.unlock();
        
        // Validate that items are unlocked
        assert(golem_1.is_unlocked, 'Golem should be unlocked');
        assert(golem_2.is_unlocked, 'Golem should be unlocked after');
        assert(world_1.is_unlocked, 'World should be unlocked');
        assert(world_2.is_unlocked, 'World should be unlocked after');
        
        // Validate item types
        assert(golem_1.is_golem(), 'Golem 1 should identified golem');
        assert(golem_2.is_golem(), 'Golem 2 should identified golem');
        assert(world_1.is_world(), 'World 1 should identified world');
        assert(world_2.is_world(), 'World 2 should identified world');
    }
}