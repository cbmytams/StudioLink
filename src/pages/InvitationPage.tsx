import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { TextInput } from '@/components/ui/TextInput'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/auth/AuthProvider'

export default function InvitationPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { session, profile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading || !session) return
    if (profile?.user_type === 'studio') {
      navigate('/studio/dashboard', { replace: true })
      return
    }
    navigate('/pro/feed', { replace: true })
  }, [authLoading, navigate, profile?.user_type, session])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const normalizedCode = code.trim().toUpperCase()

    if (normalizedCode === '') {
      setError("Entre un code d'invitation")
      return
    }

    if (normalizedCode.length < 6) {
      setError('Code trop court')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: sbError } = await supabase
        .from('invitations')
        .select('id, type, used_by, expires_at')
        .eq('code', normalizedCode)
        .single()

      if (sbError || !data) {
        setError('Code invalide ou introuvable')
        return
      }

      if (data.used_by !== null) {
        setError('Ce code a déjà été utilisé')
        return
      }

      if (new Date(data.expires_at).getTime() < Date.now()) {
        setError('Ce code est expiré')
        return
      }

      sessionStorage.setItem('invitationCode', normalizedCode)
      sessionStorage.setItem('invitationType', data.type)
      navigate('/login')
    } catch {
      setError('Code invalide ou introuvable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D0D0F] p-4">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-400/30 blur-3xl" />

      <GlassCard className="relative z-10 w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold text-white">StudioLink Paris</h1>
          <p className="text-sm text-white/70">Entre ton code d&apos;invitation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              if (error) setError(null)
            }}
            placeholder="Entre ton code d'invitation"
            autoCapitalize="characters"
            maxLength={12}
            className="uppercase tracking-[0.18em] text-center text-white placeholder:text-white/45"
          />

          {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block mr-2" />
                Vérification...
              </>
            ) : (
              'Rejoindre →'
            )}
          </Button>
        </form>
      </GlassCard>
    </div>
  )
}
