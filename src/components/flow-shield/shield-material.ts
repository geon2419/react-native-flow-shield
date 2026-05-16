import * as THREE from "three/webgpu";

import { SHIELD_PARAMS } from "./shield-params";

export interface ShieldMaterialUniforms {
  fresnelPower: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  fresnelStrength: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
}

/**
 * 레퍼런스의 Fresnel rim 수식을 Three WebGPU NodeMaterial로 재구성합니다.
 * 표면 normal과 view direction이 직각에 가까울수록 가장자리가 강하게 빛납니다.
 */
export function createShieldMaterial() {
  const {
    clamp,
    color,
    dot,
    normalView: vView,
    oneMinus,
    positionViewDirection: vViewDir,
    pow,
    uniform,
  } = THREE.TSL;
  
  const uFresnelPower = uniform(SHIELD_PARAMS.fresnelPower).label(
    "fresnelPower",
  );
  const uFresnelStrength = uniform(SHIELD_PARAMS.fresnelStrength).label(
    "fresnelStrength",
  );

  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const viewDot = clamp(dot(vView, vViewDir), 0, 1);
  const fresnel = pow(oneMinus(viewDot), uFresnelPower).mul(uFresnelStrength);

  material.colorNode = color(SHIELD_PARAMS.color).mul(fresnel.mul(2));
  material.opacityNode = clamp(fresnel.mul(SHIELD_PARAMS.opacity), 0, 1);

  return {
    material,
    uniforms: {
      fresnelPower: uFresnelPower,
      fresnelStrength: uFresnelStrength,
    },
  };
}
