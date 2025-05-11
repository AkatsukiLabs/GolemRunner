// Starknet imports
use core::num::traits::zero::Zero;
use golem_runner::types::rarity::Rarity;
use starknet::ContractAddress;

// Constants imports
use golem_runner::constants;

// Model
#[derive(Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Golem {
    #[key]
    pub id: u256,
    #[key]
    pub player_id: ContractAddress,
    pub name: felt252,
    pub description: felt252,
    pub price: u64,
    pub rarity: Rarity,    
    pub is_starter: bool,
    pub is_unlocked: bool, 
}

// Traits Implementations
#[generate_trait]
pub impl GolemImpl of GolemTrait {
    fn new(
        id: u256,
        player_id: ContractAddress,
        name: felt252,
        description: felt252,
        price: u64,
        rarity: Rarity,
        is_starter: bool,
        is_unlocked: bool,
    ) -> Golem {
        Golem {
            id,
            player_id,
            name,
            description,
            price,
            rarity,
            is_starter,
            is_unlocked,
        }
    }
}

pub impl ZeroableGolemTrait of Zero<Golem> {
    #[inline(always)]
    fn zero() -> Golem {
        Golem {
            id: 0,
            player_id: constants::ZERO_ADDRESS(),
            name: '',
            description: '',
            price: 0,
            rarity: Rarity::Basic,
            is_starter: false,
            is_unlocked: false,
        }
    }

    #[inline(always)]
    fn is_zero(self: @Golem) -> bool {
        *self.id == 0
    }

    #[inline(always)]
    fn is_non_zero(self: @Golem) -> bool {
        !self.is_zero()
    }
}


// Tests
#[cfg(test)]
mod tests {
    use super::{Golem, GolemImpl, GolemTrait, ZeroableGolemTrait};
    use golem_runner::types::rarity::{Rarity, RarityTrait};
    use starknet::{ContractAddress, contract_address_const};

    #[test]
    #[available_gas(1000000)]
    fn test_golem_new_constructor() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();

        let id: u256 = 1;
        let name = 'Fire Golem';
        let description = 'A fiery elemental being';
        let price: u64 = 500;
        let rarity = Rarity::Epic;
        let is_starter = false;
        let is_unlocked = true;
        
        let golem = GolemTrait::new(
            id,
            mock_address,
            name,
            description,
            price,
            rarity,
            is_starter,
            is_unlocked
        );
        
        assert_eq!(golem.id, id, "Golem ID should match the initialized ID");
        assert_eq!(golem.name, name, "Golem name should match");
        assert_eq!(golem.description, description, "Golem description should match");
        assert_eq!(golem.price, price, "Golem price should match");
        
        // Verify that the rarity is assigned correctly
        match golem.rarity {
            Rarity::Epic => (), // Correct
            _ => panic!("Golem rarity should be Epic"),
        }
        
        assert_eq!(golem.is_starter, is_starter, "Golem starter status should match");
    }
    
    #[test]
    #[available_gas(1000000)]
    fn test_golem_zero_values() {
        let golem: Golem = ZeroableGolemTrait::zero();
        
        assert_eq!(golem.id, 0, "Zero golem ID should be 0");
        assert_eq!(golem.name, '', "Golem name should be empty");
        assert_eq!(golem.description, '', "Golem description should be empty");
        assert_eq!(golem.price, 0, "Zero golem price should be 0");
        
        // Verify that the zero golem has Basic rarity
        match golem.rarity {
            Rarity::Basic => (), // Correct
            _ => panic!("Zero golem should have Basic rarity"),
        }
        
        assert_eq!(golem.is_starter, false, "Zero golem should not be a starter golem");
    }
    
    #[test]
    #[available_gas(1000000)]
    fn test_golem_with_different_rarities() {
        // Create golems with different rarities
        let basic_golem = GolemTrait::new(
            1,
            contract_address_const::<0x123>(),
            'Clay Golem',
            'A simple golem made of clay',
            50,
            Rarity::Basic,
            true,
            false,
        );
        
        let common_golem = GolemTrait::new(
            2,
            contract_address_const::<0x456>(),
            'Stone Golem',
            'A basic earth elemental',
            100,
            Rarity::Common,
            true,
            false,
        );
        
        let rare_golem = GolemTrait::new(
            3,
            contract_address_const::<0x789>(),
            'Water Golem',
            'A flowing water elemental',
            500,
            Rarity::Rare,
            false,
            false,
        );
        
        let epic_golem = GolemTrait::new(
            4,
            contract_address_const::<0xabc>(),
            'Fire Golem',
            'A blazing fire elemental',
            1000,
            Rarity::Epic,
            false,
            false,
        );
        
        let unique_golem = GolemTrait::new(
            5,
            contract_address_const::<0xdef>(),
            'Lightning Golem',
            'A powerful lightning elemental',
            2500,
            Rarity::Unique,
            false,
            false,
        );
        
        // Verify that the is_rare() method works correctly
        assert(!basic_golem.rarity.is_rare(), 'Basic golem should not be rare');
        assert(!common_golem.rarity.is_rare(), 'Common golem should not be rare');
        assert(rare_golem.rarity.is_rare(), 'Rare golem should be rare');
        assert(epic_golem.rarity.is_rare(), 'Epic golem should be rare');
        assert(unique_golem.rarity.is_rare(), 'Unique golem should be rare');
        
        // Verify that the prices are in ascending order according to rarity
        assert(basic_golem.price < common_golem.price, 'Basic should be cheaper common');
        assert(common_golem.price < rare_golem.price, 'Common should be cheaper rare');
        assert(rare_golem.price < epic_golem.price, 'Rare should be cheaper epic');
        assert(epic_golem.price < unique_golem.price, 'Epic should be cheaper unique');
    }
    
    #[test]
    #[available_gas(1000000)]
    fn test_starter_golem() {
        // Create a starter golem
        let starter_golem = GolemTrait::new(
            1,
            contract_address_const::<0x123>(),
            'Earth Golem',
            'A basic starter golem',
            0,  // Price 0 for starter golem
            Rarity::Common,
            true,
            false,
        );
        
        // Verify that the starter golem has the expected properties
        assert_eq!(starter_golem.is_starter, true, "Golem should be a starter golem");
        assert_eq!(starter_golem.price, 0, "Starter golem should be free");
        
        match starter_golem.rarity {
            Rarity::Common => (), // Correct for starter golem
            _ => panic!("Starter golem should have Common rarity"),
        }
    }
}
