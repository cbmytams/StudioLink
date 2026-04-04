import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';

export default function LegalMentionsPage() {
  const navigate = useNavigate();
  const summaryLinkClass = 'group inline-flex min-h-[var(--size-touch)] items-center justify-between rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-white/5 active:bg-[var(--color-surface-offset)]';
  const footerLinkClass = 'inline-flex min-h-[var(--size-touch)] items-center px-2 py-3 underline underline-offset-2 transition-colors hover:text-white';

  return (
    <div className="app-shell min-h-[var(--size-full-dvh)] px-4 py-8">
      <SEO
        title="Mentions légales"
        description="Mentions légales de StudioLink Paris."
        url="/legal/mentions"
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
          <h1 className="text-3xl font-semibold text-white">Mentions légales</h1>
          <p className="text-sm text-white/60">Dernière mise à jour : 3 avril 2026</p>
        </header>

        <nav className="app-card p-4 text-sm text-white/75">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-white/45">Sommaire</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href="#mentions-1" className={summaryLinkClass}><span>1. Editeur du site</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#mentions-2" className={summaryLinkClass}><span>2. Hebergement</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#mentions-3" className={summaryLinkClass}><span>3. Infrastructure & base de donnees</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#mentions-4" className={summaryLinkClass}><span>4. Propriete intellectuelle</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
            <a href="#mentions-5" className={summaryLinkClass}><span>5. Donnees personnelles</span><span aria-hidden className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5">›</span></a>
          </div>
        </nav>

        <section className="app-card space-y-4 p-5 text-sm leading-7 text-white/75">
          <h2 id="mentions-1" className="scroll-mt-24 text-lg font-semibold text-white">1. Editeur du site</h2>
          <p>StudioLink Paris</p>
          <p>Forme juridique : SAS en cours d&apos;immatriculation</p>
          <p>Siege social : Paris, France</p>
          <p>SIRET : En cours d&apos;immatriculation</p>
          <p>Contact : contact@studiolink-paris.fr</p>
          <p>Directeur de la publication : Direction StudioLink Paris</p>

          <h2 id="mentions-2" className="scroll-mt-24 text-lg font-semibold text-white">2. Hebergement</h2>
          <p>Ce site est heberge par :</p>
          <p><strong>Vercel Inc.</strong></p>
          <p>340 Pine Street, Suite 701</p>
          <p>San Francisco, CA 94104, Etats-Unis</p>
          <p>Site web : vercel.com</p>

          <h2 id="mentions-3" className="scroll-mt-24 text-lg font-semibold text-white">3. Infrastructure & base de donnees</h2>
          <p><strong>Supabase Inc.</strong></p>
          <p>San Francisco, CA, Etats-Unis</p>
          <p>Site web : supabase.com</p>

          <h2 id="mentions-4" className="scroll-mt-24 text-lg font-semibold text-white">4. Propriete intellectuelle</h2>
          <p>
            L&apos;ensemble de ce site (structure, textes, logos, images) est protege par le droit d&apos;auteur.
            Toute reproduction sans autorisation prealable est interdite.
          </p>

          <h2 id="mentions-5" className="scroll-mt-24 text-lg font-semibold text-white">5. Donnees personnelles</h2>
          <p>
            Pour toute question relative au traitement de vos donnees personnelles, consultez notre{' '}
            <Link className="inline-flex min-h-[var(--size-touch)] items-center underline underline-offset-2 hover:text-white" to="/legal/privacy">
              Politique de confidentialite
            </Link>
            .
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
          <Link className={footerLinkClass} to="/legal/privacy">
            Politique de confidentialité
          </Link>
          <Link className={footerLinkClass} to="/legal/terms">
            Conditions d&apos;utilisation
          </Link>
          <Link className={footerLinkClass} to="/">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
