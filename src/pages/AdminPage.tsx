import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, UserX, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type InvitationType = 'studio' | 'pro';
type InvitationStatus = 'available' | 'used';
type Validity = 7 | 30 | 90 | 'unlimited';

interface InvitationCode {
  id: string;
  code: string;
  type: InvitationType;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

interface RegisteredUser {
  id: string;
  name: string;
  avatar: string;
  type: InvitationType;
  joinedAt: string;
}

interface ActiveMission {
  id: string;
  title: string;
  studio: string;
  serviceType: string;
  countdown: string;
  candidatesCount: number;
}

const INITIAL_INVITATION_CODES: InvitationCode[] = [
  { id: 'code-1', code: 'STUDIO7A2B', type: 'studio', status: 'available', expiresAt: '24 mars 2026', createdAt: '17 mars 2026' },
  { id: 'code-2', code: 'PRO8K1Z', type: 'pro', status: 'used', expiresAt: '17 avril 2026', createdAt: '10 mars 2026' },
  { id: 'code-3', code: 'STUDIOADM9', type: 'studio', status: 'available', expiresAt: 'Illimité', createdAt: '2 mars 2026' },
  { id: 'code-4', code: 'PROLIVE5', type: 'pro', status: 'used', expiresAt: '7 avril 2026', createdAt: '8 mars 2026' },
  { id: 'code-5', code: 'STUDIOLINK3', type: 'studio', status: 'available', expiresAt: '16 juin 2026', createdAt: '16 mars 2026' },
  { id: 'code-6', code: 'PROPARIS2', type: 'pro', status: 'available', expiresAt: '24 mars 2026', createdAt: '17 mars 2026' }
];

const REGISTERED_USERS: RegisteredUser[] = [
  { id: 'u-1', name: 'Studio Grande Armée', avatar: 'https://picsum.photos/seed/studio-ga/80/80', type: 'studio', joinedAt: '12 mars 2026' },
  { id: 'u-2', name: 'Studio Pigalle Records', avatar: 'https://picsum.photos/seed/studio-pr/80/80', type: 'studio', joinedAt: '9 mars 2026' },
  { id: 'u-3', name: 'Studio Opéra', avatar: 'https://picsum.photos/seed/studio-op/80/80', type: 'studio', joinedAt: '2 mars 2026' },
  { id: 'u-4', name: 'La Fabrique 18', avatar: 'https://picsum.photos/seed/studio-lf/80/80', type: 'studio', joinedAt: '26 février 2026' },
  { id: 'u-5', name: 'Alexandre M.', avatar: 'https://i.pravatar.cc/80?img=3', type: 'pro', joinedAt: '14 mars 2026' },
  { id: 'u-6', name: 'Sarah K.', avatar: 'https://i.pravatar.cc/80?img=5', type: 'pro', joinedAt: '13 mars 2026' },
  { id: 'u-7', name: 'Karim D.', avatar: 'https://i.pravatar.cc/80?img=8', type: 'pro', joinedAt: '11 mars 2026' },
  { id: 'u-8', name: 'Jules T.', avatar: 'https://i.pravatar.cc/80?img=11', type: 'pro', joinedAt: '7 mars 2026' },
  { id: 'u-9', name: 'Maya R.', avatar: 'https://i.pravatar.cc/80?img=21', type: 'pro', joinedAt: '4 mars 2026' },
  { id: 'u-10', name: 'Nassim B.', avatar: 'https://i.pravatar.cc/80?img=33', type: 'pro', joinedAt: '28 février 2026' }
];

const ACTIVE_MISSIONS: ActiveMission[] = [
  { id: 'm-1', title: 'Mixage EP 5 titres', studio: 'Studio Grande Armée', serviceType: 'Mixage', countdown: 'Expire dans 2h', candidatesCount: 12 },
  { id: 'm-2', title: 'Enregistrement Voix Lead', studio: 'Studio Pigalle Records', serviceType: 'Enregistrement', countdown: 'Expire dans 9h', candidatesCount: 5 },
  { id: 'm-3', title: 'Toplining Pop', studio: 'Studio Opéra', serviceType: 'Toplining', countdown: 'Expire dans 22h', candidatesCount: 8 },
  { id: 'm-4', title: 'Beatmaking Afrobeat', studio: 'Studio Grande Armée', serviceType: 'Beatmaking', countdown: 'Expire dans 1j 4h', candidatesCount: 18 }
];

function generateCode(type: InvitationType) {
  const prefix = type === 'studio' ? 'STUDIO' : 'PRO';
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}${suffix}`;
}

function getExpirationLabel(validity: Validity) {
  if (validity === 'unlimited') return 'Illimité';
  const date = new Date();
  date.setDate(date.getDate() + validity);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AdminPage() {
  const [codes, setCodes] = useState<InvitationCode[]>(INITIAL_INVITATION_CODES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countToGenerate, setCountToGenerate] = useState(6);
  const [targetType, setTargetType] = useState<InvitationType>('studio');
  const [validity, setValidity] = useState<Validity>(30);

  const usedCount = useMemo(() => codes.filter((c) => c.status === 'used').length, [codes]);
  const availableCount = useMemo(() => codes.filter((c) => c.status === 'available').length, [codes]);

  const generateCodes = () => {
    const nowLabel = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const expiresAt = getExpirationLabel(validity);
    const newCodes: InvitationCode[] = Array.from({ length: countToGenerate }, (_, index) => ({
      id: `code-generated-${Date.now()}-${index}`,
      code: generateCode(targetType),
      type: targetType,
      status: 'available',
      expiresAt,
      createdAt: nowLabel
    }));

    setCodes((prev) => [...newCodes, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-[#111827]">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <header className="mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-[#4b5563] mt-1">
            Gestion des invitations, utilisateurs et missions en cours.
          </p>
        </header>

        <section className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm mb-6 md:mb-8">
          <div className="p-5 md:p-6 border-b border-[#eef0f2] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Codes d&apos;invitation</h2>
              <p className="text-xs text-[#6b7280] mt-1">
                {availableCount} disponibles · {usedCount} utilisés
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827] text-white text-sm font-medium hover:bg-black transition-colors"
            >
              <Plus size={16} />
              Générer des codes
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[#6b7280] border-b border-[#eef0f2]">
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Expire le</th>
                  <th className="px-5 py-3 font-semibold">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <motion.tr
                    key={code.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-[#f1f5f9] last:border-0"
                  >
                    <td className="px-5 py-3 text-sm font-mono font-semibold text-[#111827]">{code.code}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide",
                        code.type === 'studio' ? "bg-[#e0f2fe] text-[#0369a1]" : "bg-[#f3e8ff] text-[#7e22ce]"
                      )}>
                        {code.type === 'studio' ? 'Studio' : 'Pro'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-semibold",
                        code.status === 'available' ? "bg-[#dcfce7] text-[#166534]" : "bg-[#f3f4f6] text-[#374151]"
                      )}>
                        {code.status === 'available' ? 'Disponible' : 'Utilisé'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#374151]">{code.expiresAt}</td>
                    <td className="px-5 py-3 text-sm text-[#374151]">{code.createdAt}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm mb-6 md:mb-8">
          <div className="p-5 md:p-6 border-b border-[#eef0f2]">
            <h2 className="text-lg font-semibold">Utilisateurs inscrits</h2>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {REGISTERED_USERS.map((user) => (
              <div key={user.id} className="px-5 md:px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#e5e7eb]"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">{user.name}</p>
                    <p className="text-xs text-[#6b7280]">Inscrit le {user.joinedAt}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
                    user.type === 'studio' ? "bg-[#e0f2fe] text-[#0369a1]" : "bg-[#f3e8ff] text-[#7e22ce]"
                  )}>
                    {user.type}
                  </span>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#dc2626] hover:text-[#b91c1c] transition-colors shrink-0"
                >
                  <UserX size={14} />
                  Suspendre
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm">
          <div className="p-5 md:p-6 border-b border-[#eef0f2]">
            <h2 className="text-lg font-semibold">Missions en cours</h2>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {ACTIVE_MISSIONS.map((mission) => (
              <div key={mission.id} className="px-5 md:px-6 py-4 grid grid-cols-1 md:grid-cols-[2fr_1.4fr_1fr_1fr_auto] gap-2 md:gap-4 items-center">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{mission.title}</p>
                  <p className="text-xs text-[#6b7280]">{mission.studio}</p>
                </div>
                <p className="text-sm text-[#374151]">{mission.serviceType}</p>
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b7280]">
                  <Clock size={13} />
                  {mission.countdown}
                </p>
                <p className="text-xs text-[#6b7280]">{mission.candidatesCount} candidats</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="w-full max-w-md bg-white rounded-2xl border border-[#e5e7eb] shadow-xl p-5 md:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Générer des codes</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] transition-colors flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">Nombre de codes</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCountToGenerate((prev) => Math.max(1, prev - 1))}
                      className="w-9 h-9 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] transition-colors text-lg"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={countToGenerate}
                      onChange={(e) => {
                        const raw = Number(e.target.value) || 1;
                        setCountToGenerate(Math.max(1, Math.min(50, raw)));
                      }}
                      className="w-20 h-9 text-center rounded-lg border border-[#d1d5db] bg-white text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setCountToGenerate((prev) => Math.min(50, prev + 1))}
                      className="w-9 h-9 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] transition-colors text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['studio', 'pro'] as InvitationType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTargetType(type)}
                        className={cn(
                          "h-10 rounded-lg border text-sm font-medium transition-colors",
                          targetType === type
                            ? "bg-[#111827] text-white border-[#111827]"
                            : "bg-white border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]"
                        )}
                      >
                        {type === 'studio' ? 'Studio' : 'Pro'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">Durée de validité</label>
                  <select
                    value={validity}
                    onChange={(e) => {
                      const value = e.target.value;
                      setValidity(value === 'unlimited' ? 'unlimited' : (Number(value) as 7 | 30 | 90));
                    }}
                    className="w-full h-10 rounded-lg border border-[#d1d5db] px-3 text-sm"
                  >
                    <option value={7}>7 jours</option>
                    <option value={30}>30 jours</option>
                    <option value={90}>90 jours</option>
                    <option value="unlimited">Illimité</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={generateCodes}
                  className="mt-2 h-11 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-black transition-colors"
                >
                  Générer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
