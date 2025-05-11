use core::byte_array::ByteArrayTrait;

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
pub enum ItemType {
    World,    // Worlds/Maps
    Golem,    // Golems
}

#[generate_trait]
pub impl ItemTypeImpl of ItemTypeTrait {
    fn is_golem(self: @ItemType) -> bool {
        match self {
            ItemType::Golem => true,
            _ => false,
        }
    }
    
    fn is_world(self: @ItemType) -> bool {
        match self {
            ItemType::World => true,
            _ => false,
        }
    }
}

pub impl ItemTypeDisplay of core::fmt::Display<ItemType> {
    fn fmt(self: @ItemType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let s = match self {
            ItemType::World => "World",
            ItemType::Golem => "Golem",
        };
        f.buffer.append(@s);
        Result::Ok(())
    }
}