import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { GradientButton } from '@/components/ui/GradientButton';

type Mission = {
  id: string
  title: string
  description: string | null
  category: string
  mission_type: string
  status: string
  budget_min: number | null
  budget_max: number | null
  location: string | null
  start_date: string | null
  duration_days: number | null
  created_at: string
  studio_id: string
  profiles: { company_name: string | null } | null
}

type ApplicationStatus = 'idle' | 'submitting' | 'submitted' | 'already_applied' | 'error'

function missionTypeBadgeClass(type: string): string {
  if (type === 'on_site') return 'bg-orange-500/20 text-orange-300 border border-orange-400/30';
  if (type === 'hybrid') return 'bg-violet-500/20 text-violet-300 border border-violet-400/30';
  return 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30';
}

function missionTypeLabel(type: string): string {
  if (type === 'on_site') return 'Sur site';
  if (type === 'hybrid') return 'Hybride';
  return 'Remote';
}

function budgetText(mission: Mission): string {
  if (mission.budget_min !== null && mission.budget_max !== null) {
    return `${mission.budget_min}€ – ${mission.budget_max}€/j`;
  }
  if (mission.budget_min !== null) {
    return `À partir de ${mission.budget_min}€/j`;
  }
  return 'Budget non précisé';
}

export default function MissionDetail() {
  const { missionId, id } = useParams<{ missionId?: string; id?: string }>();
  const targetMissionId = missionId ?? id ?? '';
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('idle');
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchMission = async () => {
      if (!targetMissionId) {
        if (!active) return;
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);
      setApplicationStatus('idle');

      try {
        const { data: missionData } = await supabase
          .from('missions')
          .select(`
            id, title, description, category, mission_type, status,
            budget_min, budget_max, location, start_date, duration_days,
            created_at, studio_id,
            profiles:studio_id (company_name)
          `)
          .eq('id', targetMissionId)
          .single();

        if (!active) return;

        if (!missionData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setMission(missionData as unknown as Mission);

        if (userId) {
          const { data: existing } = await supabase
            .from('applications')
            .select('id')
            .eq('mission_id', targetMissionId)
            .eq('pro_id', userId)
            .maybeSingle();

          if (!active) return;
          if (existing) {
            setApplicationStatus('already_applied');
          }
        }
      } catch {
        if (!active) return;
        setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchMission();

    return () => {
      active = false;
    };
  }, [targetMissionId, userId]);

  const handleApply = async () => {
    if (!targetMissionId || !userId || applicationStatus === 'submitting') return;

    if (coverLetter.trim().length < 20) {
      setFormError('Message trop court (minimum 20 caractères)');
      return;
    }
    if (proposedRate && (Number.isNaN(Number(proposedRate)) || Number(proposedRate) <= 0)) {
      setFormError('Tarif invalide');
      return;
    }

    setFormError(null);
    setApplicationStatus('submitting');

    const { error } = await supabase
      .from('applications')
      .insert({
        mission_id: targetMissionId,
        pro_id: userId,
        cover_letter: coverLetter.trim(),
        proposed_rate: proposedRate ? Number(proposedRate) : null,
        status: 'pending',
      } as never);

    if (error) {
      setFormError(error.message);
      setApplicationStatus('error');
    } else {
      setApplicationStatus('submitted');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-white flex items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  if (notFound || !mission) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-white flex items-center justify-center px-4">
        <p className="text-white/50">Mission introuvable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate('/pro/feed')}
          className="text-white/50 hover:text-white text-sm mb-6 flex items-center gap-1"
        >
          ← Retour au feed
        </button>

        <header>
          <h1 className="text-3xl font-bold mb-1">{mission.title}</h1>
          <p className="text-white/50 text-sm">{mission.profiles?.company_name ?? 'Studio inconnu'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{mission.category}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${missionTypeBadgeClass(mission.mission_type)}`}>
              {missionTypeLabel(mission.mission_type)}
            </span>
            {mission.status !== 'open' ? (
              <span className="rounded-full bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 text-xs font-medium">
                Mission fermée
              </span>
            ) : null}
          </div>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-xl p-5 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Budget</p>
              <p className="text-white/80">{budgetText(mission)}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Localisation</p>
              <p className="text-white/80">{mission.location ?? 'Non précisée'}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Date de début</p>
              <p className="text-white/80">
                {mission.start_date ? new Date(mission.start_date).toLocaleDateString('fr-FR') : 'À définir'}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Durée</p>
              <p className="text-white/80">
                {mission.duration_days ? `${mission.duration_days} jour(s)` : 'Non précisée'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Publiée le</p>
              <p className="text-white/80">{new Date(mission.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </section>

        {mission.description ? (
          <section className="bg-white/5 border border-white/10 rounded-xl p-5 mt-4">
            <h2 className="text-sm font-semibold text-white mb-2">Description</h2>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
              {mission.description}
            </p>
          </section>
        ) : null}

        <section className="bg-white/5 border border-white/10 rounded-xl p-5 mt-4">
          <h2 className="text-sm font-semibold text-white mb-3">Postuler à cette mission</h2>

          {applicationStatus === 'already_applied' ? (
            <div className="text-center py-4">
              <p className="text-green-400 font-medium">✓ Tu as déjà postulé à cette mission</p>
              <p className="text-white/40 text-sm mt-1">Ta candidature est en cours de traitement.</p>
            </div>
          ) : null}

          {applicationStatus === 'submitted' ? (
            <div className="text-center py-4">
              <p className="text-green-400 font-medium">✓ Candidature envoyée !</p>
              <p className="text-white/40 text-sm mt-1">Le studio a été notifié.</p>
              <button
                type="button"
                onClick={() => navigate('/pro/dashboard')}
                className="text-violet-400 underline text-sm mt-3 block mx-auto"
              >
                Voir mes candidatures
              </button>
            </div>
          ) : null}

          {applicationStatus !== 'already_applied' && applicationStatus !== 'submitted' && mission.status !== 'open' ? (
            <p className="text-white/40 text-sm text-center py-4">
              Cette mission n&apos;accepte plus de candidatures.
            </p>
          ) : null}

          {applicationStatus !== 'already_applied' && applicationStatus !== 'submitted' && mission.status === 'open' ? (
            <div>
              <label className="text-sm text-white/80 block mb-2" htmlFor="cover-letter">
                Ton message au studio *
              </label>
              <textarea
                id="cover-letter"
                rows={4}
                maxLength={500}
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
                placeholder="Présente-toi et explique pourquoi tu es le bon profil..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <p className="text-xs text-white/30 text-right mt-1">{coverLetter.length}/500</p>

              <label className="text-sm text-white/80 block mt-4 mb-2" htmlFor="proposed-rate">
                Ton tarif journalier (€)
              </label>
              <input
                id="proposed-rate"
                type="number"
                value={proposedRate}
                onChange={(event) => setProposedRate(event.target.value)}
                placeholder="ex: 300"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />

              {formError ? <p className="text-red-400 text-xs mt-2">{formError}</p> : null}

              <div className="mt-4">
                <GradientButton
                  onClick={handleApply}
                  disabled={applicationStatus === 'submitting'}
                >
                  {applicationStatus === 'submitting' ? 'Envoi...' : 'Envoyer ma candidature'}
                </GradientButton>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
