use core::byte_array::ByteArrayTrait;

#[derive(Drop, Serde, IntrospectPacked, Debug, PartialEq, Copy)]
pub enum WorldType {
    Forest,   
    Volcano, 
    Glacier,
}

#[generate_trait]
pub impl WorldTypeImpl of WorldTypeTrait {
    fn is_forest(self: @WorldType) -> bool {
        match self {
            WorldType::Forest => true,
            _ => false,
        }
    }
    
    fn is_volcano(self: @WorldType) -> bool {
        match self {
            WorldType::Volcano => true,
            _ => false,
        }
    }
    
    fn is_glacier(self: @WorldType) -> bool {
        match self {
            WorldType::Glacier => true,
            _ => false,
        }
    }
}

pub impl WorldTypeDisplay of core::fmt::Display<WorldType> {
    fn fmt(self: @WorldType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let s = match self {
            WorldType::Forest => "Forest",
            WorldType::Volcano => "Volcano",
            WorldType::Glacier => "Glacier",
        };
        f.buffer.append(@s);
        Result::Ok(())
    }
}