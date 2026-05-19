export interface FresnelParams {
  power: number;
  strength: number;
}

export interface HexParams {
  scale: number;
  opacity: number;
  edgeWidth: number;
  flashSpeed: number;
  flashIntensity: number;
}

export interface FlowParams {
  scale: number;
  speed: number;
  intensity: number;
}

export interface DissolveParams {
  progress: number;
  noiseScale: number;
  edgeWidth: number;
  edgeIntensity: number;
  edgeSmoothness: number;
}

export interface HitParams {
  ringSpeed: number;
  ringWidth: number;
  maxRadius: number;
  duration: number;
  intensity: number;
  impactRadius: number;
  damage: number;
}

export const MAX_HITS = 6;

export interface ShieldParams {
  color: string;
  opacity: number;
  fresnel: FresnelParams;
  hex: HexParams;
  flow: FlowParams;
  dissolve: DissolveParams;
  hit: HitParams;
}

export const SHIELD_PARAMS: ShieldParams = {
  color: "#1f7dff",
  opacity: 0.76,
  fresnel: {
    power: 1.8,
    strength: 1.75,
  },
  hex: {
    scale: 3,
    opacity: 0.13,
    edgeWidth: 0.06,
    flashSpeed: 0.6,
    flashIntensity: 0.11,
  },
  flow: {
    scale: 2.4,
    speed: 1.13,
    intensity: 4,
  },
  dissolve: {
    progress: 1,
    noiseScale: 1.3,
    edgeWidth: 0.02,
    edgeIntensity: 10,
    edgeSmoothness: 0.5,
  },
  hit: {
    ringSpeed: 1.75,
    ringWidth: 0.12,
    maxRadius: 0.85,
    duration: 1.8,
    intensity: 4.1,
    impactRadius: 0.3,
    damage: 5,
  },
};
