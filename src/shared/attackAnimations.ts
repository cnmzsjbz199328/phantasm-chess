import gsap from "gsap";
import * as THREE from "three";

export function playAttackAnimation(
  pieceType: string,
  group: THREE.Group,
  onImpact: () => void,
): void {
  const t = pieceType.toLowerCase();
  const p = group.position;
  const r = group.rotation;

  gsap.killTweensOf([p, r]);

  const tl = gsap.timeline({
    onComplete: () => gsap.set([p, r], { x: 0, y: 0, z: 0 }),
  });

  if (t === "p") {
    // Pawn — wind-up → spear thrust → recoil
    tl.to(r, { x: -0.28, duration: 0.11, ease: "power2.in" })
      .to(r, { x: 0.48, duration: 0.1, ease: "power4.in" })
      .to(p, { z: 0.6, duration: 0.1, ease: "power4.in" }, "<")
      .call(onImpact)
      .to(p, { z: 0, duration: 0.32, ease: "power2.out" })
      .to(r, { x: 0, duration: 0.28, ease: "power2.out" }, "<");

  } else if (t === "n") {
    // Knight — rear up → full charge → stop
    tl.to(r, { x: -0.22, duration: 0.14, ease: "power2.out" })
      .to(p, { z: 1.1, duration: 0.19, ease: "power4.in" })
      .to(r, { x: 0.18, duration: 0.1 }, "<0.08")
      .call(onImpact)
      .to(p, { z: 0, duration: 0.42, ease: "power2.out" })
      .to(r, { x: 0, duration: 0.28 }, "<0.05");

  } else if (t === "b") {
    // Bishop — staff raise → beam release
    tl.to(r, { z: -0.22, duration: 0.2, ease: "power1.in" })
      .to(r, { z: 0.08, duration: 0.09, ease: "power4.in" })
      .call(onImpact)
      .to(r, { z: 0, duration: 0.35, ease: "power2.out" });

  } else if (t === "r") {
    // Rook — hop up → ground slam → vibrate
    tl.to(p, { y: 0.45, duration: 0.2, ease: "power2.out" })
      .to(p, { y: 0, duration: 0.11, ease: "power4.in" })
      .call(onImpact)
      .to(r, { x: 0.18, duration: 0.05 })
      .to(r, { x: 0, duration: 0.3, ease: "elastic.out(1.2, 0.4)" });

  } else if (t === "q") {
    // Queen — charge spin → energy blast
    tl.to(r, { y: 0.32, duration: 0.16, ease: "power1.in" })
      .to(r, { y: -0.12, z: 0.18, duration: 0.11, ease: "power4.in" })
      .call(onImpact)
      .to(r, { y: 0, z: 0, duration: 0.38, ease: "power2.out" });

  } else if (t === "k") {
    // King — scepter raise → wide sweep
    tl.to(r, { z: 0.28, duration: 0.2, ease: "power1.in" })
      .to(r, { z: -0.38, y: 0.22, duration: 0.16, ease: "power3.in" })
      .call(onImpact)
      .to(r, { z: 0, y: 0, duration: 0.38, ease: "power2.out" });
  }
}
