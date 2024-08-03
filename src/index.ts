import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { ENDPOINT, HEADERS } from './config'
import { graphql } from './gql'
import { idc, insert, load, save } from './db'

function log(obj: any) {
  console.log(JSON.stringify(obj, null, 2))
}

const client = new ApolloClient({
  uri: ENDPOINT,
  cache: new InMemoryCache(),
  headers: HEADERS,
  defaultOptions: { query: { fetchPolicy: 'no-cache' } },
})

async function fetchTournamentEvents(slug: string) {
  const { data } = await client.query({
    query: graphql(`
      query GetTournamentEvents($slug: String) {
        tournament(slug: $slug) {
          id
          name
          slug
          startAt
          events(filter: { type: [1], videogameId: [1] }) {
            id
            name
            slug
            numEntrants
            state
            startAt
          }
        }
      }
    `),
    variables: { slug },
  })
  const { tournament } = data
  if (
    tournament?.id &&
    tournament.name &&
    tournament.slug &&
    tournament.startAt &&
    tournament.events
  ) {
    const tournamentId = tournament?.id
    const events = []
    insert('tournaments', tournamentId, {
      name: tournament.name,
      slug: tournament.slug,
      time: tournament.startAt,
    })
    for (const event of tournament.events) {
      if (
        event?.id &&
        event.startAt &&
        event.name &&
        event.slug &&
        event.state === 'COMPLETED'
      ) {
        const eventId = idc(event.id)
        insert('events', eventId, {
          slug: event.slug,
          time: event.startAt,
          name: event.name,
          tournament: idc(tournamentId),
        })
        events.push(eventId)
      }
    }
    for (const event of events) {
      await fetchSets(event)
    }
  }
}

async function fetchSets(event: string) {
  let page = 1
  while (true) {
    const { data } = await client.query({
      query: graphql(`
        query GetEventSets($event: ID, $page: Int) {
          event(id: $event) {
            sets(page: $page, perPage: 32) {
              pageInfo {
                totalPages
              }
              nodes {
                id
                completedAt
                fullRoundText
                winnerId
                slots {
                  entrant {
                    id
                    participants {
                      player {
                        gamerTag
                        prefix
                        user {
                          id
                          slug
                        }
                      }
                    }
                  }
                  standing {
                    stats {
                      score {
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `),
      variables: { event, page: page++ },
    })
    const nodes = data.event?.sets?.nodes
    if (nodes) {
      for (const set of nodes) {
        if (
          set?.id &&
          set.fullRoundText &&
          set.completedAt &&
          set.slots &&
          set.winnerId
        ) {
          let winner, loser, winnerScore, loserScore
          const winnerId = idc(set.winnerId)
          for (const slot of set.slots) {
            const entrantId = slot?.entrant?.id
            const score = slot?.standing?.stats?.score?.value
            if (entrantId && slot?.entrant?.participants) {
              const [participant] = slot.entrant.participants
              const player = participant?.player
              const user = participant?.player?.user
              const slug = user?.slug
              const prefix = player?.prefix || null
              const tag = player?.gamerTag
              if (user?.id && slug && tag) {
                const userId = idc(user.id)
                insert('players', userId, {
                  slug,
                  prefix,
                  tag,
                })
                if (winnerId === idc(entrantId)) {
                  winner = userId
                  winnerScore = score
                } else {
                  loser = userId
                  loserScore = score
                }
              }
            }
          }
          if (winner && loser && winnerScore !== -1 && loserScore !== -1) {
            insert('sets', set.id, {
              time: set.completedAt,
              event,
              round: set.fullRoundText,
              winner,
              loser,
              winnerScore,
              loserScore,
            })
          }
        }
      }
    }
    const totalPages = data.event?.sets?.pageInfo?.totalPages
    if (!totalPages || page > totalPages) {
      return
    }
  }
}

async function main() {
  load()
  await fetchTournamentEvents('nightclub')
  save()
}

main()
