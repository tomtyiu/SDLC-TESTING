import { describe, expect, it } from 'vitest';
import { describeWmo, emojiForWmo } from './wmo';

describe('describeWmo', () => {
  it('returns a label for known codes', () => {
    expect(describeWmo(0)).toMatch(/clear/i);
    expect(describeWmo(95)).toMatch(/thunderstorm/i);
  });

  it('returns Unknown for unmapped codes', () => {
    expect(describeWmo(999)).toBe('Unknown');
  });
});

describe('emojiForWmo', () => {
  it('chooses different glyphs for clear day vs night', () => {
    expect(emojiForWmo(0, 1)).not.toEqual(emojiForWmo(0, 0));
  });

  it('returns a known glyph (not the unknown placeholder) for thunderstorm codes', () => {
    expect(emojiForWmo(95)).not.toBe('❓');
    expect(emojiForWmo(99)).not.toBe('❓');
    expect(emojiForWmo(95).length).toBeGreaterThan(0);
  });
});
