import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Helmet } from 'react-helmet-async'
import { getInvitationByCode } from '@/services/invitationService'

type Invitation = {
  id: string
  code: string
  type: 'studio' | 'pro'
  email: string | null
  used: boolean
  expires_at: string | null
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

      const normalizedCode = code.trim().toUpperCase()

      if (cancelled) return

      const row = await getInvitationByCode(normalizedCode)
      if (cancelled) return

      if (!row) {
        setState('invalid')
        return
      }

      const normalized: Invitation = {
        id: row.id,
        code: row.code,
        type: row.invitation_type,
        email: row.email ?? null,
        used: Boolean(row.used),
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

    void navigate('/login?mode=signup', {
      state: {
        mode: 'signup',
        type: invitation.type,
        code: invitation.code,
        email: invitation.email,
      },
    })
  }

  return (
    <div className="app-shell flex items-center justify-center">
      <Helmet>
        <title>Invitation — StudioLink</title>
        <meta
          name="description"
          content="Valide ton lien d'invitation StudioLink pour rejoindre la plateforme."
        />
        <meta property="og:title" content="Invitation — StudioLink" />
        <meta
          property="og:description"
          content="Valide ton invitation et crée ton compte StudioLink."
        />
      </Helmet>
      <div className="max-w-md w-full mx-auto px-4">
        <div className="app-card p-8">
          {state === 'loading' ? (
            <div className="text-center">
              <span className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black/70 inline-block" />
              <p className="text-stone-500 text-sm">Vérification de l&apos;invitation...</p>
            </div>
          ) : null}

          {state === 'invalid' ? (
            <div className="text-center">
              <p className="text-4xl mb-4">❌</p>
              <h2 className="text-xl font-bold text-black mb-2">Lien invalide</h2>
              <p className="text-stone-500 text-sm">Ce lien d&apos;invitation n&apos;existe pas ou a été supprimé.</p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-orange-600 underline text-sm mt-4"
              >
                Retour à l&apos;accueil
              </button>
            </div>
          ) : null}

          {state === 'used' ? (
            <div className="text-center">
              <p className="text-4xl mb-4">🔒</p>
              <h2 className="text-xl font-bold text-black mb-2">Invitation déjà utilisée</h2>
              <p className="text-stone-500 text-sm">Ce lien a déjà été utilisé pour créer un compte.</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-orange-600 underline text-sm mt-4"
              >
                Se connecter
              </button>
            </div>
          ) : null}

          {state === 'expired' ? (
            <div className="text-center">
              <p className="text-4xl mb-4">⏰</p>
              <h2 className="text-xl font-bold text-black mb-2">Invitation expirée</h2>
              <p className="text-stone-500 text-sm">Ce lien d&apos;invitation n&apos;est plus valide.</p>
            </div>
          ) : null}

          {state === 'valid' && invitation ? (
            <div className="text-center">
              <p className="text-4xl mb-4">
                {invitation.type === 'studio' ? '🎬' : '🎨'}
              </p>
              <h2 className="text-2xl font-bold text-black mb-2">
                {invitation.type === 'studio'
                  ? 'Bienvenue sur StudioLink'
                  : 'Rejoins StudioLink en tant que Pro'}
              </h2>
              <p className="text-stone-500 text-sm mb-6">
                {invitation.type === 'studio'
                  ? 'Publie tes missions et trouve les meilleurs créatifs.'
                  : 'Découvre des missions et collabore avec les meilleurs studios.'}
              </p>
              <p className="text-stone-600 text-sm mb-4">
                Code d&apos;invitation : <span className="text-black font-mono">{invitation.code}</span>
              </p>
              {invitation.email ? (
                <p className="text-stone-500 text-xs mb-4">
                  Invitation réservée à : {invitation.email}
                </p>
              ) : null}
              <Button
                onClick={handleAccept}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                Créer mon compte →
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
