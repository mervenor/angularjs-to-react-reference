/** One entry in phones.json: what the list screen needs. */
export interface PhoneSummary {
  id: string;
  name: string;
  /** Lower is newer. "Newest" sorting is by age, ascending. */
  age: number;
  imageUrl: string;
  snippet: string;
  /** Not displayed, but searchable (see search.ts). */
  carrier?: string;
}

/** One <id>.json file: what the detail screen needs. */
export interface Phone {
  id: string;
  name: string;
  description: string;
  images: string[];
  availability: string[];
  additionalFeatures: string;
  android: { os: string; ui: string };
  battery: { type: string; talkTime: string; standbyTime: string };
  storage: { ram: string; flash: string };
  connectivity: { cell: string; wifi: string; bluetooth: string; infrared: boolean; gps: boolean };
  sizeAndWeight: { dimensions: string[]; weight: string };
  display: { screenSize: string; screenResolution: string; touchScreen: boolean };
  hardware: {
    cpu: string;
    usb: string;
    audioJack: string;
    fmRadio: boolean;
    accelerometer: boolean;
    physicalKeyboard: boolean;
  };
  camera: { primary: string; features: string[] };
}
