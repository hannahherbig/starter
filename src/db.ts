import { merge } from 'lodash'
import { DB, Event, Key, Player, Set, Tournament } from './types'
import { readFileSync, writeFileSync } from 'fs'
import { DB_LOCATION } from './config'

export const db: DB = {}

export function idc(id: number | string): Key {
  return id + ''
}

export function insert<T>(table: keyof DB, id: number | string, value: T) {
  id = idc(id)
  merge(db, { [table]: { [id]: value } })
  return db[table]![id]
}

export function select(table: keyof DB, id: number | string) {
  id = idc(id)
  return db[table]?.[id]
}

let lastText: string

export function load() {
  try {
    const text = readFileSync(DB_LOCATION, 'utf-8')
    lastText = text
    const data = JSON.parse(text)
    merge(db, data)
  } catch (err) {
    console.error(err)
  }
}

export function save() {
  const text = JSON.stringify(db, null, 2)
  if (lastText !== text) {
    writeFileSync(DB_LOCATION, text)
    lastText = text
  }
}

export function timer() {
  return setInterval(save, 60000)
}
