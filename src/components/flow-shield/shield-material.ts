import * as THREE from "three/webgpu";

import { SHIELD_PARAMS } from "./shield-params";

export interface ShieldMaterialUniforms {
  time: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  fresnelPower: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  fresnelStrength: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  hexScale: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  hexOpacity: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  hexEdgeWidth: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  hexFlashSpeed: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  hexFlashIntensity: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
}

/**
 * 표면 normal과 view direction의 각도 차이로 Fresnel rim 밝기를 계산합니다.
 * 카메라 시선과 표면이 비스듬할수록 실드 가장자리가 강하게 빛납니다.
 */
function createFresnelRim(
  normalView: THREE.TSL.ShaderNodeObject<THREE.Node>,
  viewDirection: THREE.TSL.ShaderNodeObject<THREE.Node>,
  power: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
  strength: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
) {
  const { clamp, dot, oneMinus, pow } = THREE.TSL;

  const viewDot = clamp(dot(normalView, viewDirection), 0, 1);

  return pow(oneMinus(viewDot), power).mul(strength);
}

/**
 * 헥스 패턴을 만들기 위해 구체 표면 좌표를 2D 평면으로 투영합니다.
 * 축 투영이 바뀌는 경계에서는 그리드를 부드럽게 페이드합니다.
 */
function createHexProjection(
  positionLocal: THREE.TSL.ShaderNodeObject<THREE.Node>,
) {
  const HEX_SEAM_FADE_START = 0.65;
  const HEX_SEAM_FADE_END = 0.85;
  const { abs, max, normalize, select, smoothstep } = THREE.TSL;

  const absPosition = abs(normalize(positionLocal));
  const dominance = max(absPosition.x, max(absPosition.y, absPosition.z));
  const fade = smoothstep(HEX_SEAM_FADE_START, HEX_SEAM_FADE_END, dominance);
  const useXProjection = absPosition.x
    .greaterThanEqual(absPosition.y)
    .and(absPosition.x.greaterThanEqual(absPosition.z));
  const useYProjection = absPosition.y.greaterThanEqual(absPosition.z);
  const faceUv = select(
    useXProjection,
    positionLocal.yz,
    select(useYProjection, positionLocal.xz, positionLocal.xy),
  );

  return { faceUv, fade };
}

/**
 * 구체 표면 좌표를 평면에 투영해 레퍼런스의 procedural hex grid를 만듭니다.
 * 텍스처 없이 셰이더 수식만으로 육각형 셀의 외곽선을 계산합니다.
 */
function createHexPattern(
  faceUv: THREE.TSL.ShaderNodeObject<THREE.Node>,
  hexScale: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
  edgeWidth: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
) {
  // createHexCellId와 같은 헥스 격자 기준을 사용해야 합니다.
  const SQRT_3 = 1.7320508;
  const HALF_CELL_OFFSET = 0.5;
  const HEX_GRID_OFFSET_Y = 1;
  const { abs, dot, floor, max, select, smoothstep, sub, vec2, vec4 } =
    THREE.TSL;

  const scaledUv = faceUv.mul(hexScale);
  const hexCellSize = vec2(1, SQRT_3);

  // 육각 타일은 두 개의 엇갈린 격자 후보 중 더 가까운 셀을 골라 만듭니다.
  const staggeredUv = scaledUv.sub(
    vec2(HALF_CELL_OFFSET, HEX_GRID_OFFSET_Y),
  );
  const candidateCenters = floor(
    vec4(scaledUv, staggeredUv).div(hexCellSize.xyxy),
  ).add(HALF_CELL_OFFSET);
  const primaryOffset = scaledUv.sub(candidateCenters.xy.mul(hexCellSize));
  const staggeredOffset = scaledUv.sub(
    candidateCenters.zw.add(HALF_CELL_OFFSET).mul(hexCellSize),
  );

  // 현재 픽셀에서 더 가까운 후보 셀의 로컬 좌표를 사용합니다.
  const usePrimaryCell = dot(primaryOffset, primaryOffset).lessThan(
    dot(staggeredOffset, staggeredOffset),
  );
  const nearestCellOffset = abs(
    select(usePrimaryCell, primaryOffset, staggeredOffset),
  );
  const distanceToHexEdge = max(
    dot(nearestCellOffset, hexCellSize.mul(HALF_CELL_OFFSET)),
    nearestCellOffset.x,
  );

  return smoothstep(
    sub(HALF_CELL_OFFSET, edgeWidth),
    HALF_CELL_OFFSET,
    distanceToHexEdge,
  );
}

