import { describe, expect, it } from 'vitest'
import { profileSchema, toProfilePatch } from './profileSchema'

const parse = (displayName: string, upiVpa = '') => profileSchema.safeParse({ displayName, upiVpa })

describe('profileSchema', () => {
  it('trims the name', () => {
    expect(parse('  Asha Rao  ').data?.displayName).toBe('Asha Rao')
  })

  it.each(['', '   ', 'x'.repeat(61)])('rejects name %j', (name) => {
    expect(parse(name).success).toBe(false)
  })

  it('accepts a 60-character name', () => {
    expect(parse('x'.repeat(60)).success).toBe(true)
  })

  it.each(['asha@okaxis', 'asha.rao-1_2@ybl', '9876543210@paytm', '  asha@okicici  ', ''])(
    'accepts UPI ID %j',
    (vpa) => {
      expect(parse('Asha', vpa).success).toBe(true)
    },
  )

  it.each([
    'asha',
    'a@okaxis',
    'asha@',
    '@okaxis',
    'asha@1bank',
    'asha@o',
    'as ha@okaxis',
    'asha@ok.axis',
    `${'a'.repeat(257)}@okaxis`,
  ])('rejects UPI ID %j', (vpa) => {
    expect(parse('Asha', vpa).success).toBe(false)
  })
})

describe('toProfilePatch', () => {
  it('stores an empty UPI ID as null', () => {
    expect(toProfilePatch({ displayName: 'Asha', upiVpa: '' })).toEqual({
      display_name: 'Asha',
      upi_vpa: null,
    })
  })

  it('keeps a UPI ID', () => {
    expect(toProfilePatch({ displayName: 'Asha', upiVpa: 'asha@okaxis' }).upi_vpa).toBe(
      'asha@okaxis',
    )
  })
})
