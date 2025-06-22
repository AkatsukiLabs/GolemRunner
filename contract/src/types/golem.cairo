use core::byte_array::ByteArrayTrait;

#[derive(Drop, Serde, IntrospectPacked, Debug, PartialEq, Copy)]
pub enum GolemType {
    Fire,
    Ice,
    Stone,
}

#[generate_trait]
pub impl GolemTypeImpl of GolemTypeTrait {
    fn is_fire(self: @GolemType) -> bool {
        match self {
            GolemType::Fire => true,
            _ => false,
        }
    }
    
    fn is_ice(self: @GolemType) -> bool {
        match self {
            GolemType::Ice => true,
            _ => false,
        }
    }
    
    fn is_stone(self: @GolemType) -> bool {
        match self {
            GolemType::Stone => true,
            _ => false,
        }
    }
}

pub impl GolemTypeDisplay of core::fmt::Display<GolemType> {
    fn fmt(self: @GolemType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let s = match self {
            GolemType::Fire => "Fire",
            GolemType::Ice => "Ice",
            GolemType::Stone => "Stone",
        };
        f.buffer.append(@s);
        Result::Ok(())
    }
}
