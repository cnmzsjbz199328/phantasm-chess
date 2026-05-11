/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

export const DissolveMaterial = shaderMaterial(
  {
    uTime: 0,
    uDissolve: 0, // 0 to 1
    uColor: new THREE.Color("#00f2ff"),
    uBaseColor: new THREE.Color("#ffffff"),
    uNoiseScale: 15.0,
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform float uDissolve;
  uniform vec3 uColor;
  uniform vec3 uBaseColor;
  uniform float uNoiseScale;

  // Simple pseudo-random function
  float rand(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  // 3D noise
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(rand(i + vec3(0,0,0)), rand(i + vec3(1,0,0)), f.x),
                   mix(rand(i + vec3(0,1,0)), rand(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(rand(i + vec3(0,0,1)), rand(i + vec3(1,0,1)), f.x),
                   mix(rand(i + vec3(0,1,1)), rand(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  void main() {
    float n = noise(vPosition * uNoiseScale + uTime * 0.1);
    
    // Calculate alpha based on dissolve and noise
    float t = uDissolve * 1.2; // Slightly overflow to ensure full clear
    float edgeWidth = 0.05;
    
    if (n < t - edgeWidth) {
      discard;
    }
    
    vec3 finalColor = uBaseColor;
    float edge = smoothstep(t - edgeWidth, t, n);
    
    // Glow edge effect
    if (n < t) {
      finalColor = mix(uColor * 2.0, uBaseColor, edge);
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
  `
);

extend({ DissolveMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      dissolveMaterial: any;
    }
  }
}
