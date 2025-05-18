import { motion } from 'framer-motion'
import { useConnect, useAccount } from "@starknet-react/core";
import GolemHelloImg from '../../../assets/icons/GolemHello.png'

interface ConnectControllerProps {
  onConnect: () => void
}

export function ConnectController({ onConnect }: ConnectControllerProps) {
  const { connect, connectors } = useConnect();
  const { status } = useAccount();

  const handleConnect = async () => {
    // asume que quieres usar siempre el primer connector disponible
    const connector = connectors[0];
    if (!connector) return;

    await connect({ connector });
    // si la conexión fue exitosa, status cambiará a "connected"
    if (status === "connected") {
      onConnect();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-30 backdrop-blur-sm z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-cream rounded-2xl p-6 flex flex-col items-center"
      >
        <img
          src={GolemHelloImg}
          alt="Golem says hello"
          className="w-48 h-48 mb-4"
        />
        <button
          onClick={handleConnect}
          className="btn-cr-yellow text-xl px-6 py-4 font-bold tracking-wide rounded-[10px]"
        >
          CONNECT
        </button>
      </motion.div>
    </div>
  )
}
