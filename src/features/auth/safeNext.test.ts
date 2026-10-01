import { beforeEach, describe, expect, it } from 'vitest'
import { rememberNext, safeNext, takeNext } from './safeNext'

describe('safeNext', () => {
  it.each([
    ['/groups/abc?tab=balances', '/groups/abc?tab=balances'],
    ['/', '/'],
    [null, '/'],
    ['', '/'],
    ['https://evil.example', '/'],
    ['//evil.example', '/'],
    ['/\\evil.example', '/'],
    ['javascript:alert(1)', '/'],
    ['/login?next=/x', '/'],
    ['/auth/callback', '/'],
    ['/reset-password?code=x', '/'],
    ['/forgot-password', '/'],
    ['/login-help', '/login-help'],
  ])('%s → %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected)
  })
})

describe('rememberNext / takeNext', () => {
  beforeEach(() => sessionStorage.clear())

  it('round-trips a safe path once', () => {
    rememberNext('/friends')
    expect(takeNext()).toBe('/friends')
    expect(takeNext()).toBe('/')
  })

  it('never stores an unsafe path', () => {
    rememberNext('//evil.example')
    expect(takeNext()).toBe('/')
  })
})
