import React, { useEffect, useMemo, useRef } from "react";
import type { ReconcilerRoot, RootState } from "@react-three/fiber";
import { createRoot, events, extend, unmountComponentAtNode } from "@react-three/fiber";
import type { ViewProps } from "react-native";
import { PixelRatio } from "react-native";
import { Canvas, type CanvasRef, type NativeCanvas } from "react-native-wgpu";
import * as THREE from "three/webgpu";

import { makeWebGPURenderer, ReactNativeCanvas } from "@/lib/make-webgpu-renderer";

interface FiberCanvasProps {
  children: React.ReactNode;
  style?: ViewProps["style"];
  camera?: THREE.PerspectiveCamera;
  scene?: THREE.Scene;
}

/**
 * react-native-wgpu Canvas를 React Three Fiber root로 연결합니다.
 * Three WebGPU renderer 초기화와 RN canvas present 호출을 한곳에서 처리합니다.
 */
export function FiberCanvas({ children, style, scene, camera }: FiberCanvasProps) {
  const root = useRef<ReconcilerRoot<OffscreenCanvas>>(null!);
  const canvasRef = useRef<CanvasRef>(null);

  useMemo(() => extend(THREE as any), []);

  useEffect(() => {
    const context = canvasRef.current?.getContext("webgpu");
    if (!context) return;

    const renderer = makeWebGPURenderer(context);
    const canvas = new ReactNativeCanvas(
      context.canvas as unknown as NativeCanvas,
    ) as unknown as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * PixelRatio.get();
    canvas.height = canvas.clientHeight * PixelRatio.get();

    if (!root.current) {
      root.current = createRoot(canvas as unknown as OffscreenCanvas);
    }

    root.current.configure({
      size: {
        top: 0,
        left: 0,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      },
      events,
      scene,
      camera,
      gl: renderer,
      frameloop: "always",
      dpr: 1,
      onCreated: async (state: RootState) => {
        const webgpuRenderer = state.gl as unknown as THREE.WebGPURenderer;
        await webgpuRenderer.init();

        const renderFrame = webgpuRenderer.render.bind(webgpuRenderer);
        webgpuRenderer.render = async (nextScene: THREE.Scene, nextCamera: THREE.Camera) => {
          await renderFrame(nextScene, nextCamera);
          context.present?.();
        };
      },
    });
    root.current.render(children);

    return () => {
      unmountComponentAtNode(canvas);
    };
  }, [camera, children, scene]);

  return <Canvas ref={canvasRef} style={style} />;
}
