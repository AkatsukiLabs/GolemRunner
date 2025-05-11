import { useEffect, useState } from "react"
import { motion } from "framer-motion"
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

export function AvatarCarouselMobile({
  characters,
  selectedCharacter,
  onSelect,
}: AvatarCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  
  useEffect(() => {
    const idx = characters.findIndex((c) => c.id === selectedCharacter.id)
    if (idx !== -1) setActiveIndex(idx)
  }, [selectedCharacter, characters])

  // Calcular posiciones para un carrusel con énfasis en el elemento central
  const getPositions = (index: number, active: number, total: number) => {
    // Determinar la posición relativa al elemento activo
    const relativeIndex = ((index - active) % total + total) % total
    
    // Posiciones para centro y lados
    const positions = {
      // Elemento central (seleccionado) - más grande y destacado
      0: { x: 0, scale: 1.25, opacity: 1, zIndex: 3 },
      // Elementos laterales - más pequeños y semitransparentes
      1: { x: 140, scale: 0.6, opacity: 0.3, zIndex: 2 },
      [total - 1]: { x: -140, scale: 0.6, opacity: 0.3, zIndex: 2 },
    }
    
    // Posiciones para los elementos más alejados (muy poco visibles o invisibles)
    for (let i = 2; i < Math.floor(total / 2) + 1; i++) {
      positions[i] = { x: 200, scale: 0.4, opacity: 0.1, zIndex: 1 }
      positions[total - i] = { x: -200, scale: 0.4, opacity: 0.1, zIndex: 1 }
    }
    
    // Si es un elemento que no está en posiciones especiales, ponerlo fuera de la vista
    const fallback = { x: 0, scale: 0, opacity: 0, zIndex: 0 }
    
    // Devolver la posición correspondiente o la posición por defecto
    return positions[relativeIndex] || fallback
  }

  // Crear springs para todos los elementos
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

  // Actualizar springs cuando cambia el índice activo
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

  // Manejar navegación con gestos
  const bind = useDrag(
    ({ direction: [xDir], distance: [distX], cancel }) => {
      if (Math.abs(distX) > 50) {
        // Determinar si vamos hacia adelante o hacia atrás
        const nextIndex = (activeIndex + (xDir < 0 ? 1 : -1) + characters.length) % characters.length
        setActiveIndex(nextIndex)
        onSelect(characters[nextIndex])
        cancel()
      }
    },
    { axis: "x" }
  )

  // Función para ir al siguiente personaje
  const goToNext = () => {
    const nextIndex = (activeIndex + 1) % characters.length
    setActiveIndex(nextIndex)
    onSelect(characters[nextIndex])
  }

  // Función para ir al personaje anterior
  const goToPrev = () => {
    const prevIndex = (activeIndex - 1 + characters.length) % characters.length
    setActiveIndex(prevIndex)
    onSelect(characters[prevIndex])
  }

  return (
    <div className="relative w-full h-52 overflow-hidden" {...bind()}>
      {/* Fondo con área de interacción */}
      <div className="absolute inset-0 bg-blue-900/20" />
      
      {/* Flechas de navegación */}
      <button 
        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-surface/15 backdrop-blur-sm rounded-full z-20 text-surface"
        onClick={goToPrev}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-surface/15 backdrop-blur-sm rounded-full z-20 text-surface"
        onClick={goToNext}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      {/* Contenedor para los personajes */}
      <div className="relative w-full h-full flex items-center justify-center">
        {springs.map((props, index) => (
          <animated.div
            key={characters[index].id}
            className="absolute top-1/2 left-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-44 cursor-pointer"
            style={{
              x: props.x,
              y: props.y,
              scale: props.scale,
              opacity: props.opacity,
              zIndex: props.zIndex,
              transform: props.scale.to(s => `translate(-50%, -50%) scale(${s})`),
            }}
            onClick={() => {
              if (index !== activeIndex) {
                setActiveIndex(index)
                onSelect(characters[index])
              }
            }}
          >
            {/* Contenedor del personaje */}
            <div className="relative w-full">
              {/* Efecto de brillo para el personaje seleccionado */}
              {index === activeIndex && (
                <motion.div
                  className="absolute -inset-4 rounded-full z-0"
                  animate={{
                    boxShadow: [
                      "0 0 12px rgba(255,87,34,0.2)",
                      "0 0 24px rgba(255,87,34,0.4)",
                      "0 0 12px rgba(255,87,34,0.2)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
              )}

              {/* Imagen del personaje */}
              <img
                src={characters[index].image}
                alt={characters[index].name}
                className="w-full h-auto object-contain z-10 relative"
              />
            </div>

            {/* Plataforma */}
            <div className="relative w-32 h-8 -mt-1">
              {/* Sombra de la plataforma */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/30 blur-md rounded-full -z-10"></div>
              
              {/* Imagen de la plataforma */}
              <img
                src="/stone-platform.png"
                alt="Platform"
                className="w-full h-full object-contain"
              />
            </div>
          </animated.div>
        ))}
      </div>
      
      {/* Indicadores de posición */}
      <div className="absolute bottom-1 w-full flex justify-center gap-1.5 py-1">
        {characters.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeIndex ? "bg-primary w-4" : "bg-surface/30"
            }`}
            onClick={() => {
              setActiveIndex(index)
              onSelect(characters[index])
            }}
          />
        ))}
      </div>
    </div>
  )
}