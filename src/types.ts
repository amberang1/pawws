export type GameType = 'koi' | 'bug' | 'shadows' | 'gravity' | 'hunt' | 'coplay' | 'sound' | 'string' | 'cone' | 'rain' | 'bag' | 'receipt' | 'ribbon' | 'mouse';

export interface PlayStats {
  game: GameType;
  timeSpent: number; // in seconds
  taps: number;
  catches: number;
  preyType: string;
}

