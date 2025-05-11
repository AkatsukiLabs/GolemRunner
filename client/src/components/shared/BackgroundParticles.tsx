import { useEffect, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type {
  Engine,
  Container,
  IOptions,
  RecursivePartial,
} from "@tsparticles/engine";
import { MoveDirection } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

export function BackgroundParticles(): JSX.Element | null {
  const [engineLoaded, setEngineLoaded] = useState(false);

  // 1) Initialize particles engine
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => setEngineLoaded(true));
  }, []);

  // 2) Memoize options to avoid re-creating them on every render
  const options = useMemo<RecursivePartial<IOptions>>(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      particles: {
        color: { value: "#FF5722" },
        links: {
          enable: false,
          distance: 150,
          color: "#FF5722",
          opacity: 0.2,
          width: 1,
        },
        move: {
          enable: true,
          direction: MoveDirection.none, // using an enum for better type safety
          random: true,
          speed: 0.5,
          straight: false,
          outModes: { default: "out" },
        },
        number: { value: 30, density: { enable: true, area: 800 } },
        opacity: {
          value: 0.3,
          animation: {
            enable: true,
            speed: 0.5,
            minimumValue: 0.1,
            sync: false,
          },
        },
        shape: { type: "circle" },
        size: {
          value: { min: 1, max: 3 },
          animation: {
            enable: true,
            speed: 1,
            minimumValue: 0.5,
            sync: false,
          },
        },
        twinkle: {
          particles: { enable: true, frequency: 0.05, opacity: 1 },
        },
      },
      detectRetina: true,
    }),
    []
  );

  // 3) Callback async to handle when particles are loaded
  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log("Particles loaded:", container);
  };

  // 4) Wait for engine to load before rendering
  if (!engineLoaded) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Particles
        id="tsparticles"
        className="w-full h-full"
        options={options}
        particlesLoaded={particlesLoaded}
      />
    </div>
  );
}

export default BackgroundParticles;
