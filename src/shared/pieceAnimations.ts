import * as THREE from "three";
import gsap from "gsap";
import type { Vec3 } from "./types";

function faceTarget(group: THREE.Group, target: Vec3) {
  const dx = target[0] - group.position.x;
  const dz = target[2] - group.position.z;
  if (Math.abs(dx) + Math.abs(dz) > 0.001) {
    group.rotation.y = Math.atan2(dx, dz);
  }
}

function getTravelProfile(pieceType: string, isCaptureApproach = false) {
  const t = pieceType.toLowerCase();
  const durationScale = isCaptureApproach ? 0.78 : 1;

  if (t === "n") return { duration: 0.90 * durationScale, lift: 0.28, sway: 0.06, ease: "power2.inOut" };
  if (t === "r") return { duration: 0.92 * durationScale, lift: 0.04, sway: 0.03, ease: "power3.out" };
  if (t === "b") return { duration: 0.84 * durationScale, lift: 0.18, sway: 0.05, ease: "sine.inOut" };
  if (t === "q") return { duration: 0.88 * durationScale, lift: 0.22, sway: 0.06, ease: "power2.inOut" };
  if (t === "k") return { duration: 0.96 * durationScale, lift: 0.1, sway: 0.025, ease: "power2.out" };
  return { duration: 0.68 * durationScale, lift: 0.1, sway: 0.04, ease: "power2.out" };
}

