export interface Palette {
  title: (s: string) => string
  hero: (s: string) => string
  accent: (s: string) => string
  num: (s: string) => string
  dim: (s: string) => string
}

const wrap = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`

export function makePalette(enabled: boolean): Palette {
  if (!enabled) {
    const id = (s: string) => s
    return { title: id, hero: id, accent: id, num: id, dim: id }
  }
  return {
    title: wrap('1;33'),
    hero: wrap('1;36'),
    accent: wrap('35'),
    num: wrap('32'),
    dim: wrap('2'),
  }
}
