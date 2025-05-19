import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useStarknetConnect } from '../../../dojo/hooks/useStarknetConnect';
import { useSpawnPlayer } from '../../../dojo/hooks/useSpawn';
import desktopBg from '../../../assets/login-desktop.png';
import mobileBg from '../../../assets/login-mobile.png';
interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { status, handleConnect } = useStarknetConnect();
  const { txHash, txStatus, initializePlayer } = useSpawnPlayer();

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  const position = isMobile ? 'bottom-center' : 'top-right';

  // Trigger player initialization on wallet connect
  useEffect(() => {
    if (status === 'connected') {
      initializePlayer();
    }
  }, [status, initializePlayer]);

  // Transaction toast and success toast
  useEffect(() => {
    if (txHash) {
      // Always show transaction hash toast
      toast(
        <span className="text-dark">
          Tx {txStatus}: {txHash}{' '}
          <a
            href={`https://starkscan.co/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on StarkScan
          </a>
        </span>,
        { id: 'tx-toast', position }
      );

      // Show success toast when transaction succeeds
      if (txStatus === 'SUCCESS') {
        toast.success('Adventure ready!', { id: 'success-toast', position });
        setTimeout(onLoginSuccess, 1500);
      }

      // Show error toast on failure
      if (txStatus === 'REJECTED') {
        toast.error('Transaction failed', { id: 'tx-toast', position });
      }
    }
  }, [txHash, txStatus, position, onLoginSuccess]);

  // Responsive toast positioning
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${isMobile ? mobileBg : desktopBg})` }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex flex-col items-center"
      >
        <h1 className="text-4xl md:text-5xl font-luckiest text-white mb-8 drop-shadow-lg text-center">
          GOLEM RUNNER
        </h1>
        <button
          onClick={handleConnect}
          disabled={status !== 'disconnected'}
          className="btn-cr-yellow text-xl px-8 py-4 font-bold tracking-wide rounded-[10px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Connect
        </button>
      </motion.div>

      {/* React Hot Toast container with Tailwind styles */}
      <Toaster
        position={position}
        toastOptions={{
          className: 'font-luckiest bg-cream text-dark border border-dark rounded-[5px] shadow-lg p-4',
          success: { duration: 1500 },
        }}
      />
    </div>
  );
};
