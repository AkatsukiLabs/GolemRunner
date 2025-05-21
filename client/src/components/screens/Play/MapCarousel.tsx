import { useState } from "react"
import Slider from "react-slick"
import { MapCard } from "./MapCard"
import type { Map } from "../../types/map"

interface MapCarouselProps {
  maps: Map[]
  coins: number
  onUnlock: () => void 
  onSelect: (mapId: number) => void
}

export function MapCarousel({ maps, onSelect }: MapCarouselProps) {
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
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "80px",
    arrows: false,
    beforeChange: (_: number, next: number) => setActiveSlide(next),
    customPaging: (i: number) => <CustomDot active={i === activeSlide} />,
    responsive: [
      {
        breakpoint: 640,
        settings: {
          centerPadding: "40px",
        },
      },
    ],
  }

  return (
    <div className="w-full overflow-visible relative h-auto py-6">
      <Slider {...settings}>
        {maps.map((map) => (
          <div
            key={map.id}
            className="px-4 py-2 outline-none flex items-center justify-center"
          >
            <MapCard
              map={map}
              coins={0}
              onUnlock={() => {}}
              onSelect={() => {
                onSelect(map.id);
              }}
            />
          </div>
        ))}
      </Slider>
    </div>
  )
}