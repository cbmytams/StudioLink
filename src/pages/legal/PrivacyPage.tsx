import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';

export default function PrivacyPage() {
  const navigate = useNavigate();
  const summaryLinkClass = 'group inline-flex min-h-[var(--size-touch)] items-center justify-between rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-white/5 active:bg-[var(--color-surface-offset)]';
  const footerLinkClass = 'inline-flex min-h-[var(--size-touch)] items-center px-2 py-3 underline underline-offset-2 transition-colors hover:text-white';

  return (
    <div className="app-shell min-h-[var(--size-full-dvh)] px-4 py-8">
      <SEO
        title="Politique de confidentialité"
        description="Politique de confidentialité RGPD de StudioLink Paris."
        url="/legal/privacy"
      />
      <main className="mx-auto w-full max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex min-h-[var(--size-touch)] items-center px-2 py-3 text-sm text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
        >
          ← Retour
        </button>
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Politique de confidentialité</h1>
          <p className="text-sm text-white/60">Dernière mise à jour : 3 avril 2026</p>
        </header>

        <nav className="app-card p-4 text-sm text-white/75">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-white/45">Sommaire</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href="#privacy-1" className={summaryLinkClass}><span>1. Qui sommes-nous</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#privacy-2" className={summaryLinkClass}><span>2. Données collectées</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#privacy-3" className={summaryLinkClass}><span>3. Finalités</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#privacy-4" className={summaryLinkClass}><span>4. Base légale</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#privacy-5" className={summaryLinkClass}><span>5. Sous-traitants</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#privacy-6" className={summaryLinkClass}><span>6. Durée de conservation</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#privacy-7" className={summaryLinkClass}><span>7. Vos droits</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#privacy-8" className={summaryLinkClass}><span>8. Suppression de compte</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#privacy-9" className={summaryLinkClass}><span>9. Cookies</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#privacy-10" className={summaryLinkClass}><span>10. Date de mise à jour</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
          </div>
        </nav>

        <section className="app-card space-y-4 p-5 text-sm leading-7 text-white/75">
          <h2 id="privacy-1" className="scroll-mt-24 text-lg font-semibold text-white">1. Qui sommes-nous</h2>
          <p>
            StudioLink Paris est une plateforme de mise en relation entre studios creatifs et professionnels
            independants (ci-apres « StudioLink »).
          </p>

          <h2 id="privacy-2" className="scroll-mt-24 text-lg font-semibold text-white">2. Données collectées</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Compte : email, nom affiche, photo de profil, role (studio/pro).</li>
            <li>Profil pro : competences, tarif, bio, localisation.</li>
            <li>Activite : missions creees/consultees, candidatures, messages, fichiers uploades.</li>
            <li>Technique : adresse IP, user-agent, cookies de session.</li>
          </ul>

          <h2 id="privacy-3" className="scroll-mt-24 text-lg font-semibold text-white">3. Finalités</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Mise en relation studios/professionnels.</li>
            <li>Authentification et gestion du compte.</li>
            <li>Notifications de suivi de collaboration.</li>
            <li>Amelioration continue du service.</li>
          </ul>

          <h2 id="privacy-4" className="scroll-mt-24 text-lg font-semibold text-white">4. Base légale</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Execution du contrat : creation et usage du compte.</li>
            <li>Consentement : cookies analytiques et mesure d’usage.</li>
            <li>Interet legitime : securite, prevention de la fraude et stabilite de la plateforme.</li>
          </ul>

          <h2 id="privacy-5" className="scroll-mt-24 text-lg font-semibold text-white">5. Sous-traitants</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Supabase Inc. (USA/EU) : base de donnees, authentification, stockage.</li>
            <li>Vercel Inc. (USA/EU) : hebergement frontend.</li>
            <li>Sentry (USA/EU) : monitoring erreurs (donnees anonymisees).</li>
            <li>PostHog (EU) : analytics (donnees pseudonymisees).</li>
            <li>Resend (USA/EU) : emails transactionnels (ajout phase 4).</li>
          </ul>

          <h2 id="privacy-6" className="scroll-mt-24 text-lg font-semibold text-white">6. Durée de conservation</h2>
          <p>Les donnees sont conservees pendant la duree de vie du compte puis jusqu’a 2 ans apres la derniere connexion.</p>

          <h2 id="privacy-7" className="scroll-mt-24 text-lg font-semibold text-white">7. Vos droits</h2>
          <p>
            Vous disposez des droits d’acces, de rectification, de suppression, de portabilite et d’opposition.
            Pour exercer ces droits : privacy@studiolink-paris.fr
          </p>

          <h2 id="privacy-8" className="scroll-mt-24 text-lg font-semibold text-white">8. Suppression de compte</h2>
          <p>
            La suppression est disponible depuis Parametres &gt; Compte. Cette action est irreversible et
            entraine la suppression des donnees associees.
          </p>

          <h2 id="privacy-9" className="scroll-mt-24 text-lg font-semibold text-white">9. Cookies</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Cookies de session : necessaires au fonctionnement (sans consentement).</li>
            <li>Cookies analytiques : soumis a consentement explicite.</li>
          </ul>

          <h2 id="privacy-10" className="scroll-mt-24 text-lg font-semibold text-white">10. Date de mise à jour</h2>
          <p>26 mars 2026.</p>
        </section>

        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
          <Link className={footerLinkClass} to="/legal/terms">
            Consulter les conditions d'utilisation
          </Link>
          <Link className={footerLinkClass} to="/">
            Retour à l'accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
