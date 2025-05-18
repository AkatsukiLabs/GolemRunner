import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";

// Assets
import menuIcon from "../../../assets/icons/svg/icon-menu.svg";
import closeIcon from "../../../assets/icons/svg/icon-close.svg";
import profileIcon from "../../../assets/icons/svg/icon-profile.svg";
import shareIcon from "../../../assets/icons/svg/icon-share.svg";
import logoutIcon from "../../../assets/icons/svg/icon-logout.svg";

export const GameMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { connector } = useAccount();

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleProfile = useCallback(() => {
    if (!connector || !('controller' in connector)) return;
    if (connector.controller && typeof connector.controller === 'object' && 'openProfile' in connector.controller) {
      (connector.controller as { openProfile: (profile: string) => void }).openProfile("achievements");
    }
  }, [connector]);

  const handleShare = useCallback(() => {
    if (!connector || !('controller' in connector)) return;
    if (connector.controller && typeof connector.controller === 'object' && 'shareOnX' in connector.controller) {
      (connector.controller as { shareOnX: () => void }).shareOnX();
    }
  }, [connector]);

  const handleDisconnect = useCallback(() => {
    if (connector?.disconnect) {
      connector.disconnect();
    }
  }, [connector]);

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
            onClick={handleShare}
            className="flex items-center space-x-3 w-full hover:scale-105 transition-transform"
          >
            <img src={shareIcon} alt="Share on X" className="w-5 h-5" />
            <span className="text-dark font-luckiest">Share on X</span>
          </button>

          <button
            onClick={handleDisconnect}
            className="flex items-center space-x-3 w-full hover:scale-105 transition-transform"
          >
            <img src={logoutIcon} alt="Disconnect" className="w-5 h-5" />
            <span className="text-dark font-luckiest">Disconnect</span>
          </button>
        </div>
      )}
    </div>
  );
};
