import { useState } from "react"
import Slider from "react-slick"
import { MapCard } from "./MapCard"
import type { Map } from "../../types/map"

interface MapCarouselProps {
  maps: Map[]
  coins: number
  onUnlock: (mapId: number, price: number) => void
  onPlay: (mapId: number) => void
}

export function MapCarousel({ maps, coins, onUnlock, onPlay }: MapCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0)

  // Custom dot component for the carousel
  const CustomDot = ({ onClick, active }: { onClick?: () => void; active: boolean }) => {
    return (
      <button
        className={`w-3 h-3 mx-1 rounded-full transition-colors ${
          active ? "bg-primary" : "bg-surface border border-primary/30"
        }`}
        onClick={onClick}
        aria-label={active ? "Current slide" : "Go to slide"}
      />
    )
  }

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "40px",
    beforeChange: (_: number, next: number) => setActiveSlide(next),
    customPaging: (i: number) => <CustomDot active={i === activeSlide} />,
    responsive: [
      {
        breakpoint: 640,
        settings: {
          centerPadding: "20px",
        },
      },
    ],
  }

  return (
    <div className="w-full overflow-hidden relative">
      <Slider {...settings}>
        {maps.map((map) => (
          <div key={map.id} className="px-2 outline-none">
            <MapCard
              map={map}
              coins={coins}
              onUnlock={() => map.price !== undefined && onUnlock(map.id, map.price)}
              onPlay={() => onPlay(map.id)}
            />
          </div>
        ))}
      </Slider>
    </div>
  )
}
