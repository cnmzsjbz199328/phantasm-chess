import gsap from "gsap";
import * as THREE from "three";
import type { PieceRig } from "./types";

function rigTargets(rig: PieceRig) {
  return [
    rig.body.position, rig.body.rotation,
    rig.rightArm?.rotation,
    rig.leftArm?.rotation,
    rig.weapon?.rotation, rig.weapon?.position,
  ].filter((x) => x != null) as object[];
}

function resetRig(rig: PieceRig) {
  gsap.set([rig.body.position, rig.body.rotation], { x: 0, y: 0, z: 0 });
  if (rig.rightArm) gsap.set(rig.rightArm.rotation, { x: 0, y: 0, z: 0 });
  if (rig.leftArm)  gsap.set(rig.leftArm.rotation,  { x: 0, y: 0, z: 0 });
  if (rig.weapon)   gsap.set([rig.weapon.rotation, rig.weapon.position], { x: 0, y: 0, z: 0 });
}

export function playAttackAnimation(
  pieceType: string,
  model: THREE.Group,
  rig: PieceRig | null,
  onImpact: () => void,
): void {
  const t = pieceType.toLowerCase();
  const p = model.position;
  const r = model.rotation;

  gsap.killTweensOf([p, r, ...(rig ? rigTargets(rig) : [])]);

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set([p, r], { x: 0, y: 0, z: 0 });
      if (rig) resetRig(rig);
    },
  });

  if (t === "p") {
    if (rig?.rightArm && rig?.weapon) {
      // Pawn — arm wind-up + lance thrust
      tl.to(rig.body.rotation,   { x: -0.2,  duration: 0.1, ease: "power2.in" }, 0)
        .to(rig.rightArm.rotation, { x: -0.5,  duration: 0.1, ease: "power2.in" }, 0)
        .to(rig.weapon.rotation,   { x: -0.5,  duration: 0.1, ease: "power2.in" }, 0)
        .to(rig.body.rotation,   { x:  0.3,  duration: 0.09, ease: "power4.in" }, 0.1)
        .to(rig.rightArm.rotation, { x:  0.72, duration: 0.09, ease: "power4.in" }, 0.1)
        .to(rig.weapon.rotation,   { x:  0.44, duration: 0.09, ease: "power4.in" }, 0.1)
        .to(p, { z: 0.42, duration: 0.09, ease: "power4.in" }, 0.1)
        .call(onImpact)
        .to(p, { z: 0, duration: 0.3, ease: "power2.out" })
        .to(rig.body.rotation,   { x: 0, duration: 0.26, ease: "power2.out" }, "<")
        .to(rig.rightArm.rotation, { x: 0, duration: 0.26, ease: "power2.out" }, "<")
        .to(rig.weapon.rotation,   { x: 0, duration: 0.26, ease: "power2.out" }, "<");
    } else {
      tl.to(r, { x: -0.28, duration: 0.11, ease: "power2.in" })
        .to(r, { x: 0.48, duration: 0.1, ease: "power4.in" })
        .to(p, { z: 0.6, duration: 0.1, ease: "power4.in" }, "<")
        .call(onImpact)
        .to(p, { z: 0, duration: 0.32, ease: "power2.out" })
        .to(r, { x: 0, duration: 0.28, ease: "power2.out" }, "<");
    }

  } else if (t === "n") {
    // Knight — whole-model rear up + charge (no humanoid arm rig)
    tl.to(r, { x: -0.22, duration: 0.14, ease: "power2.out" })
      .to(p, { z: 1.1, duration: 0.19, ease: "power4.in" })
      .to(r, { x: 0.18, duration: 0.1 }, "<0.08")
      .call(onImpact)
      .to(p, { z: 0, duration: 0.42, ease: "power2.out" })
      .to(r, { x: 0, duration: 0.28 }, "<0.05");

  } else if (t === "b") {
    if (rig?.rightArm && rig?.weapon) {
      // Bishop — staff raise + lean → beam release
      tl.to(rig.body.rotation,   { z: -0.15, duration: 0.18, ease: "power1.in" }, 0)
        .to(rig.rightArm.rotation, { z: -0.38, duration: 0.18, ease: "power2.in" }, 0)
        .to(rig.weapon.rotation,   { z: -0.38, duration: 0.18, ease: "power2.in" }, 0)
        .to(rig.body.rotation,   { z:  0.06, duration: 0.09, ease: "power4.in" }, 0.18)
        .to(rig.rightArm.rotation, { z:  0.12, duration: 0.09, ease: "power4.in" }, 0.18)
        .to(rig.weapon.rotation,   { z:  0.12, duration: 0.09, ease: "power4.in" }, 0.18)
        .call(onImpact)
        .to(rig.body.rotation,   { z: 0, duration: 0.34, ease: "power2.out" })
        .to(rig.rightArm.rotation, { z: 0, duration: 0.34, ease: "power2.out" }, "<")
        .to(rig.weapon.rotation,   { z: 0, duration: 0.34, ease: "power2.out" }, "<");
    } else {
      tl.to(r, { z: -0.22, duration: 0.2, ease: "power1.in" })
        .to(r, { z: 0.08, duration: 0.09, ease: "power4.in" })
        .call(onImpact)
        .to(r, { z: 0, duration: 0.35, ease: "power2.out" });
    }

  } else if (t === "r") {
    // Rook — whole-model hop + ground slam (no arm rig)
    tl.to(p, { y: 0.45, duration: 0.2, ease: "power2.out" })
      .to(p, { y: 0, duration: 0.11, ease: "power4.in" })
      .call(onImpact)
      .to(r, { x: 0.18, duration: 0.05 })
      .to(r, { x: 0, duration: 0.3, ease: "elastic.out(1.2, 0.4)" });

  } else if (t === "q") {
    if (rig?.rightArm && rig?.leftArm) {
      // Queen — both arms rise → charge spin → energy blast
      tl.to(rig.leftArm.rotation,  { x: -0.52, duration: 0.15, ease: "power2.in" }, 0)
        .to(rig.rightArm.rotation, { x: -0.52, duration: 0.15, ease: "power2.in" }, 0)
        .to(r, { y: 0.26, duration: 0.15, ease: "power1.in" }, 0)
        .to(rig.leftArm.rotation,  { x: 0.22, duration: 0.1, ease: "power4.in" }, 0.15)
        .to(rig.rightArm.rotation, { x: 0.22, duration: 0.1, ease: "power4.in" }, 0.15)
        .to(r, { y: -0.1, z: 0.16, duration: 0.1, ease: "power4.in" }, 0.15)
        .call(onImpact)
        .to(rig.leftArm.rotation,  { x: 0, duration: 0.38, ease: "power2.out" })
        .to(rig.rightArm.rotation, { x: 0, duration: 0.38, ease: "power2.out" }, "<")
        .to(r, { y: 0, z: 0, duration: 0.38, ease: "power2.out" }, "<");
    } else {
      tl.to(r, { y: 0.32, duration: 0.16, ease: "power1.in" })
        .to(r, { y: -0.12, z: 0.18, duration: 0.11, ease: "power4.in" })
        .call(onImpact)
        .to(r, { y: 0, z: 0, duration: 0.38, ease: "power2.out" });
    }

  } else if (t === "k") {
    if (rig?.rightArm && rig?.weapon) {
      // King — scepter raise → wide sweep
      tl.to(rig.body.rotation,   { z:  0.14, duration: 0.2, ease: "power1.in" }, 0)
        .to(rig.rightArm.rotation, { z:  0.42, duration: 0.2, ease: "power1.in" }, 0)
        .to(rig.weapon.rotation,   { z:  0.42, duration: 0.2, ease: "power1.in" }, 0)
        .to(rig.body.rotation,   { z: -0.2,  y: 0.18, duration: 0.16, ease: "power3.in" }, 0.2)
        .to(rig.rightArm.rotation, { z: -0.56, y: 0.24, duration: 0.16, ease: "power3.in" }, 0.2)
        .to(rig.weapon.rotation,   { z: -0.56, y: 0.24, duration: 0.16, ease: "power3.in" }, 0.2)
        .call(onImpact)
        .to(rig.body.rotation,   { z: 0, y: 0, duration: 0.38, ease: "power2.out" })
        .to(rig.rightArm.rotation, { z: 0, y: 0, duration: 0.38, ease: "power2.out" }, "<")
        .to(rig.weapon.rotation,   { z: 0, y: 0, duration: 0.38, ease: "power2.out" }, "<");
    } else {
      tl.to(r, { z: 0.28, duration: 0.2, ease: "power1.in" })
        .to(r, { z: -0.38, y: 0.22, duration: 0.16, ease: "power3.in" })
        .call(onImpact)
        .to(r, { z: 0, y: 0, duration: 0.38, ease: "power2.out" });
    }
  }
}