/**
 * 헥스 그리드의 각 셀을 식별할 수 있는 2D 셀 좌표를 계산합니다.
 * 레퍼런스처럼 셀별 랜덤 flash 위상을 만들 때 사용합니다.
 */
function createHexCellId(
  faceUv: THREE.TSL.ShaderNodeObject<THREE.Node>,
  hexScale: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
) {
  // createHexPattern과 같은 헥스 격자 기준을 사용해야 합니다.
  const SQRT_3 = 1.7320508;
  const HALF_CELL_OFFSET = 0.5;
  const HEX_GRID_OFFSET_Y = 1;
  const { dot, floor, select, vec2, vec4 } = THREE.TSL;

  const scaledUv = faceUv.mul(hexScale);
  const hexCellSize = vec2(1, SQRT_3);
  const staggeredUv = scaledUv.sub(
    vec2(HALF_CELL_OFFSET, HEX_GRID_OFFSET_Y),
  );
  const candidateCenters = floor(
    vec4(scaledUv, staggeredUv).div(hexCellSize.xyxy),
  ).add(HALF_CELL_OFFSET);
  const primaryOffset = scaledUv.sub(candidateCenters.xy.mul(hexCellSize));
  const staggeredOffset = scaledUv.sub(
    candidateCenters.zw.add(HALF_CELL_OFFSET).mul(hexCellSize),
  );
  const usePrimaryCell = dot(primaryOffset, primaryOffset).lessThan(
    dot(staggeredOffset, staggeredOffset),
  );

  return select(
    usePrimaryCell,
    candidateCenters.xy,
    candidateCenters.zw.add(HALF_CELL_OFFSET),
  );
}

/**
 * 셀 ID에서 만든 고정 랜덤값과 시간 uniform으로 헥스 셀 깜빡임을 계산합니다.
 * 각 셀이 서로 다른 위상과 속도로 잠깐씩 밝아지는 레이어입니다.
 */
function createHexFlash(
  cellId: THREE.TSL.ShaderNodeObject<THREE.Node>,
  time: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
  flashSpeed: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
  flashIntensity: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
) {
  const HEX_FLASH_RANDOM_VECTOR = [127.1, 311.7] as const;
  const HEX_FLASH_RANDOM_SCALE = 43758.5453;
  const HEX_FLASH_PHASE_RANGE = 6.2831;
  const HEX_FLASH_MIN_SPEED = 0.5;
  const HEX_FLASH_SPEED_RANGE = 1.5;
  const HEX_FLASH_THRESHOLD_START = 0.6;
  const HEX_FLASH_THRESHOLD_END = 1;
  const { dot, fract, sin, smoothstep, vec2 } = THREE.TSL;

  const random = fract(
    sin(dot(cellId, vec2(...HEX_FLASH_RANDOM_VECTOR))).mul(
      HEX_FLASH_RANDOM_SCALE,
    ),
  );
  const phase = random.mul(HEX_FLASH_PHASE_RANGE);
  const speed = random.mul(HEX_FLASH_SPEED_RANGE).add(HEX_FLASH_MIN_SPEED);
  const wave = sin(time.mul(flashSpeed).mul(speed).add(phase));

  return smoothstep(
    HEX_FLASH_THRESHOLD_START,
    HEX_FLASH_THRESHOLD_END,
    wave,
  ).mul(flashIntensity);
}

