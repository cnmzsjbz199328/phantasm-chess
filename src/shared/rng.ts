export function rng(a: number, b = 0): number {
  return ((Math.sin(a * 127.1 + b * 311.7) * 43758.5453) % 1 + 1) % 1;
}
