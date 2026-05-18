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
  flowScale: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  flowSpeed: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  flowIntensity: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  dissolveProgress: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  dissolveNoiseScale: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  dissolveEdgeWidth: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  dissolveEdgeIntensity: THREE.TSL.ShaderNodeObject<
    THREE.UniformNode<number>
  >;
  dissolveEdgeSmoothness: THREE.TSL.ShaderNodeObject<
    THREE.UniformNode<number>
  >;
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
 * object-space 위치와 시간값으로 표면을 따라 흐르는 3D 노이즈를 만듭니다.
 * 서로 다른 방향의 노이즈 두 겹을 섞어 레퍼런스의 에너지 흐름감을 재현합니다.
 */
function createFlowingEnergyNoise(
  positionLocal: THREE.TSL.ShaderNodeObject<THREE.Node>,
  time: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
  scale: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
  speed: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
) {
  const FLOW_PRIMARY_WEIGHT = 0.6;
  const FLOW_SECONDARY_WEIGHT = 0.4;
  const FLOW_SECONDARY_SCALE = 2.1;
  const FLOW_NOISE_AMPLITUDE = 0.5;
  const FLOW_NOISE_PIVOT = 0.5;
  const { mx_noise_float, vec3 } = THREE.TSL;

  const animatedTime = time.mul(speed);
  const primaryOffset = vec3(
    animatedTime,
    animatedTime.mul(0.6),
    animatedTime.mul(0.4),
  );
  const secondaryOffset = vec3(
    animatedTime.mul(-0.5),
    animatedTime.mul(0.9),
    animatedTime.mul(0.3),
  );
  const primaryNoise = mx_noise_float(
    positionLocal.mul(scale).add(primaryOffset),
    FLOW_NOISE_AMPLITUDE,
    FLOW_NOISE_PIVOT,
  );
  const secondaryNoise = mx_noise_float(
    positionLocal.mul(scale).mul(FLOW_SECONDARY_SCALE).add(secondaryOffset),
    FLOW_NOISE_AMPLITUDE,
    FLOW_NOISE_PIVOT,
  );

  return primaryNoise
    .mul(FLOW_PRIMARY_WEIGHT)
    .add(secondaryNoise.mul(FLOW_SECONDARY_WEIGHT));
}

/**
 * 3D noise threshold로 실드가 유기적으로 드러나는 dissolve mask를 만듭니다.
 * 경계 부분은 별도 edge 값으로 분리해 밝은 생성 라인으로 합성합니다.
 */
function createDissolveReveal(
  positionLocal: THREE.TSL.ShaderNodeObject<THREE.Node>,
  progress: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
  noiseScale: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
  edgeWidth: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
  edgeSmoothness: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>,
) {
  const DISSOLVE_NOISE_AMPLITUDE = 0.5;
  const DISSOLVE_NOISE_PIVOT = 0.5;
  const DISSOLVE_EDGE_SMOOTH_START = 0.98;
  const DISSOLVE_EDGE_SMOOTH_END = 0.15;
  const DISSOLVE_EDGE_OUTER_WIDTH = 0.15;
  const { mix, mx_noise_float, oneMinus, smoothstep } = THREE.TSL;

  const noise = mx_noise_float(
    positionLocal.mul(noiseScale),
    DISSOLVE_NOISE_AMPLITUDE,
    DISSOLVE_NOISE_PIVOT,
  );
  const threshold = oneMinus(progress);
  const mask = smoothstep(threshold.sub(edgeWidth), threshold, noise);
  const innerFade = mix(
    DISSOLVE_EDGE_SMOOTH_START,
    DISSOLVE_EDGE_SMOOTH_END,
    edgeSmoothness,
  );
  const edgeLow = smoothstep(
    threshold.sub(edgeWidth),
    threshold.sub(edgeWidth.mul(innerFade)),
    noise,
  );
  const edgeHigh = smoothstep(
    threshold.sub(edgeWidth.mul(DISSOLVE_EDGE_OUTER_WIDTH)),
    threshold,
    noise,
  );
  const edge = edgeLow.mul(oneMinus(edgeHigh));

  return { mask, edge };
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
 * 레퍼런스의 Fresnel, hex grid, flow noise, dissolve reveal 수식을 WebGPU NodeMaterial로 재구성합니다.
 * 가장자리 광량 위에 육각형 그리드, 흐르는 에너지, 생성 경계 glow를 더합니다.
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
  const uFlowScale = uniform(SHIELD_PARAMS.flow.scale).label("flowScale");
  const uFlowSpeed = uniform(SHIELD_PARAMS.flow.speed).label("flowSpeed");
  const uFlowIntensity = uniform(SHIELD_PARAMS.flow.intensity).label(
    "flowIntensity",
  );
  const uDissolveProgress = uniform(SHIELD_PARAMS.dissolve.progress).label(
    "dissolveProgress",
  );
  const uDissolveNoiseScale = uniform(
    SHIELD_PARAMS.dissolve.noiseScale,
  ).label("dissolveNoiseScale");
  const uDissolveEdgeWidth = uniform(SHIELD_PARAMS.dissolve.edgeWidth).label(
    "dissolveEdgeWidth",
  );
  const uDissolveEdgeIntensity = uniform(
    SHIELD_PARAMS.dissolve.edgeIntensity,
  ).label("dissolveEdgeIntensity");
  const uDissolveEdgeSmoothness = uniform(
    SHIELD_PARAMS.dissolve.edgeSmoothness,
  ).label("dissolveEdgeSmoothness");

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
  const flow = createFlowingEnergyNoise(
    positionLocal,
    uTime,
    uFlowScale,
    uFlowSpeed,
  )
    .mul(fresnel)
    .mul(uFlowIntensity);
  const dissolve = createDissolveReveal(
    positionLocal,
    uDissolveProgress,
    uDissolveNoiseScale,
    uDissolveEdgeWidth,
    uDissolveEdgeSmoothness,
  );
  const intensity = resolveShieldIntensity(fresnel, hex, flash, uHexOpacity);
  const shieldColor = color(SHIELD_PARAMS.color);
  const edgeGlow = shieldColor.mul(
    dissolve.edge.mul(uDissolveEdgeIntensity),
  );

  material.colorNode = shieldColor
    .mul(intensity.mul(SHIELD_COLOR_INTENSITY).add(flow))
    .add(edgeGlow);
  material.opacityNode = clamp(
    intensity
      .mul(SHIELD_PARAMS.opacity)
      .mul(dissolve.mask)
      .add(dissolve.edge.mul(uDissolveEdgeIntensity)),
    0,
    1,
  );

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
      flowScale: uFlowScale,
      flowSpeed: uFlowSpeed,
      flowIntensity: uFlowIntensity,
      dissolveProgress: uDissolveProgress,
      dissolveNoiseScale: uDissolveNoiseScale,
      dissolveEdgeWidth: uDissolveEdgeWidth,
      dissolveEdgeIntensity: uDissolveEdgeIntensity,
      dissolveEdgeSmoothness: uDissolveEdgeSmoothness,
    },
  };
}
