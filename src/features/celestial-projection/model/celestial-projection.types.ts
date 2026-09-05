export interface HorizontalCoordinates {
  altitudeDegrees: number;
  azimuthDegrees: number;
}

export interface ObserverOrientation {
  headingDegrees: number;
  pitchDegrees: number;
  rollDegrees: number;
}

export interface CameraFieldOfView {
  horizontalDegrees: number;
  verticalDegrees: number;
}

export interface ScreenViewport {
  width: number;
  height: number;
}

export interface ProjectionContext {
  orientation: ObserverOrientation;
  fieldOfView: CameraFieldOfView;
  viewport: ScreenViewport;
}

export interface ScreenProjection {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
  depth: number;
}

export interface CelestialObjectPosition extends HorizontalCoordinates {
  id: string;
}

export type ProjectedCelestialObject<
  TObject extends CelestialObjectPosition = CelestialObjectPosition,
> = ScreenProjection & {
  celestialObject: TObject;
};
