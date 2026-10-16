import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatPlaceName, placeCacheKey, type GeocodedPlace } from './place-name.ts';

function place(overrides: Partial<GeocodedPlace>): GeocodedPlace {
  return {
    city: null,
    district: null,
    subregion: null,
    region: null,
    country: null,
    isoCountryCode: null,
    ...overrides,
  };
}

describe('formatPlaceName', () => {
  it('abbreviates Brazilian states and appends the country', () => {
    assert.equal(
      formatPlaceName(
        place({ city: 'Indaiatuba', region: 'São Paulo', country: 'Brasil', isoCountryCode: 'BR' }),
      ),
      'Indaiatuba, SP · Brasil',
    );
    assert.equal(
      formatPlaceName(
        place({
          city: 'Brasília',
          region: 'Distrito Federal',
          country: 'Brasil',
          isoCountryCode: 'br',
        }),
      ),
      'Brasília, DF · Brasil',
    );
  });

  it('keeps region names outside Brazil and falls back to subregion', () => {
    assert.equal(
      formatPlaceName(
        place({
          subregion: 'San Pedro de Atacama',
          region: 'Antofagasta',
          country: 'Chile',
          isoCountryCode: 'CL',
        }),
      ),
      'San Pedro de Atacama, Antofagasta · Chile',
    );
  });

  it('avoids repeated names and returns null without data', () => {
    assert.equal(
      formatPlaceName(
        place({ city: 'São Paulo', region: 'SP', country: 'Brasil', isoCountryCode: 'BR' }),
      ),
      'São Paulo, SP · Brasil',
    );
    assert.equal(
      formatPlaceName(place({ city: 'Lisboa', region: 'Lisboa', country: 'Portugal' })),
      'Lisboa · Portugal',
    );
    assert.equal(formatPlaceName(place({})), null);
  });
});

describe('placeCacheKey', () => {
  it('groups coordinates that are a few metres apart', () => {
    assert.equal(placeCacheKey(-23.09021, -47.21721), placeCacheKey(-23.09049, -47.21681));
    assert.notEqual(placeCacheKey(-23.09, -47.21), placeCacheKey(-23.1, -47.21));
  });
});
