import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button as GradientButton } from '@/components/ui/Button'

type Invitation = {
  id: string
  code: string
  type: 'studio' | 'pro'
  email: string | null
  used: boolean
  expires_at: string | null
  created_at: string
}

type InvitationRow = {
  id: string
  code: string
  type: 'studio' | 'pro'
  used_by: string | null
  expires_at: string
  created_at: string
}

type InvitationState = 'loading' | 'invalid' | 'used' | 'expired' | 'valid'

export default function InvitationLanding() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<InvitationState>('loading')
  const [invitation, setInvitation] = useState<Invitation | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchInvitation = async () => {
      if (!code) {
        setState('invalid')
        return
      }

      setState('loading')

      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('id, code, type, used_by, expires_at, created_at')
        .eq('code', code.trim().toUpperCase())
        .single()

      if (cancelled) return

      if (fetchError || !data) {
        setState('invalid')
        return
      }

      const row = data as unknown as InvitationRow
      const normalized: Invitation = {
        id: row.id,
        code: row.code,
        type: row.type,
        email: null,
        used: row.used_by !== null,
        expires_at: row.expires_at ?? null,
        created_at: row.created_at,
      }

      setInvitation(normalized)

      if (normalized.used) {
        setState('used')
        return
      }

      if (normalized.expires_at && new Date(normalized.expires_at) < new Date()) {
        setState('expired')
        return
      }

      setState('valid')
    }

    void fetchInvitation()

    return () => {
      cancelled = true
    }
  }, [code])

  const handleAccept = () => {
    if (!invitation) return

    sessionStorage.setItem('invitationCode', invitation.code)
    sessionStorage.setItem('invitationType', invitation.type)
    if (invitation.email) {
      sessionStorage.setItem('invitationEmail', invitation.email)
    }

    navigate('/login?mode=signup')
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {state === 'loading' ? (
            <div className="text-center">
              <span className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block" />
              <p className="text-white/70 text-sm">Vérification de l&apos;invitation...</p>
            </div>
          ) : null}

          {state === 'invalid' ? (
            <div className="text-center">
              <p className="text-4xl mb-4">❌</p>
              <h2 className="text-xl font-bold text-white mb-2">Lien invalide</h2>
              <p className="text-white/50 text-sm">Ce lien d&apos;invitation n&apos;existe pas ou a été supprimé.</p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-violet-400 underline text-sm mt-4"
              >
                Retour à l&apos;accueil
              </button>
            </div>
          ) : null}

          {state === 'used' ? (
            <div className="text-center">
              <p className="text-4xl mb-4">🔒</p>
              <h2 className="text-xl font-bold text-white mb-2">Invitation déjà utilisée</h2>
              <p className="text-white/50 text-sm">Ce lien a déjà été utilisé pour créer un compte.</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-violet-400 underline text-sm mt-4"
              >
                Se connecter
              </button>
            </div>
          ) : null}

          {state === 'expired' ? (
            <div className="text-center">
              <p className="text-4xl mb-4">⏰</p>
              <h2 className="text-xl font-bold text-white mb-2">Invitation expirée</h2>
              <p className="text-white/50 text-sm">Ce lien d&apos;invitation n&apos;est plus valide.</p>
            </div>
          ) : null}

          {state === 'valid' && invitation ? (
            <div className="text-center">
              <p className="text-4xl mb-4">
                {invitation.type === 'studio' ? '🎬' : '🎨'}
              </p>
              <h2 className="text-2xl font-bold text-white mb-2">
                {invitation.type === 'studio'
                  ? 'Bienvenue sur Frapppe Studio'
                  : 'Rejoins Frapppe en tant que Pro'}
              </h2>
              <p className="text-white/50 text-sm mb-6">
                {invitation.type === 'studio'
                  ? 'Publie tes missions et trouve les meilleurs créatifs.'
                  : 'Découvre des missions et collabore avec les meilleurs studios.'}
              </p>
              {invitation.email ? (
                <p className="text-white/40 text-xs mb-4">
                  Invitation réservée à : {invitation.email}
                </p>
              ) : null}
              <GradientButton
                onClick={handleAccept}
                className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95"
              >
                Créer mon compte →
              </GradientButton>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
