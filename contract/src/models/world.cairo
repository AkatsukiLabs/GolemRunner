// Starknet imports
use core::num::traits::zero::Zero;

// Model
#[derive(Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct World {
    #[key]
    pub id: u256,
    pub name: felt252,
    pub description: felt252,
    pub price: u256,
    pub is_starter: bool   
}

// Traits Implementations
#[generate_trait]
pub impl WorldImpl of WorldTrait {
    fn new(
        id: u256,
        name: felt252,
        description: felt252,
        price: u256,
        is_starter: bool,
    ) -> World {
        World {
            id,
            name,
            description,
            price,
            is_starter,
        }
    }
    
}

impl ZeroableWorldTrait of Zero<World> {
    #[inline(always)]
    fn zero() -> World {
        World {
            id: 0,
            name: '',
            description: '',
            price: 0,
            is_starter: false,
        }
    }

    #[inline(always)]
    fn is_zero(self: @World) -> bool {
        *self.id == 0.into()
    }

    #[inline(always)]
    fn is_non_zero(self: @World) -> bool {
        !self.is_zero()
    }
}

// Tests
#[cfg(test)]
mod tests {
    use super::{World, WorldImpl, WorldTrait, ZeroableWorldTrait};

    #[test]
    #[available_gas(1000000)]
    fn test_world_new_constructor() {
        let id: u256 = 1;
        let name = 'Fire Realm';
        let description = 'A world of flames and pain';
        let price: u256 = 1000;
        let is_starter = false;
        
        let world = WorldTrait::new(
            id,
            name,
            description,
            price,
            is_starter,
        );
        
        assert_eq!(world.id, id, "World ID should match the initialized ID");
        assert_eq!(world.name, name, "World name should match");
        assert_eq!(world.description, description, "World description should match");
        assert_eq!(world.price, price, "World price should match");
        assert_eq!(world.is_starter, is_starter, "World starter status should match");
    }
    
    #[test]
    #[available_gas(1000000)]
    fn test_world_zero_values() {
        let world: World = ZeroableWorldTrait::zero();
        
        assert_eq!(world.id, 0, "Zero world ID should be 0");
        assert_eq!(world.name,'', "World name should be empty");
        assert_eq!(world.description, '', "World description should be empty");
        assert_eq!(world.price, 0, "Zero world price should be 0");
        assert_eq!(world.is_starter, false, "Zero world should not be a starter world");
    }
    
}