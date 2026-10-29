import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Pins down the shape of the data the screens depend on. When we write
 * TypeScript types for it later, this test is the evidence they are right.
 */

const DATA_DIR = 'public/data/phones';
const readJson = (file: string): unknown => JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));

const list = readJson('phones.json') as Array<Record<string, unknown>>;

describe('phones.json (list data)', () => {
  it('has 20 phones with unique ids', () => {
    expect(list).toHaveLength(20);
    expect(new Set(list.map((p) => p.id)).size).toBe(20);
  });

  it('gives every phone the fields the list screen uses', () => {
    for (const phone of list) {
      expect(phone).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        age: expect.any(Number),
        imageUrl: expect.stringMatching(/^img\/phones\/.+\.jpg$/),
        snippet: expect.any(String),
      });
      if ('carrier' in phone) expect(phone.carrier).toEqual(expect.any(String));
    }
  });

  it('has a detail file for every phone and no orphans', () => {
    const detailFiles = readdirSync(DATA_DIR).filter((f) => f !== 'phones.json');
    expect(detailFiles.sort()).toEqual(list.map((p) => `${String(p.id)}.json`).sort());
  });
});

describe('<id>.json (detail data)', () => {
  const str = expect.any(String);
  const bool = expect.any(Boolean);
  const strings = expect.arrayContaining([]);

  it.each(list.map((p) => String(p.id)))('%s has every field the detail screen uses', (id) => {
    const phone = readJson(`${id}.json`) as Record<string, unknown>;
    expect(phone).toMatchObject({
      id,
      name: str,
      description: str,
      images: expect.arrayContaining([expect.stringMatching(/^img\/phones\/.+\.jpg$/)]),
      availability: strings,
      additionalFeatures: str,
      android: { os: str, ui: str },
      battery: { type: str, talkTime: str, standbyTime: str },
      storage: { ram: str, flash: str },
      connectivity: { cell: str, wifi: str, bluetooth: str, infrared: bool, gps: bool },
      sizeAndWeight: { dimensions: strings, weight: str },
      display: { screenSize: str, screenResolution: str, touchScreen: bool },
      hardware: { cpu: str, usb: str, audioJack: str, fmRadio: bool, accelerometer: bool },
      camera: { primary: str, features: strings },
    });
  });
});
