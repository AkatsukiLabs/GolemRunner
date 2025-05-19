import { useConnect, useAccount } from "@starknet-react/core";
import { useState, useCallback } from "react";

export function useStarknetConnect() {
  const { connect, connectors } = useConnect();
  const { status } = useAccount();
  const [hasTriedConnect, setHasTriedConnect] = useState(false);

  const handleConnect = useCallback(async () => {
    const connector = connectors[0];
    if (!connector) return;
    setHasTriedConnect(true);
    await connect({ connector });
  }, [connect, connectors]);

  return { status, handleConnect, hasTriedConnect, setHasTriedConnect };
} 