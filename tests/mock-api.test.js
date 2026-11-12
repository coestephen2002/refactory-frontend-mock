import assert from 'node:assert/strict'
import test from 'node:test'
import axios from 'axios'
import { createMockAdapter } from '../src/mocks/adapter.js'

const client = () => axios.create({ adapter: createMockAdapter() })
test('search, profile and linked participants preserve the store contract', async () => {
  const api = client()
  const { data } = await api.post('/api/summoners/search', { search_prompt: 'GINJ', region: 'na1' })
  assert.equal(data.response[0].name, 'Ginjyyy')
  assert.deepEqual((await api.post('/api/summoners/search', { search_prompt: 'GINJ', region: 'euw1' })).data.response, [])
  const player = (await api.get('/api/summoners/show', { params: { search_prompt: 'ginjyyy#white', region: 'na1' } })).data.response
  const matches = (await api.get(`/api/summoners/${player.id}/matches?count=2`)).data.response
  assert.equal(matches.length, 2)
  for (const match of matches) {
    assert.equal(match.match_participants.length, 10)
    assert.equal(match.match_participants.filter(p => p.win).length, 5)
    for (const p of match.match_participants) {
      const linked = await api.get('/api/summoners/show', { params: { search_prompt: `${p.summoner_name}#${p.summoner_tag}`, region: p.region } })
      assert.ok(linked.data.response.id)
    }
  }
  const champions = (await api.get('/api/champions')).data.response
  const masteries = (await api.get(`/api/summoners/${player.id}/champion_masteries`)).data.response
  assert.ok(masteries.every(m => champions.some(c => c.id === m.champion_id)))
  assert.equal((await api.get(`/api/summoners/${player.id}/ranks`)).data.response.length, 2)
  matches[0].match_participants[0].kills = -1
  assert.notEqual((await api.get(`/api/summoners/${player.id}/matches`)).data.response[0].match_participants[0].kills, -1)
})
test('empty states, validation and unhandled requests reject without a network fallback', async () => {
  const api = client()
  for (const endpoint of ['matches', 'ranks', 'champion_masteries']) assert.deepEqual((await api.get(`/api/summoners/12/${endpoint}`)).data.response, [])
  for (const url of ['/api/missing', '/api/summoners/999/ranks', '/api/champions/999']) await assert.rejects(api.get(url), e => e.response.status === 404 && !!e.response.data.message)
  await assert.rejects(api.get('/api/summoners/1/matches?count=-1'), e => e.response.status === 400)
  await assert.rejects(api.post('/api/accounts/login', {}), e => e.response.status === 422)
})
test('champion and account actions use the existing envelopes', async () => {
  const api = client()
  const champ = (await api.post('/api/champions/search', { search_prompt: 'ahri' })).data.response[0]
  assert.equal((await api.get(`/api/champions/${champ.id}`)).data.response.abilities.length, 5)
  for (const url of ['/api/accounts', '/api/accounts/login']) {
    const response = (await api.post(url, { username: 'tester', password: 'demo' })).data.response
    assert.equal(response.account.username, 'tester')
    assert.equal(response.token, 'mock-session-token')
  }
  assert.equal((await api.get('/api/accounts/1')).data.response.account.username, 'tester')
  assert.deepEqual((await api.post('/accounts/logout')).data.response, {})
})
