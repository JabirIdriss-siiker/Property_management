import { expect, test, beforeEach } from 'vitest'
import { supabase } from './supabase_client'

beforeEach(async () => {
    await supabase.from('profiles').delete().neq('id', '')
})

test('sign up creates a profile row via trigger', async () => {
    const email = `test-${Date.now()}@example.com`
    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'Pass1234!',
    })

    expect(error).toBeNull()
    expect(data.user?.email).toBe(email)

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user?.id)
        .single()

    expect(profile).toBeTruthy()
})
