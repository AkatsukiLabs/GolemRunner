
import { Connector } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";
import { ColorMode, SessionPolicies, ControllerOptions, } from "@cartridge/controller";
import { constants } from "starknet";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

const CONTRACT_ADDRESS_GAME = '0x36a518498c1d7de4106b8904f0878e1e7b78c73614001fba22eba0adca80387'

const policies: SessionPolicies = {
  contracts: {
    [CONTRACT_ADDRESS_GAME]: {
      methods: [
        { name: "spawn_player", entrypoint: "spawn_player" },
        { name: "reward_player", entrypoint: "reward_player" },
        { name: "update_player_ranking", entrypoint: "update_player_ranking" },
        { name: "update_player_daily_streak", entrypoint: "update_player_daily_streak" },
        { name: "update_golem_name", entrypoint: "update_golem_name" },
        { name: "unlock_golem_store", entrypoint: "unlock_golem_store" },
        { name: "unlock_world_store", entrypoint: "unlock_world_store" },
        { name: "create_mission", entrypoint: "create_mission" },
        { name: "update_mission", entrypoint: "update_mission" },
        { name: "reward_current_mission", entrypoint: "reward_current_mission" },
      ],
    },
  },
}

// Controller basic configuration
const colorMode: ColorMode = "dark";
const theme = "golem-runner";

const options: ControllerOptions = {
  chains: [
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    },
  ],
  defaultChainId: VITE_PUBLIC_DEPLOY_TYPE === 'mainnet' ?  constants.StarknetChainId.SN_MAIN : constants.StarknetChainId.SN_SEPOLIA,
  policies,
  theme,
  colorMode,
  namespace: "golem_runner", 
  slot: "golem6", 
};

const cartridgeConnector = new ControllerConnector(
  options,
) as never as Connector;

export default cartridgeConnector;
