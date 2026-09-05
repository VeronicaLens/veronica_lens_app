import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  projectCelestialToScreen,
  projectVisibleCelestialObjects,
} from './celestial-projection.ts';
import type { ProjectionContext } from './celestial-projection.types.ts';

const context: ProjectionContext = {
  orientation: { headingDegrees: 0, pitchDegrees: 0, rollDegrees: 0 },
  fieldOfView: { horizontalDegrees: 60, verticalDegrees: 40 },
  viewport: { width: 300, height: 600 },
};

describe('projectCelestialToScreen', () => {
  it('projects the camera direction into the center of the viewport', () => {
    const result = projectCelestialToScreen({ altitudeDegrees: 0, azimuthDegrees: 0 }, context);

    assert.ok(result);
    assert.equal(result.x, 150);
    assert.equal(result.y, 300);
    assert.equal(result.normalizedX, 0);
    assert.equal(result.normalizedY, 0);
  });

  it('uses heading and pitch as the center direction', () => {
    const result = projectCelestialToScreen(
      { altitudeDegrees: 35, azimuthDegrees: 120 },
      {
        ...context,
        orientation: { headingDegrees: 120, pitchDegrees: 35, rollDegrees: 0 },
      },
    );

    assert.ok(result);
    assert.ok(Math.abs(result.x - 150) < 1e-10);
    assert.ok(Math.abs(result.y - 300) < 1e-10);
  });

  it('projects known horizontal and vertical FOV edges', () => {
    const rightEdge = projectCelestialToScreen({ altitudeDegrees: 0, azimuthDegrees: 30 }, context);
    const topEdge = projectCelestialToScreen({ altitudeDegrees: 20, azimuthDegrees: 0 }, context);

    assert.ok(rightEdge);
    assert.ok(topEdge);
    assert.equal(rightEdge.x, 300);
    assert.ok(Math.abs(rightEdge.y - 300) < 1e-10);
    assert.ok(Math.abs(topEdge.x - 150) < 1e-10);
    assert.equal(topEdge.y, 0);
  });

  it('supports azimuth wrap-around at north', () => {
    const result = projectCelestialToScreen(
      { altitudeDegrees: 0, azimuthDegrees: 1 },
      {
        ...context,
        orientation: { headingDegrees: 359, pitchDegrees: 0, rollDegrees: 0 },
      },
    );

    assert.ok(result);
    assert.ok(result.x > 150);
    assert.ok(result.x < 170);
  });

  it('applies camera roll to the screen axes', () => {
    const withoutRoll = projectCelestialToScreen(
      { altitudeDegrees: 10, azimuthDegrees: 0 },
      context,
    );
    const withQuarterTurn = projectCelestialToScreen(
      { altitudeDegrees: 10, azimuthDegrees: 0 },
      {
        ...context,
        orientation: { headingDegrees: 0, pitchDegrees: 0, rollDegrees: 90 },
      },
    );

    assert.ok(withoutRoll);
    assert.ok(withQuarterTurn);
    assert.ok(withoutRoll.y < 300);
    assert.ok(Math.abs(withQuarterTurn.y - 300) < 1e-10);
    assert.ok(withQuarterTurn.x > 150);
  });

  it('returns null outside the FOV or behind the camera', () => {
    assert.equal(
      projectCelestialToScreen({ altitudeDegrees: 0, azimuthDegrees: 31 }, context),
      null,
    );
    assert.equal(
      projectCelestialToScreen({ altitudeDegrees: 21, azimuthDegrees: 0 }, context),
      null,
    );
    assert.equal(
      projectCelestialToScreen({ altitudeDegrees: 0, azimuthDegrees: 180 }, context),
      null,
    );
  });

  it('changes screen displacement according to the camera FOV', () => {
    const narrow = projectCelestialToScreen({ altitudeDegrees: 0, azimuthDegrees: 20 }, context);
    const wide = projectCelestialToScreen(
      { altitudeDegrees: 0, azimuthDegrees: 20 },
      {
        ...context,
        fieldOfView: { horizontalDegrees: 90, verticalDegrees: 60 },
      },
    );

    assert.ok(narrow);
    assert.ok(wide);
    assert.ok(narrow.x > wide.x);
  });

  it('rejects invalid physical and viewport values', () => {
    assert.throws(
      () => projectCelestialToScreen({ altitudeDegrees: 91, azimuthDegrees: 0 }, context),
      /altitudeDegrees/,
    );
    assert.throws(
      () =>
        projectCelestialToScreen(
          { altitudeDegrees: 0, azimuthDegrees: 0 },
          { ...context, fieldOfView: { horizontalDegrees: 180, verticalDegrees: 40 } },
        ),
      /horizontal field of view/,
    );
    assert.throws(
      () =>
        projectCelestialToScreen(
          { altitudeDegrees: 0, azimuthDegrees: 0 },
          { ...context, viewport: { width: 0, height: 600 } },
        ),
      /viewport width/,
    );
  });
});

describe('projectVisibleCelestialObjects', () => {
  it('returns only objects inside the visible camera frustum', () => {
    const result = projectVisibleCelestialObjects(
      [
        { id: 'center', altitudeDegrees: 0, azimuthDegrees: 0 },
        { id: 'outside', altitudeDegrees: 0, azimuthDegrees: 80 },
        { id: 'behind', altitudeDegrees: 0, azimuthDegrees: 180 },
      ],
      context,
    );

    assert.deepEqual(
      result.map((object) => object.celestialObject.id),
      ['center'],
    );
  });

  it('preserves celestial object metadata for the overlay', () => {
    const [projected] = projectVisibleCelestialObjects(
      [{ id: 'jupiter', name: 'Júpiter', altitudeDegrees: 0, azimuthDegrees: 0 }],
      context,
    );

    assert.equal(projected?.celestialObject.name, 'Júpiter');
  });
});
