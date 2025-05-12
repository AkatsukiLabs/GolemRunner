// Starknet imports
use starknet::{ContractAddress};

// Model
#[derive(Drop, Serde, Copy, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Ranking {
    #[key]
    pub world_id: u256,
    #[key]
    pub player: ContractAddress,       
    pub points: u64,        
}

// Traits Implementations
#[generate_trait]
pub impl RankingImpl of RankingTrait {
    fn new(
        world_id: u256,
        player: ContractAddress,
        points: u64,
    ) -> Ranking {
        Ranking {
            world_id,
            player,
            points,
        }
    }
    
    fn update_ranking(ref self: Ranking, points: u64) -> bool {
        // Verify if the new score and coins is better than the current one
        if points > self.points {
            // Update the fields with the new record
            self.points = points;
            return true;
        }
        
        // Ranking not updated
        return false;
    }
}

#[cfg(test)]
mod tests {
    use super::{RankingImpl, RankingTrait};
    use starknet::{ContractAddress, contract_address_const};

    #[test]
    #[available_gas(1000000)]
    fn test_player_ranking_new() {
        let player_address: ContractAddress = contract_address_const::<0x123>();
        
        let world_id: u256 = 1;
        let points: u64 = 15075; 
        
        let ranking = RankingTrait::new(
            world_id,
            player_address,
            points,
        );
        
        assert_eq!(ranking.world_id, world_id, "World ID should match");
        assert_eq!(ranking.player, player_address, "Player address should match");
        assert_eq!(ranking.points, points, "Points should match");
    }
    
    #[test]
    #[available_gas(1000000)]
    fn test_update_if_better_with_better_score() {
        let player_address: ContractAddress = contract_address_const::<0x123>();
        
        // Initial ranking
        let mut ranking = RankingTrait::new(
            1, // world_id
            player_address,
            10050, // points
        );
        
        // Try to update with a better score
        let better_points: u64 = 15075;
        
        let updated = ranking.update_ranking (
            better_points,
        );
        
        // Verify that the ranking was updated
        assert(updated, 'Ranking should be updated');
        assert_eq!(ranking.points, better_points, "Points should be updated");
    }
    
    #[test]
    #[available_gas(1000000)]
    fn test_update_if_better_with_worse_score() {
        let player_address: ContractAddress = contract_address_const::<0x123>();
        
        // Create an initial ranking
        let mut ranking = RankingTrait::new(
            1, // world_id
            player_address,
            15075, // points
        );
        
        // Save the original values to compare later
        let original_points = ranking.points;
        
        // Try to update with a worse score
        let worse_points: u64 = 10050;
        
        let updated = ranking.update_ranking (
            worse_points,
        );
        
        // Verify that the record was NOT updated
        assert(!updated, 'Ranking should not be updated');
        assert_eq!(ranking.points, original_points, "Points should not change");
    }
}