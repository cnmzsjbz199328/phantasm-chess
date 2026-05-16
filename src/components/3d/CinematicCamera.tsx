import { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface Props {
  isPlaying: boolean;
}

export function CinematicCamera({ isPlaying }: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const rotateStep = 0.15;
      const angleStep  = 0.08;
      switch (e.key) {
        case "ArrowLeft":
          controls.setAzimuthalAngle(controls.getAzimuthalAngle() + rotateStep);
          break;
        case "ArrowRight":
          controls.setAzimuthalAngle(controls.getAzimuthalAngle() - rotateStep);
          break;
        case "ArrowUp":
          controls.setPolarAngle(Math.max(controls.minPolarAngle, controls.getPolarAngle() - angleStep));
          break;
        case "ArrowDown":
          controls.setPolarAngle(Math.min(controls.maxPolarAngle, controls.getPolarAngle() + angleStep));
          break;
        default:
          return;
      }
      controls.update();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.1}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={5}
      maxDistance={15}
      autoRotate={!isPlaying}
      autoRotateSpeed={0.5}
    />
  );
}
