import { Router } from 'express'
import createCache from './cache'
import twitch from './providers/twitch'
import youtube from './providers/youtube'
import mixer from './providers/mixer'
import { addStreamers, connected, getStreamers } from './db';

const router =  new Router()

const oneMinute = 60*1000

function byViewers(a, b) {
  return b.viewers - a.viewers
}

let streamers = connected
;(async () => {
  await connected
  streamers = await getStreamers()
  streamers.sort(byViewers)
  const streamerMap = {}
  streamers.forEach(s => {
    const key = s.source + '_' + s.id
    streamerMap[key] = s
  })
  const t = twitch()
  const y = youtube()
  const m = mixer()

  const newStreamers = [
    ...await t,
    ...await y,
    ...await m
  ].filter(s => !streamerMap[s.source + '_' + s.id])
  if (newStreamers.length) {
    console.log(`Adding ${newStreamers.length} new streamers`)
    addStreamers(newStreamers)
  }
})()

router.use('*', async (req, res) => {
  res.send(streamers)
})

export default router
