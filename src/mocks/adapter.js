import { AxiosError } from 'axios'
import fixtures from './fixtures.json' with { type: 'json' }

// No network fallback: missing handlers must be visible during offline development.
export function createMockAdapter() {
  let account = { id: 1, username: 'demo' }
  return async config => {
    const url = new URL(config.url, 'http://mock.local')
    const path = url.pathname.replace(/\/$/, '')
    const params = new URLSearchParams(url.search)
    for (const [key, value] of Object.entries(config.params || {})) params.set(key, value)
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {}
    const method = config.method.toLowerCase()
    const reply = (payload, status = 200) => {
      const response = { data: structuredClone(payload), status, statusText: String(status), headers: {}, config, request: {} }
      if (status >= 400) throw new AxiosError(payload.message, status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, {}, response)
      return response
    }
    const ok = response => reply({ response })
    const fail = (message, status = 404) => reply({ message, response: { error: message } }, status)
    const query = String(body.search_prompt || '').trim().toLowerCase()
    const champions = fixtures.champions.map(champ => ({
      ...champ,
      icon_url: `${import.meta.env?.BASE_URL || '/'}mock-avatar.svg`,
      abilities: champ.abilities.map(ability => ({ ...ability, icon: `${import.meta.env?.BASE_URL || '/'}mock-avatar.svg` })),
    }))

    if (method === 'get' && path === '/api/champions') return ok(champions)
    if (method === 'post' && path === '/api/champions/search') return ok(query ? champions.filter(c => c.name.toLowerCase().includes(query)) : [])
    const championRoute = path.match(/^\/api\/champions\/(\d+)$/)
    if (method === 'get' && championRoute) {
      const champion = champions.find(c => c.id === Number(championRoute[1]))
      return champion ? ok(champion) : fail('Champion not found')
    }
    if (method === 'post' && path === '/api/summoners/search') {
      return ok(query ? fixtures.summoners.filter(s => s.region === String(body.region || 'na1').toLowerCase() && `${s.name}#${s.tag}`.toLowerCase().includes(query)) : [])
    }
    if (method === 'get' && path === '/api/summoners/show') {
      const prompt = String(params.get('search_prompt') || '').trim().toLowerCase()
      const summoner = fixtures.summoners.find(s => s.region === String(params.get('region') || 'na1').toLowerCase() && `${s.name}#${s.tag}`.toLowerCase() === prompt)
      return summoner ? ok(summoner) : fail('Summoner not found in local fixtures. Try Ginjyyy#WHITE in NA.')
    }
    const summonerRoute = path.match(/^\/api\/summoners\/(\d+)\/(ranks|matches|champion_masteries)$/)
    if (method === 'get' && summonerRoute) {
      const summoner = fixtures.summoners.find(s => s.id === Number(summonerRoute[1]))
      if (!summoner) return fail('Summoner not found')
      if (summonerRoute[2] === 'ranks') return ok(summoner.id === 12 ? [] : [
        { queue_type: 'Ranked Solo', tier: 'DIAMOND', division: 'II', league_points: 67, wins: 124, losses: 102 },
        { queue_type: 'Ranked Flex', tier: 'EMERALD', division: 'I', league_points: 32, wins: 43, losses: 38 },
      ])
      if (summonerRoute[2] === 'champion_masteries') return ok(summoner.id === 12 ? [] : champions.slice(0, 3).map((c, i) => ({ champion_id: c.id, level: 18 - i * 4, points: 520000 - i * 175000 })))
      const count = Number(params.get('count') ?? 10)
      if (!Number.isInteger(count) || count < 0) return fail('count must be a non-negative integer', 400)
      return ok(fixtures.matches.filter(m => m.match_participants.some(p => p.region === summoner.region && p.summoner_name === summoner.name && p.summoner_tag === summoner.tag)).slice(0, count))
    }
    if (method === 'post' && ['/api/accounts', '/api/accounts/login'].includes(path)) {
      if (!body.username?.trim() || !body.password) return fail('Username and password are required', 422)
      account = { id: 1, username: body.username.trim() }
      return ok({ account, token: 'mock-session-token' })
    }
    if (method === 'get' && path === '/api/accounts/1') return ok({ account })
    if (method === 'post' && path === '/accounts/logout') return ok({})
    return fail(`No mock handler for ${method.toUpperCase()} ${path}`)
  }
}