export function playTravelAnimation(
  pieceType: string,
  group: THREE.Group,
  model: THREE.Group,
  to: Vec3,
  onComplete: () => void,
  isCaptureApproach = false,
  durationMultiplier = 1.0,
) {
  const profile = getTravelProfile(pieceType, isCaptureApproach);
  const dur = profile.duration * durationMultiplier;
  const t = pieceType.toLowerCase();

  faceTarget(group, to);

  const tl = gsap.timeline({ onComplete });
  tl.to(group.position, {
    x: to[0],
    y: to[1],
    z: to[2],
    duration: dur,
    ease: profile.ease,
  }, 0);

  if (t === "n") {
    tl.to(model.position, {
      y: profile.lift,
      duration: dur * 0.25,
      ease: "power2.out",
      yoyo: true,
      repeat: 3,
    }, 0);
    tl.to(model.rotation, {
      x: -0.22,
      duration: dur * 0.25,
      yoyo: true,
      repeat: 3,
      ease: "sine.inOut",
    }, 0);
  } else if (t === "r") {
    tl.to(model.position, {
      y: profile.lift,
      duration: dur * 0.25,
      yoyo: true,
      repeat: 3,
      ease: "steps(1)",
    }, 0);
    tl.to(model.rotation, {
      x: 0.08,
      duration: dur * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut",
    }, 0);
  } else if (t === "b" || t === "q") {
    tl.to(model.position, {
      y: profile.lift,
      duration: dur * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
    tl.to(model.rotation, {
      z: t === "q" ? 0.14 : 0.08,
      duration: dur * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
  } else if (t === "k") {
    tl.to(model.position, {
      y: profile.lift,
      duration: dur * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
    tl.to(model.rotation, {
      z: 0.05,
      duration: dur * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut",
    }, 0);
  } else {
    tl.to(model.position, {
      y: profile.lift,
      duration: dur * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
    tl.to(model.rotation, {
      x: 0.1,
      duration: dur * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    }, 0);
  }

  tl.to(model.rotation, {
    y: profile.sway,
    duration: dur * 0.25,
    yoyo: true,
    repeat: 3,
    ease: "sine.inOut",
  }, 0);
}

export function playGetUpAnimation(
  pieceType: string,
  model: THREE.Group,
  onComplete: () => void,
) {
  const t = pieceType.toLowerCase();
  const isHeavy = t === "k" || t === "r";
  const delay = isHeavy ? 0.28 : 0.18;
  const riseDuration = isHeavy ? 0.42 : 0.32;
  const wobbleDuration = 0.22;

  gsap.killTweensOf([model.position, model.rotation, model.scale]);

  gsap.timeline({ onComplete })
    .to(model.position, {
      x: 0, y: 0, z: 0,
      duration: riseDuration,
      delay,
      ease: "power2.out",
    }, 0)
    .to(model.rotation, {
      x: 0, y: 0, z: 0,
      duration: riseDuration,
      delay,
      ease: "power2.out",
    }, 0)
    .to(model.scale, {
      x: 1, y: 1, z: 1,
      duration: riseDuration,
      delay,
      ease: "back.out(1.4)",
    }, 0)
    .to(model.rotation, {
      z: t === "k" ? 0.06 : 0.1,
      duration: wobbleDuration * 0.5,
      yoyo: true,
      repeat: 3,
      ease: "sine.inOut",
    }, delay + riseDuration);
}

export function playPromotionPulse(
  model: THREE.Group,
  position: Vec3,
  promoteTo: string | undefined,
  onPromote: (position: Vec3, promoteTo: string) => void,
  onComplete: () => void,
) {
  if (!promoteTo) {
    onComplete();
    return;
  }

  gsap.timeline({ onComplete })
    .call(() => onPromote(position, promoteTo))
    .to(model.position, { y: 0.18, duration: 0.14, ease: "power2.out" }, 0)
    .to(model.scale, { x: 1.16, y: 1.16, z: 1.16, duration: 0.14, ease: "power2.out" }, 0)
    .to(model.position, { y: 0, duration: 0.18, ease: "power2.in" }, 0.14)
    .to(model.scale, { x: 1, y: 1, z: 1, duration: 0.18, ease: "power2.in" }, 0.14);
}

function getHitVector(piecePosition: Vec3, hitFrom: Vec3) {
  const direction = new THREE.Vector3(
    piecePosition[0] - hitFrom[0],
    0,
    piecePosition[2] - hitFrom[2],
  );
  if (direction.lengthSq() < 0.001) {
    direction.set(0, 0, 1);
  }
  return direction.normalize();
}

export function playDeathAnimation(
  pieceType: string,
  piecePosition: Vec3,
  hitFrom: Vec3,
  model: THREE.Group,
  setDissolve: (value: number) => void,
  onComplete: () => void,
  skipDissolve = false,
) {
  const t = pieceType.toLowerCase();
  const hit = getHitVector(piecePosition, hitFrom);
  const proxy = { val: 0 };
  const tl = gsap.timeline({ onComplete });

  tl.to(model.position, {
    x: hit.x * 0.38,
    z: hit.z * 0.38,
    duration: 0.08,
    ease: "power3.out",
  }, 0);

  if (t === "n") {
    tl.to(model.position, {
      x: hit.x * 1.1,
      y: 0.58,
      z: hit.z * 1.1,
      duration: 0.2,
      ease: "power2.out",
    }, 0.06)
      .to(model.position, { y: -0.45, duration: 0.28, ease: "power3.in" }, 0.26)
      .to(model.rotation, { x: -1.3, z: hit.x * 1.1, duration: 0.46, ease: "power2.inOut" }, 0.08)
      .to(model.scale, { x: 0.72, y: 0.62, z: 0.72, duration: 0.3, ease: "power2.in" }, 0.28);
  } else if (t === "r") {
    tl.to(model.position, {
      x: hit.x * 0.55,
      y: -0.32,
      z: hit.z * 0.55,
      duration: 0.34,
      ease: "power3.in",
    }, 0.1)
      .to(model.rotation, { x: 0.45, z: -hit.x * 0.42, duration: 0.18, yoyo: true, repeat: 1 }, 0.06)
      .to(model.scale, { x: 1.08, y: 0.48, z: 1.08, duration: 0.34, ease: "power3.in" }, 0.16);
  } else if (t === "b" || t === "q") {
    tl.to(model.position, {
      y: t === "q" ? 0.42 : 0.28,
      duration: 0.2,
      ease: "sine.out",
    }, 0.08)
      .to(model.rotation, {
        y: t === "q" ? Math.PI * 0.8 : Math.PI * 0.45,
        z: hit.x * 0.32,
        duration: 0.48,
        ease: "power2.inOut",
      }, 0.04)
      .to(model.scale, {
        x: t === "q" ? 0.58 : 0.7,
        y: t === "q" ? 1.28 : 1.1,
        z: t === "q" ? 0.58 : 0.7,
        duration: 0.34,
        ease: "power2.in",
      }, 0.22);
  } else if (t === "k") {
    tl.to(model.position, {
      x: hit.x * 0.28,
      y: 0.30,
      z: hit.z * 0.28,
      duration: 0.18,
      ease: "power2.out",
    }, 0.08)
      .to(model.rotation, { z: -hit.x * 0.38, duration: 0.22, ease: "power2.inOut" }, 0.1)
      .to(model.position, { y: -0.35, duration: 0.38, ease: "power2.in" }, 0.3)
      .to(model.scale, { x: 0.78, y: 0.78, z: 0.78, duration: 0.34, ease: "power2.in" }, 0.32);
  } else {
    tl.to(model.position, {
      x: hit.x * 0.82,
      y: -0.38,
      z: hit.z * 0.82,
      duration: 0.34,
      ease: "power2.in",
    }, 0.08)
      .to(model.rotation, { x: 0.7, z: -hit.x * 0.72, duration: 0.32, ease: "power2.inOut" }, 0.06)
      .to(model.scale, { x: 0.58, y: 0.54, z: 0.58, duration: 0.3, ease: "power2.in" }, 0.16);
  }

  if (!skipDissolve) {
    tl.to(proxy, {
      val: 1,
      duration: t === "k" ? 0.62 : 0.44,
      ease: "power2.in",
      onUpdate: () => setDissolve(proxy.val),
    }, t === "k" ? 0.16 : 0.08);
  }
}
