import { useEffect, useState } from "react"
import { useSprings, animated } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"

interface Character {
  id: number
  name: string
  rarity: string
  description: string
  image: string
}

interface AvatarCarouselProps {
  characters: Character[]
  selectedCharacter: Character
  onSelect: (character: Character) => void
}

export function AvatarCarouselFixed({
  characters,
  selectedCharacter,
  onSelect,
}: AvatarCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  
  useEffect(() => {
    const idx = characters.findIndex((c) => c.id === selectedCharacter.id)
    if (idx !== -1) setActiveIndex(idx)
  }, [selectedCharacter, characters])

  // Calculate positions for a carousel with emphasis on the central element
  const getPositions = (index: number, active: number, total: number) => {
    // Determine the position relative to the active element
    const relativeIndex = ((index - active) % total + total) % total
    
    // Positions for center and sides - adjusted values for better alignment
    const positions = {
      // Central (selected) element - larger and highlighted
      0: { x: 0, scale: 1.3, opacity: 1, zIndex: 3 },
      // Side elements - smaller, symmetrical, and semi-transparent
      1: { x: 110, scale: 1, opacity: 0.3, zIndex: 2 },
      [total - 1]: { x: -140, scale: 1, opacity: 0.3, zIndex: 2 },
    }
    
    // Positions for farther elements (barely visible or invisible)
    for (let i = 2; i < Math.floor(total / 2) + 1; i++) {
      positions[i] = { x: 180, scale: 0.3, opacity: 0.1, zIndex: 1 }
      positions[total - i] = { x: -180, scale: 0.3, opacity: 0.1, zIndex: 1 }
    }
    
    // If it's an element not in special positions, place it out of view
    const fallback = { x: 0, scale: 0, opacity: 0, zIndex: 0 }
    
    // Return the corresponding position or the default position
    return positions[relativeIndex] || fallback
  }

  // Create springs for all elements
  const [springs, api] = useSprings(characters.length, (index) => {
    const { x, scale, opacity, zIndex } = getPositions(index, activeIndex, characters.length)
    return {
      x,
      y: 0,
      scale,
      opacity,
      zIndex,
      config: { tension: 280, friction: 60 },
    }
  })

  // Update springs when the active index changes
  useEffect(() => {
    api.start((index) => {
      const { x, scale, opacity, zIndex } = getPositions(index, activeIndex, characters.length)
      return {
        x,
        scale,
        opacity, 
        zIndex,
        config: { tension: 280, friction: 60 },
      }
    })
  }, [activeIndex, characters.length, api])

  // Handle navigation with gestures
  const bind = useDrag(
    ({ direction: [xDir], distance: [distX], cancel }) => {
      if (Math.abs(distX) > 50) {
        // Determine whether to move forward or backward
        const nextIndex = (activeIndex + (xDir < 0 ? 1 : -1) + characters.length) % characters.length
        setActiveIndex(nextIndex)
        onSelect(characters[nextIndex])
        cancel()
      }
    },
    { axis: "x", filterTaps: true }
  )

  return (
    <div
      {...bind()}
      style={{ touchAction: 'pan-y' }}
      className="relative w-full h-48 md:h-64 overflow-visible flex items-center justify-center">

      {/* Container for the characters */}
      <div className="relative w-full h-full flex items-center justify-center">
        {springs.map((props, index) => (
          <animated.div
            key={characters[index].id}
            className="absolute top-1/2 left-1/2 flex flex-col items-center justify-center cursor-pointer"
            style={{
              x: props.x,
              y: props.y,
              scale: props.scale,
              opacity: props.opacity,
              zIndex: props.zIndex,
              transform: props.scale.to((s) => `translate(-50%, -50%) scale(${s})`),
            }}
            onClick={() => {
              if (index !== activeIndex) {
                setActiveIndex(index)
                onSelect(characters[index])
              }
            }}
          >
            {/* Character container */}
            <div className="relative">
              {/* Theatrical spotlight from below */}
              {index === activeIndex && (
                <div
                  className="
                    absolute bottom-0 left-1/2 
                    -translate-x-1/3
                    w-32 h-40 
                    bg-gradient-to-t from-white/40 to-transparent 
                    rounded-t-full 
                    filter blur-lg 
                    pointer-events-none 
                    animate-pulse"
                />
              )}

              {/* Character image */}
              <img
                src={characters[index].image}
                alt={characters[index].name}
                className={`
                  w-48 h-48 object-contain z-10 relative transform translate-x-4
                  ${index === activeIndex ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}
                `}
                style={{
                  filter: index !== activeIndex ? 'grayscale(30%)' : 'none',
                  maxWidth: 'none',
                  ...(index === activeIndex && {
                    animation: 'pulse 2s ease-in-out infinite',
                  })
                }}
              />

              {/* Glow effect for selected character */}
              {index === activeIndex && (
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
              )}
            </div>
          </animated.div>
        ))}
      </div>
    </div>
  )
}
