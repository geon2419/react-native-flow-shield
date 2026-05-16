import type { NativeCanvas } from "react-native-wgpu";
import * as THREE from "three/webgpu";

/**
 * react-native-wgpu의 NativeCanvas를 Three.js가 기대하는 canvas 형태로 감쌉니다.
 * WebGPU renderer가 width, height, event API에 접근할 수 있게 하는 어댑터입니다.
 */
export class ReactNativeCanvas {
  constructor(private canvas: NativeCanvas) {}

  get width() {
    return this.canvas.width;
  }

  set width(width: number) {
    this.canvas.width = width;
  }

  get height() {
    return this.canvas.height;
  }

  set height(height: number) {
    this.canvas.height = height;
  }

  get clientWidth() {
    return this.canvas.width;
  }

  set clientWidth(width: number) {
    this.canvas.width = width;
  }

  get clientHeight() {
    return this.canvas.height;
  }

  set clientHeight(height: number) {
    this.canvas.height = height;
  }

  addEventListener(_type: string, _listener: EventListener) {
    // Pointer events will be wired separately when interaction is ported.
  }

  removeEventListener(_type: string, _listener: EventListener) {
    // Pointer events will be wired separately when interaction is ported.
  }

  dispatchEvent(_event: Event) {
    // Pointer events will be wired separately when interaction is ported.
  }

  setPointerCapture() {
    // Pointer events will be wired separately when interaction is ported.
  }

  releasePointerCapture() {
    // Pointer events will be wired separately when interaction is ported.
  }
}

/**
 * react-native-wgpu canvas context 위에서 동작하는 Three.js WebGPU renderer를 만듭니다.
 * Three가 geometry, material, render pass를 관리하고 RN canvas에 present합니다.
 */
export function makeWebGPURenderer(
  context: GPUCanvasContext,
  { antialias = true }: { antialias?: boolean } = {},
) {
  return new THREE.WebGPURenderer({
    antialias,
    canvas: new ReactNativeCanvas(
      context.canvas as unknown as NativeCanvas,
    ) as unknown as HTMLCanvasElement,
    context,
  });
}
