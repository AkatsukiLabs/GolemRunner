import { useCallback, useState } from "react";
import { useAccount, useDisconnect } from "@starknet-react/core";
import { useMusic } from "../../../context/MusicContext";

// Components
import { ShareModal } from "./ShareModal";

// Assets
import menuIcon from "../../../assets/icons/svg/icon-menu.svg";
import closeIcon from "../../../assets/icons/svg/icon-close.svg";
import profileIcon from "../../../assets/icons/svg/icon-profile.svg";
import shareIcon from "../../../assets/icons/svg/icon-share.svg";
import logoutIcon from "../../../assets/icons/svg/icon-logout.svg";
import soundOnIcon from "../../../assets/icons/svg/icon-sound-on.svg";
import soundOffIcon from "../../../assets/icons/svg/icon-sound-off.svg";

interface DropdownMenuProps {
  onNavigateLogin: () => void;
  selectedGolem?: {
    name: string;
    description: string;
    level: number;
  };
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  onNavigateLogin,
  selectedGolem 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { isMuted, toggleMute } = useMusic();

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleProfile = useCallback(() => {
    if (!connector || !('controller' in connector)) {
      console.error("Connector not initialized");
      return;
    }
    if (connector.controller && typeof connector.controller === 'object' && 'openProfile' in connector.controller) {
      (connector.controller as { openProfile: (profile: string) => void }).openProfile("achievements");
    } else {
      console.error("Connector controller is not properly initialized");
    }
  }, [connector]);

  const handleShareClick = useCallback(() => {
    setIsShareModalOpen(true);
    setIsOpen(false); // Close dropdown when opening share modal
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setIsOpen(false);
    // Add a small delay to ensure the wallet modal is closed before navigation
    setTimeout(() => {
      onNavigateLogin();
    }, 100);
  }, [disconnect, onNavigateLogin]);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={toggleMenu}
        className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.2)] z-50"
      >
        <img
          src={isOpen ? closeIcon : menuIcon}
          alt="Menu"
          className="w-6 h-6"
        />
      </button>

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className="absolute top-0 right-0 mt-12 w-48 bg-cream rounded-xl shadow-lg px-4 py-3 space-y-3 animate-in slide-in-from-right-2 z-50">
          <button
            onClick={handleProfile}
            className="flex items-center space-x-3 w-full hover:scale-105 transition-transform"
          >
            <img src={profileIcon} alt="Profile" className="w-5 h-5" />
            <span className="text-dark font-luckiest">Profile</span>
          </button>

          <button
            onClick={handleShareClick}
            className="flex items-center space-x-3 w-full hover:scale-105 transition-transform"
          >
            <img src={shareIcon} alt="Share on X" className="w-5 h-5" />
            <span className="text-dark font-luckiest">Share on X</span>
          </button>

          <button
            onClick={toggleMute}
            className="flex items-center space-x-3 w-full hover:scale-105 transition-transform"
          >
            <img 
              src={isMuted ? soundOffIcon : soundOnIcon} 
              alt={isMuted ? "Unmute" : "Mute"} 
              className="w-5 h-5" 
            />
            <span className="text-dark font-luckiest">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>

          <button
            onClick={handleDisconnect}
            className="flex items-center space-x-3 w-full hover:scale-105 transition-transform"
          >
            <img src={logoutIcon} alt="Logout" className="w-5 h-5" />
            <span className="text-dark font-luckiest">Disconnect</span>
          </button>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        golemData={selectedGolem}
      />
    </div>
  );
};
