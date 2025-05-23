import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TopBar } from "../../layout/TopBar";
import BackgroundParticles from "../../shared/BackgroundParticles";
import { GolemGrid } from "./GolemGrid";
import { MapGrid } from "./MapGrid";
import { PurchaseAnimation } from "./PurchaseAnimation";
import { InsufficientBalanceAnimation } from "./InsufficientBalanceAnimation";
import golemSellerIcon from "../../../assets/icons/GolemSellerV2.webp";
import { useMarketStore } from "../../../dojo/hooks/useMarketStore";
import useAppStore from "../../../zustand/store";
import toast, { Toaster } from "react-hot-toast";
import { getGolemVisualDataById } from "../../../constants/characters";
import { getMapVisualDataById } from "../../../constants/mapVisualData";
import { MarketGolem, MarketMap } from "../../types/marketTypes";

// Helper function to truncate hash
const truncateHash = (hash: string, startLength = 6, endLength = 4) => {
  if (!hash) return '';
  if (hash.length <= startLength + endLength) return hash;
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
};

interface MarketScreenProps {
  // We can leave it empty if no props are needed
}

export function MarketScreen({}: MarketScreenProps) {
  // Get data from zustand store
  const { player, golems, worlds, isLoading } = useAppStore();
  
  // Get market store functionality
  const { 
    isProcessing, 
    txHash,
    txStatus,
    purchaseGolem, 
    purchaseWorld
  } = useMarketStore();
  
  // State for market components
  const [selectedItem, setSelectedItem] = useState<MarketGolem | MarketMap | null>(null);
  const [showPurchaseAnimation, setShowPurchaseAnimation] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  
  // Responsive design
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Toast position based on screen size
  const position = isMobile ? 'bottom-center' : 'top-right';

  useEffect(() => {
    if (txHash) {
      toast(
        <span className="text-dark font-luckiest">
          Tx {txStatus}: {truncateHash(txHash)}
          <br />
          <a
            href={`https://sepolia.starkscan.co/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on StarkScan
          </a>
        </span>,
        { id: 'tx-toast', position }
      );
  
      if (txStatus === 'SUCCESS') {
        toast.success('Purchase successful!', {
          id: 'success-toast',
          position,
          duration: 2000,
        });
      }
  
      if (txStatus === 'REJECTED') {
        toast.error('Transaction failed', {
          id: 'tx-error-toast',
          position,
          duration: 3000,
        });
      }
    }
  }, [txHash, txStatus, position]);

  // Transform blockchain data to UI format
  const golemItems: MarketGolem[] = golems.map(golem => {
    const visualData = getGolemVisualDataById(golem.id);
    return {
      id: golem.id,
      name: visualData.name,
      description: visualData.description,
      image: visualData.image,
      rarity: visualData.rarity,
      price: golem.price,
      owned: golem.is_unlocked
    };
  });
  
  const mapItems: MarketMap[] = worlds.map(world => {
    const visualData = getMapVisualDataById(world.id);
    return {
      id: world.id,
      name: visualData.name,
      description: visualData.description,
      image: visualData.image,
      theme: visualData.theme,
      price: world.price,
      unlocked: world.is_unlocked
    };
  });

  const handlePurchase = async (item: MarketGolem | MarketMap) => {
    // Determine if it's a golem or a map
    const isGolem = 'rarity' in item;
    
    // If already owned/unlocked, do nothing
    if (isGolem && (item as MarketGolem).owned) return;
    if (!isGolem && (item as MarketMap).unlocked) return;
    
    // Check if player has enough coins
    if (!player || player.coins < item.price) {
      setSelectedItem(item);
      setShowInsufficientBalance(true);
      return;
    }
    
    // Process the purchase
    try {
      // Attempt to purchase
      let result;
      if (isGolem) {
        result = await purchaseGolem(item.id);
      } else {
        result = await purchaseWorld(item.id);
      }
      
      // If successful, show animation
      if (result.success) {
        setSelectedItem(item);
        setShowPurchaseAnimation(true);
      } else {
        // If there's a specific error message, show it
        toast.error(result.error || `Failed to purchase ${isGolem ? 'golem' : 'map'}`, { position });
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Transaction failed", { position });
    }
  };

  const handleCloseAnimation = () => {
    setShowPurchaseAnimation(false);
    setShowInsufficientBalance(false);
    setSelectedItem(null);
  };

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
      <BackgroundParticles />
      
      {/* Top Bar */}
      <TopBar 
        coins={player?.coins || 0} 
        level={player?.level || 1} 
        title="MARKET" 
        screen="market" 
      />

      {/* Clash Royale style animated banner */}
      <motion.div
        className="relative mt-12 mb-3"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Animated Golem Seller */}
        <motion.div
          className="absolute -top-11 left-3 z-10 w-40 h-40"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
        >
          <img 
            src={golemSellerIcon}
            alt="Golem Seller"
            className="object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.src = "/placeholder.svg?height=80&width=80"
            }}
          />
        </motion.div>

        {/* Banner */}
        <div className="bg-golem-gradient py-3 px-4 pl-40 relative rounded-[10px] mx-4 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <h2 className="font-luckiest text-cream text-xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide">
              Available Cards
            </h2>
            <p className="font-luckiest text-dark text-sm opacity-90 mt-1 sm:mt-0">
              What do you want to buy today?
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 h-[calc(100%-16rem)] overflow-y-auto pb-16">
        <div className="px-4 py-2">
          {/* Golems Section */}
          <div className="mb-8 mt-8">
            <h3 className="font-luckiest text-cream text-lg mb-4">Golems</h3>
            {isLoading ? (
              <div className="text-center py-6">
                <p className="font-luckiest text-cream">Loading golems...</p>
              </div>
            ) : (
              <GolemGrid 
                golems={golemItems} 
                onPurchase={handlePurchase} 
              />
            )}
          </div>

          {/* Maps Section */}
          <div>
            <h3 className="font-luckiest text-cream text-lg mb-4">Maps</h3>
            {isLoading ? (
              <div className="text-center py-6">
                <p className="font-luckiest text-cream">Loading maps...</p>
              </div>
            ) : (
              <MapGrid 
                maps={mapItems} 
                onPurchase={handlePurchase} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Animations */}
      {selectedItem && (
        <>
          {showPurchaseAnimation && (
            <PurchaseAnimation
              item={selectedItem}
              onClose={handleCloseAnimation}
            />
          )}
          {showInsufficientBalance && (
            <InsufficientBalanceAnimation
              item={selectedItem}
              currentBalance={player?.coins || 0}
              onClose={handleCloseAnimation}
            />
          )}
        </>
      )}

      {/* Loading indicator for transaction */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-surface p-6 rounded-xl shadow-lg">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-luckiest text-primary">Processing Transaction...</p>
            </div>
          </div>
        </div>
      )}

      <Toaster
        position={position}
        toastOptions={{
          className: 'font-luckiest bg-cream text-dark border border-dark rounded-[5px] shadow-lg p-4',
          error: { duration: 3000 },
          success: { duration: 3000 }
        }}
      />
    </div>
  );
}

export default MarketScreen;