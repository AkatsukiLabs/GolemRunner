use core::byte_array::ByteArrayTrait;

#[derive(Drop, Serde, IntrospectPacked, Debug)]
pub enum Rarity {
    Basic,
    Common,
    Uncommon,
    Rare,
    VeryRare,
    Epic,
    Unique,
}

#[generate_trait]
pub impl RarityImpl of RarityTrait {
    fn is_rare(self: @Rarity) -> bool {
        match self {
            Rarity::Rare | Rarity::VeryRare | Rarity::Epic | Rarity::Unique => true,
            _ => false,
        }
    }
}

pub impl RarityDisplay of core::fmt::Display<Rarity> {
    fn fmt(self: @Rarity, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let s = match self {
            Rarity::Basic => "Basic",
            Rarity::Common => "Common",
            Rarity::Uncommon => "Uncommon",
            Rarity::Rare => "Rare",
            Rarity::VeryRare => "Very Rare",
            Rarity::Epic => "Epic",
            Rarity::Unique => "Unique",
        };
        f.buffer.append(@s);
        Result::Ok(())
    }
}


#[cfg(test)]
mod tests {
    use golem_runner::types::rarity::{Rarity, RarityTrait};
    use golem_runner::models::golem::{Golem, GolemTrait, ZeroableGolemTrait};

    #[test]
    #[available_gas(1000000)]
    fn test_golem_new_constructor() {
        let id: u256 = 1;
        let name = 'Fire Golem';
        let description = 'A fiery elemental being';
        let price: u256 = 500;
        let rarity = Rarity::Epic;
        let is_starter = false;
        
        let golem = GolemTrait::new(
            id,
            name,
            description,
            price,
            rarity,
            is_starter,
        );
        
        assert_eq!(golem.id, id, "Golem ID should match the initialized ID");
        assert_eq!(golem.name, name, "Golem name should match");
        assert_eq!(golem.description, description, "Golem description should match");
        assert_eq!(golem.price, price, "Golem price should match");
        
        // Verificar que la rareza se asigna correctamente
        match golem.rarity {
            Rarity::Epic => (), // Correcto
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
            'Clay Golem',
            'A simple golem made of clay',
            50,
            Rarity::Basic,
            true,
        );
        
        let common_golem = GolemTrait::new(
            2,
            'Stone Golem',
            'A basic earth elemental',
            100,
            Rarity::Common,
            true,
        );
        
        let rare_golem = GolemTrait::new(
            3,
            'Water Golem',
            'A flowing water elemental',
            500,
            Rarity::Rare,
            false,
        );
        
        let epic_golem = GolemTrait::new(
            4,
            'Fire Golem',
            'A blazing fire elemental',
            1000,
            Rarity::Epic,
            false,
        );
        
        let unique_golem = GolemTrait::new(
            5,
            'Lightning Golem',
            'A powerful lightning elemental',
            2500,
            Rarity::Unique,
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
            'Earth Golem',
            'A basic starter golem',
            0,  // Price 0 for starter golem
            Rarity::Common,
            true,
        );
        
        // Verify that the starter golem has the expected properties
        assert_eq!(starter_golem.is_starter, true, "Golem should be a starter golem");
        assert_eq!(starter_golem.price, 0, "Starter golem should be free");
        
        match starter_golem.rarity {
            Rarity::Common => (), // Correct for starter golem
            _ => panic!("Starter golem should have Common rarity"),
        }
    }
    
    #[test]
    #[available_gas(1000000)]
    fn test_rarity_display() {
        // Test display impl for Rarity
        let basic_str = format!("{}", Rarity::Basic);
        let common_str = format!("{}", Rarity::Common);
        let uncommon_str = format!("{}", Rarity::Uncommon);
        let rare_str = format!("{}", Rarity::Rare);
        let very_rare_str = format!("{}", Rarity::VeryRare);
        let epic_str = format!("{}", Rarity::Epic);
        let unique_str = format!("{}", Rarity::Unique);
        
        assert_eq!(basic_str, "Basic", "Basic should display correctly");
        assert_eq!(common_str, "Common", "Common should display correctly");
        assert_eq!(uncommon_str, "Uncommon", "Uncommon should display correctly");
        assert_eq!(rare_str, "Rare", "Rare should display correctly");
        assert_eq!(very_rare_str, "Very Rare", "Very Rare should display correctly");
        assert_eq!(epic_str, "Epic", "Epic should display correctly");
        assert_eq!(unique_str, "Unique", "Unique should display correctly");
    }
}