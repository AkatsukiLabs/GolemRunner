import { useEffect, useState } from "react"
import Slider from "react-slick"
import { motion } from "framer-motion"

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

export function AvatarCarousel({
  characters,
  selectedCharacter,
  onSelect,
}: AvatarCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const idx = characters.findIndex((c) => c.id === selectedCharacter.id)
    if (idx !== -1) setActiveIndex(idx)
  }, [selectedCharacter, characters])

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "0",
    focusOnSelect: true,
    beforeChange: (_: number, next: number) => {
      setActiveIndex(next)
      onSelect(characters[next])
    },
    initialSlide: activeIndex,
  }

  return (
    <div className="relative overflow-hidden w-full">
      <Slider {...settings}>
        {characters.map((character, index) => (
          <div key={character.id} className="px-2 outline-none">
            <div className="relative flex flex-col items-center justify-center">
              <div
                className={`relative transition-all duration-300 ${
                  index === activeIndex
                    ? "scale-100 opacity-100 z-10"
                    : "scale-75 opacity-50 z-0"
                }`}
              >
                {index === activeIndex && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      boxShadow: [
                        "0 0 10px rgba(255,87,34,0.3)",
                        "0 0 20px rgba(255,87,34,0.5)",
                        "0 0 10px rgba(255,87,34,0.3)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                )}

                {/* Avatar */}
                <img
                  src={character.image || "/placeholder.svg"}
                  alt={character.name}
                  width={120}
                  height={120}
                  className="object-contain"
                  onError={(e) => {
                    const img = e.currentTarget
                    img.src = "/placeholder.svg?height=120&width=120"
                  }}
                />
              </div>

              {/* Plataforma */}
              <div className="mt-[-10px] w-24 h-8">
                <img
                  src="/stone-platform.png"
                  alt="Stone platform"
                  width={96}
                  height={32}
                  className="object-contain"
                  onError={(e) => {
                    const img = e.currentTarget
                    img.src = "/placeholder.svg?height=32&width=96"
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  )
}
