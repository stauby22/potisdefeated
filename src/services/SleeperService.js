/**
 * Sleeper API client — all fetch calls to api.sleeper.app live here.
 * Currently dormant (Season 12 is complete). Wire up for Season 13.
 */

const BASE = 'https://api.sleeper.app/v1'

async function get(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`Sleeper API error: ${res.status} ${path}`)
  return res.json()
}

const SleeperService = {
  getLeague(leagueId) {
    return get(`/league/${leagueId}`)
  },

  getMatchups(leagueId, week) {
    return get(`/league/${leagueId}/matchups/${week}`)
  },

  getRosters(leagueId) {
    return get(`/league/${leagueId}/rosters`)
  },

  getUsers(leagueId) {
    return get(`/league/${leagueId}/users`)
  },

  getUser(userId) {
    return get(`/user/${userId}`)
  },

  /** Build avatar URL from a Sleeper user_id or avatar hash */
  avatarUrl(avatarId) {
    if (!avatarId) return null
    return `https://sleepercdn.com/avatars/thumbs/${avatarId}`
  }
}

export default SleeperService
