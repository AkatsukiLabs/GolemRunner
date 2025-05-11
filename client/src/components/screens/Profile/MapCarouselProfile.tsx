import { useState } from "react"
import Slider from "react-slick"
import { MapProfileCard } from "./MapProfileCard"
import type { Map } from "../../types/map"

interface MapCarouselProfileProps {
  maps: Map[]
}

export function MapCarouselProfile({ maps }: MapCarouselProfileProps) {
  const [activeSlide, setActiveSlide] = useState(0)

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    centerMode: false,
    beforeChange: (_: number, next: number) => setActiveSlide(next),
    responsive: [
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          centerMode: true,
          centerPadding: "60px",
        },
      },
    ],
  }

  return (
    <div className="w-full overflow-hidden">
      <Slider {...settings}>
        {maps.map((map) => (
          <div key={map.id} className="px-2 outline-none">
            <MapProfileCard map={map} />
          </div>
        ))}
      </Slider>
    </div>
  )
}
