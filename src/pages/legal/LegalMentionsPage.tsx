import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';

export default function LegalMentionsPage() {
  const navigate = useNavigate();

  return (
    <div className="app-shell min-h-[100dvh] px-4 py-8">
      <SEO
        title="Mentions legales"
        description="Mentions legales de StudioLink Paris."
        url="/legal/mentions"
      />
      <main className="mx-auto w-full max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex min-h-[44px] items-center px-1 text-sm text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
        >
          ← Retour
        </button>
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Mentions legales</h1>
          <p className="text-sm text-white/60">Derniere mise a jour : 26 mars 2026</p>
        </header>

        <nav className="app-card p-4 text-sm text-white/75">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Sommaire</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href="#mentions-1" className="hover:underline">1. Editeur du site</a>
            <a href="#mentions-2" className="hover:underline">2. Hebergement</a>
            <a href="#mentions-3" className="hover:underline">3. Infrastructure & base de donnees</a>
            <a href="#mentions-4" className="hover:underline">4. Propriete intellectuelle</a>
            <a href="#mentions-5" className="hover:underline">5. Donnees personnelles</a>
          </div>
        </nav>

        <section className="app-card space-y-4 p-5 text-sm leading-7 text-white/75">
          <h2 id="mentions-1" className="scroll-mt-24 text-lg font-semibold text-white">1. Editeur du site</h2>
          <p>StudioLink Paris</p>
          <p>Forme juridique : [A COMPLETER]</p>
          <p>Siege social : [A COMPLETER]</p>
          <p>SIRET : [A COMPLETER]</p>
          <p>Contact : contact@studiolink-paris.fr</p>
          <p>Directeur de la publication : [A COMPLETER]</p>

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
            <Link className="underline underline-offset-2 hover:text-white" to="/legal/privacy">
              Politique de confidentialite
            </Link>
            .
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
          <Link className="underline underline-offset-2 hover:text-white" to="/legal/privacy">
            Politique de confidentialite
          </Link>
          <Link className="underline underline-offset-2 hover:text-white" to="/legal/terms">
            Conditions d&apos;utilisation
          </Link>
          <Link className="underline underline-offset-2 hover:text-white" to="/">
            Retour a l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
