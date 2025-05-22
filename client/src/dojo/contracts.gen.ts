import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface } from "starknet";

export function setupWorld(provider: DojoProvider) {

	const build_game_rewardPlayer_calldata = (points: number, coinsCollected: number): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "reward_player",
			calldata: [points, coinsCollected],
		};
	};

	const game_rewardPlayer = async (snAccount: Account | AccountInterface, points: number, coinsCollected: number) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_rewardPlayer_calldata(points, coinsCollected),
				"golem_runner",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_spawnPlayer_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "spawn_player",
			calldata: [],
		};
	};

	const game_spawnPlayer = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_spawnPlayer_calldata(),
				"golem_runner",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_unlockGolemStore_calldata = (golemId: number): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "unlock_golem_store",
			calldata: [golemId],
		};
	};

	const game_unlockGolemStore = async (snAccount: Account | AccountInterface, golemId: number) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_unlockGolemStore_calldata(golemId),
				"golem_runner",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_unlockWorldStore_calldata = (worldId: number): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "unlock_world_store",
			calldata: [worldId],
		};
	};

	const game_unlockWorldStore = async (snAccount: Account | AccountInterface, worldId: number) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_unlockWorldStore_calldata(worldId),
				"golem_runner",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_updateGolemName_calldata = (golemId: number, name: number): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "update_golem_name",
			calldata: [golemId, name],
		};
	};

	const game_updateGolemName = async (snAccount: Account | AccountInterface, golemId: number, name: number) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_updateGolemName_calldata(golemId, name),
				"golem_runner",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_updatePlayerDailyStreak_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "update_player_daily_streak",
			calldata: [],
		};
	};

	const game_updatePlayerDailyStreak = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_updatePlayerDailyStreak_calldata(),
				"golem_runner",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_updatePlayerRanking_calldata = (worldId: number, points: number): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "update_player_ranking",
			calldata: [worldId, points],
		};
	};

	const game_updatePlayerRanking = async (snAccount: Account | AccountInterface, worldId: number, points: number) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_updatePlayerRanking_calldata(worldId, points),
				"golem_runner",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		game: {
			rewardPlayer: game_rewardPlayer,
			buildRewardPlayerCalldata: build_game_rewardPlayer_calldata,
			spawnPlayer: game_spawnPlayer,
			buildSpawnPlayerCalldata: build_game_spawnPlayer_calldata,
			unlockGolemStore: game_unlockGolemStore,
			buildUnlockGolemStoreCalldata: build_game_unlockGolemStore_calldata,
			unlockWorldStore: game_unlockWorldStore,
			buildUnlockWorldStoreCalldata: build_game_unlockWorldStore_calldata,
			updateGolemName: game_updateGolemName,
			buildUpdateGolemNameCalldata: build_game_updateGolemName_calldata,
			updatePlayerDailyStreak: game_updatePlayerDailyStreak,
			buildUpdatePlayerDailyStreakCalldata: build_game_updatePlayerDailyStreak_calldata,
			updatePlayerRanking: game_updatePlayerRanking,
			buildUpdatePlayerRankingCalldata: build_game_updatePlayerRanking_calldata,
		},
	};
}