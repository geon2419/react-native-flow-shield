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

export interface ShieldParams {
  color: string;
  opacity: number;
  fresnel: FresnelParams;
  hex: HexParams;
  flow: FlowParams;
}

export const SHIELD_PARAMS: ShieldParams = {
  color: "#26aeff",
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
};
