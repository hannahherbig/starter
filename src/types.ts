export type Key = string

export type HasTime = { time: number }
export type HasSlug = { slug: string }

export type Tournament = HasSlug & HasTime & { name: string }
export type Event = HasSlug &
  HasTime & {
    name: string
    tournament: Key
  }
export type Set = HasTime & {
  event: Key
  round?: string
  winner: Key
  loser: Key
  winnerScore?: number
  loserScore?: number
}
export type Player = HasSlug & {
  prefix?: string
  tag: string
}

export type Table<T> = Record<Key, T>

export type DB = {
  players?: Table<Player>
  sets?: Table<Set>
  events?: Table<Event>
  tournaments?: Table<Tournament>
}
