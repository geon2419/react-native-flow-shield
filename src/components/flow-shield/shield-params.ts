export interface FresnelParams {
  power: number;
  strength: number;
}

export interface HexParams {
  scale: number;
  opacity: number;
  edgeWidth: number;
}

export interface ShieldParams {
  color: string;
  opacity: number;
  fresnel: FresnelParams;
  hex: HexParams;
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
  },
};
