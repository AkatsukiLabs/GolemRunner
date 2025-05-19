import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useStarknetConnect } from '../../../hooks/useStarknetConnect';
import desktopBg from '../../../assets/login-desktop.png';
import mobileBg from '../../../assets/login-mobile.png';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { status, handleConnect, hasTriedConnect } = useStarknetConnect();
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  useEffect(() => {
    if (status === "connected" && hasTriedConnect) {
      //Add spawm call here
      onLoginSuccess();
    }
  }, [status, hasTriedConnect, onLoginSuccess]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${isMobile ? mobileBg : desktopBg})`,
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex flex-col items-center"
      >
        <h1 className="text-4xl md:text-5xl font-luckiest text-white mb-8 drop-shadow-lg text-center">GOLEM RUNNER</h1>
        <button
          onClick={handleConnect}
          className="btn-cr-yellow text-xl px-8 py-4 font-bold tracking-wide rounded-[10px] shadow-lg"
        >
          Connect
        </button>
      </motion.div>
    </div>
  );
}; 