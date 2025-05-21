import React, { useEffect, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type {
  Engine,
  IOptions,
  RecursivePartial,
} from "@tsparticles/engine";
import { MoveDirection } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

function BackgroundParticles(): JSX.Element | null {
  const [engineLoaded, setEngineLoaded] = useState(false);

  // 1) Inicializar el engine solo una vez
  useEffect(() => {
    initParticlesEngine((engine: Engine) => loadSlim(engine))
      .then(() => setEngineLoaded(true));
  }, []);

  // 2) Memoizar opciones para evitar recrearlas
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
          direction: MoveDirection.none,
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

  // 3) Solo renderizar cuando el engine esté listo
  if (!engineLoaded) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Particles
        id="tsparticles"
        className="w-full h-full"
        options={options}
      />
    </div>
  );
}

// 4) React.memo evita re-renderizar el componente
export default React.memo(BackgroundParticles);
