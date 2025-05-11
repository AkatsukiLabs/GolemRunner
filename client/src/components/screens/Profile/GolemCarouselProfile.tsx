import { useState } from "react"
import Slider from "react-slick"
import { GolemNameCard } from "./GolemNameCard"
import type { Golem } from "../../types/golem"

interface GolemCarouselProfileProps {
  golems: Golem[]
  onGolemClick: (golem: Golem) => void
}

export function GolemCarouselProfile({ golems, onGolemClick }: GolemCarouselProfileProps) {
  const [activeSlide, setActiveSlide] = useState(0)

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: false,
    beforeChange: (_: number, next: number) => setActiveSlide(next),
    responsive: [
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 2,
        },
      },
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
        {golems.map((golem) => (
          <div key={golem.id} className="px-2 outline-none">
            <GolemNameCard golem={golem} onClick={() => onGolemClick(golem)} />
          </div>
        ))}
      </Slider>
    </div>
  )
}