/**
 * Fresnel rim과 hex grid 레이어를 최종 실드 밝기값으로 합성합니다.
 * hex는 가장자리에서 더 밝아지고, 셀 단위 flash를 별도 광량으로 더합니다.
 */
function resolveShieldIntensity(
  fresnel: THREE.TSL.ShaderNodeObject<THREE.Node>,
  hex: THREE.TSL.ShaderNodeObject<THREE.Node>,
  flash: THREE.TSL.ShaderNodeObject<THREE.Node>,
  hexOpacity: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
) {
  const HEX_RIM_BLEND = 0.7;
  const HEX_BASE_VISIBILITY = 0.3;
  const RIM_BASE_INTENSITY = 0.4;

  const hexIntensity = hex
    .mul(hexOpacity)
    .mul(fresnel.mul(HEX_RIM_BLEND).add(HEX_BASE_VISIBILITY));
  const rimIntensity = fresnel.mul(RIM_BASE_INTENSITY);

  return hexIntensity.add(rimIntensity).add(flash);
}

/**
 * 레퍼런스의 Fresnel rim과 hex grid 수식을 Three WebGPU NodeMaterial로 재구성합니다.
 * 가장자리 광량 위에 object-space 기반 육각형 그리드 레이어를 더합니다.
 */
export function createShieldMaterial() {
  const SHIELD_COLOR_INTENSITY = 2;
  const {
    clamp,
    color,
    normalView: vView,
    positionLocal,
    positionViewDirection: vViewDir,
    uniform,
  } = THREE.TSL;

  const uTime = uniform(0).label("time");
  const uFresnelPower = uniform(SHIELD_PARAMS.fresnel.power).label(
    "fresnelPower",
  );
  const uFresnelStrength = uniform(SHIELD_PARAMS.fresnel.strength).label(
    "fresnelStrength",
  );
  const uHexScale = uniform(SHIELD_PARAMS.hex.scale).label("hexScale");
  const uHexOpacity = uniform(SHIELD_PARAMS.hex.opacity).label("hexOpacity");
  const uHexEdgeWidth = uniform(SHIELD_PARAMS.hex.edgeWidth).label(
    "hexEdgeWidth",
  );
  const uHexFlashSpeed = uniform(SHIELD_PARAMS.hex.flashSpeed).label(
    "hexFlashSpeed",
  );
  const uHexFlashIntensity = uniform(SHIELD_PARAMS.hex.flashIntensity).label(
    "hexFlashIntensity",
  );

  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const fresnel = createFresnelRim(
    vView,
    vViewDir,
    uFresnelPower,
    uFresnelStrength,
  );
  const hexProjection = createHexProjection(positionLocal);
  const hex = createHexPattern(
    hexProjection.faceUv,
    uHexScale,
    uHexEdgeWidth,
  ).mul(hexProjection.fade);
  const hexCellId = createHexCellId(hexProjection.faceUv, uHexScale);
  const flash = createHexFlash(
    hexCellId,
    uTime,
    uHexFlashSpeed,
    uHexFlashIntensity,
  ).mul(hexProjection.fade);
  const intensity = resolveShieldIntensity(fresnel, hex, flash, uHexOpacity);

  material.colorNode = color(SHIELD_PARAMS.color).mul(
    intensity.mul(SHIELD_COLOR_INTENSITY),
  );
  material.opacityNode = clamp(intensity.mul(SHIELD_PARAMS.opacity), 0, 1);

  return {
    material,
    uniforms: {
      time: uTime,
      fresnelPower: uFresnelPower,
      fresnelStrength: uFresnelStrength,
      hexScale: uHexScale,
      hexOpacity: uHexOpacity,
      hexEdgeWidth: uHexEdgeWidth,
      hexFlashSpeed: uHexFlashSpeed,
      hexFlashIntensity: uHexFlashIntensity,
    },
  };
}
