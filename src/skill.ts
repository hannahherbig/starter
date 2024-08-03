import { rating, rate, ordinal } from 'openskill'
import { db, load } from './db'
import { orderBy } from 'lodash'
import { Key } from './types'
import { Rating } from 'openskill/dist/types'
import { inspect } from 'util'
import { writeFileSync } from 'fs'

load()

const ratings: Record<Key, Rating> = {}

function getRating(id: Key) {
  return ratings[id] || rating()
}

if (db.sets && db.players) {
  orderBy(Object.values(db.sets), ['completedAt'], ['asc']).forEach((set) => {
    const teams = [[getRating(set.winner)], [getRating(set.loser)]]
    const [[newWinnerRating], [newLoserRating]] = rate(teams)

    ratings[set.winner] = newWinnerRating
    ratings[set.loser] = newLoserRating
  })
}

writeFileSync(
  'skill.json',
  JSON.stringify(
    orderBy(
      Object.entries(ratings).map(([id, rating]) => ({
        id,
        player: db.players![id],
        ordinal: ordinal(rating),
        rating,
      })),
      ['ordinal'],
      ['desc'],
    ),
    null,
    2,
  ),
)
