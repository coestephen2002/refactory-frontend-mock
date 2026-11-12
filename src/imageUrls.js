import { useMockApi } from './apiMode'

const fallback = `${import.meta.env.BASE_URL}mock-avatar.svg`
export const profileIcon = id => useMockApi ? fallback : `https://ddragon.leagueoflegends.com/cdn/15.16.1/img/profileicon/${id}.png`
export const championIcon = name => useMockApi ? fallback : `https://ddragon.leagueoflegends.com/cdn/15.16.1/img/champion/${name}.png`
export const championSplash = name => useMockApi ? fallback : `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${name}_0.jpg`
