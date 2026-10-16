import type {
  CelestialObjectPosition,
  HorizontalCoordinates,
  ProjectedCelestialObject,
  ProjectionContext,
  ScreenProjection,
} from './celestial-projection.types.ts';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

const DEGREES_TO_RADIANS = Math.PI / 180;
const VISIBILITY_EPSILON = 1e-10;

export function projectCelestialToScreen(
  target: HorizontalCoordinates,
  context: ProjectionContext,
): ScreenProjection | null {
  const projection = projectCelestialDirection(target, context);
  if (
    !projection ||
    Math.abs(projection.normalizedX) > 1 + VISIBILITY_EPSILON ||
    Math.abs(projection.normalizedY) > 1 + VISIBILITY_EPSILON
  ) {
    return null;
  }

  const boundedX = clamp(projection.normalizedX, -1, 1);
  const boundedY = clamp(projection.normalizedY, -1, 1);

  return {
    x: ((boundedX + 1) * context.viewport.width) / 2,
    y: ((1 - boundedY) * context.viewport.height) / 2,
    normalizedX: boundedX,
    normalizedY: boundedY,
    depth: projection.depth,
  };
}

/**
 * Projects a direction in front of the camera without clipping it to the field of view.
 * Useful for drawing line segments whose endpoints may lie slightly outside the screen.
 */
export function projectCelestialDirection(
  target: HorizontalCoordinates,
  context: ProjectionContext,
): ScreenProjection | null {
  validateInput(target, context);

  const targetVector = horizontalCoordinatesToVector(target);
  const camera = cameraBasis(context);
  const depth = dot(targetVector, camera.forward);

  if (depth <= VISIBILITY_EPSILON) return null;

  const tangentHorizontal = Math.tan(
    (context.fieldOfView.horizontalDegrees * DEGREES_TO_RADIANS) / 2,
  );
  const tangentVertical = Math.tan((context.fieldOfView.verticalDegrees * DEGREES_TO_RADIANS) / 2);
  const normalizedX = dot(targetVector, camera.right) / (depth * tangentHorizontal);
  const normalizedY = dot(targetVector, camera.up) / (depth * tangentVertical);

  return {
    x: ((normalizedX + 1) * context.viewport.width) / 2,
    y: ((1 - normalizedY) * context.viewport.height) / 2,
    normalizedX,
    normalizedY,
    depth,
  };
}

export function projectVisibleCelestialObjects<TObject extends CelestialObjectPosition>(
  objects: readonly TObject[],
  context: ProjectionContext,
): ProjectedCelestialObject<TObject>[] {
  return objects.flatMap((object) => {
    const projection = projectCelestialToScreen(object, context);
    return projection ? [{ celestialObject: object, ...projection }] : [];
  });
}

function horizontalCoordinatesToVector(position: HorizontalCoordinates): Vector3 {
  const altitude = position.altitudeDegrees * DEGREES_TO_RADIANS;
  const azimuth = position.azimuthDegrees * DEGREES_TO_RADIANS;
  const horizontalLength = Math.cos(altitude);

  return {
    x: horizontalLength * Math.sin(azimuth),
    y: Math.sin(altitude),
    z: horizontalLength * Math.cos(azimuth),
  };
}

function cameraBasis(context: ProjectionContext): {
  forward: Vector3;
  right: Vector3;
  up: Vector3;
} {
  const heading = context.orientation.headingDegrees * DEGREES_TO_RADIANS;
  const pitch = context.orientation.pitchDegrees * DEGREES_TO_RADIANS;
  const roll = context.orientation.rollDegrees * DEGREES_TO_RADIANS;
  const cosinePitch = Math.cos(pitch);
  const forward = {
    x: cosinePitch * Math.sin(heading),
    y: Math.sin(pitch),
    z: cosinePitch * Math.cos(heading),
  };
  const levelRight = {
    x: Math.cos(heading),
    y: 0,
    z: -Math.sin(heading),
  };
  const levelUp = {
    x: -Math.sin(pitch) * Math.sin(heading),
    y: cosinePitch,
    z: -Math.sin(pitch) * Math.cos(heading),
  };

  return {
    forward,
    right: add(scale(levelRight, Math.cos(roll)), scale(levelUp, Math.sin(roll))),
    up: add(scale(levelUp, Math.cos(roll)), scale(levelRight, -Math.sin(roll))),
  };
}

function validateInput(target: HorizontalCoordinates, context: ProjectionContext): void {
  assertFinite('altitudeDegrees', target.altitudeDegrees);
  assertFinite('azimuthDegrees', target.azimuthDegrees);
  assertFinite('headingDegrees', context.orientation.headingDegrees);
  assertFinite('pitchDegrees', context.orientation.pitchDegrees);
  assertFinite('rollDegrees', context.orientation.rollDegrees);
  assertRange('altitudeDegrees', target.altitudeDegrees, -90, 90);
  assertExclusiveRange('horizontal field of view', context.fieldOfView.horizontalDegrees, 0, 180);
  assertExclusiveRange('vertical field of view', context.fieldOfView.verticalDegrees, 0, 180);
  assertPositive('viewport width', context.viewport.width);
  assertPositive('viewport height', context.viewport.height);
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
}

function assertRange(name: string, value: number, minimum: number, maximum: number): void {
  if (value < minimum || value > maximum) {
    throw new RangeError(`${name} must be between ${minimum} and ${maximum}`);
  }
}

function assertExclusiveRange(name: string, value: number, minimum: number, maximum: number): void {
  assertFinite(name, value);
  if (value <= minimum || value >= maximum) {
    throw new RangeError(`${name} must be greater than ${minimum} and less than ${maximum}`);
  }
}

function assertPositive(name: string, value: number): void {
  assertFinite(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than zero`);
}

function dot(left: Vector3, right: Vector3): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function scale(vector: Vector3, factor: number): Vector3 {
  return { x: vector.x * factor, y: vector.y * factor, z: vector.z * factor };
}

function add(left: Vector3, right: Vector3): Vector3 {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
