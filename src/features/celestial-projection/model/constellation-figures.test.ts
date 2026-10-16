import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  constellationFigures,
  equatorialToHorizontal,
  projectConstellationFigure,
} from './constellation-figures.ts';

const observer = { latitudeDegrees: -23.09, longitudeDegrees: -47.22 };

describe('equatorialToHorizontal', () => {
  it('places a star whose declination equals the latitude at the zenith on its meridian transit', () => {
    const observedAt = new Date('2026-01-15T03:00:00.000Z');
    const highest = [...Array(360).keys()]
      .map((rightAscensionDegrees) =>
        equatorialToHorizontal(
          { rightAscensionDegrees, declinationDegrees: observer.latitudeDegrees },
          observer,
          observedAt,
        ),
      )
      .reduce((best, current) => (current.altitudeDegrees > best.altitudeDegrees ? current : best));

    assert.ok(highest.altitudeDegrees > 89);
  });

  it('keeps the south celestial pole at an altitude equal to the southern latitude', () => {
    const result = equatorialToHorizontal(
      { rightAscensionDegrees: 120, declinationDegrees: -90 },
      observer,
      new Date('2026-10-15T23:00:00.000Z'),
    );

    assert.ok(Math.abs(result.altitudeDegrees - Math.abs(observer.latitudeDegrees)) < 1e-6);
    assert.ok(Math.abs(result.azimuthDegrees - 180) < 1e-6);
  });
});

describe('constellationFigures', () => {
  it('only references stars declared in each figure', () => {
    for (const figure of constellationFigures) {
      for (const [from, to] of figure.lines) {
        assert.ok(figure.stars[from], `${figure.id}: ${from}`);
        assert.ok(figure.stars[to], `${figure.id}: ${to}`);
      }
    }
  });

  it('projects Orion segments when the camera points at its belt', () => {
    const orion = constellationFigures.find(({ id }) => id === 'orion');
    assert.ok(orion);
    const observedAt = new Date('2026-01-15T03:00:00.000Z');
    const belt = equatorialToHorizontal(
      { rightAscensionDegrees: 84.05, declinationDegrees: -1.2 },
      observer,
      observedAt,
    );
    const projection = projectConstellationFigure(orion, observer, observedAt, {
      orientation: {
        headingDegrees: belt.azimuthDegrees,
        pitchDegrees: belt.altitudeDegrees,
        rollDegrees: 0,
      },
      fieldOfView: { horizontalDegrees: 45, verticalDegrees: 60 },
      viewport: { width: 400, height: 800 },
    });

    assert.ok(projection);
    assert.equal(projection.segments.length, orion.lines.length);
    assert.ok(projection.stars.some(({ name }) => name === 'Alnilam'));
  });

  it('omits figures behind the camera', () => {
    const crux = constellationFigures.find(({ id }) => id === 'crux');
    assert.ok(crux);
    const observedAt = new Date('2026-05-01T01:00:00.000Z');
    const center = equatorialToHorizontal(
      { rightAscensionDegrees: 186.25, declinationDegrees: -60 },
      observer,
      observedAt,
    );

    const projection = projectConstellationFigure(crux, observer, observedAt, {
      orientation: {
        headingDegrees: (center.azimuthDegrees + 180) % 360,
        pitchDegrees: -center.altitudeDegrees,
        rollDegrees: 0,
      },
      fieldOfView: { horizontalDegrees: 45, verticalDegrees: 60 },
      viewport: { width: 400, height: 800 },
    });

    assert.equal(projection, null);
  });
});
