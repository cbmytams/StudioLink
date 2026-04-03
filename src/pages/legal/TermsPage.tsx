import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="app-shell min-h-[100dvh] px-4 py-8">
      <SEO
        title="Conditions d'utilisation"
        description="Conditions d'utilisation de StudioLink Paris."
        url="/legal/terms"
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
          <h1 className="text-3xl font-semibold text-white">Conditions d'utilisation</h1>
          <p className="text-sm text-white/60">Version du 3 avril 2026</p>
        </header>

        <nav className="app-card p-4 text-sm text-white/75">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Sommaire</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href="#terms-1" className="inline-flex min-h-[44px] items-center hover:underline">1. Objet</a>
            <a href="#terms-2" className="inline-flex min-h-[44px] items-center hover:underline">2. Définitions</a>
            <a href="#terms-3" className="inline-flex min-h-[44px] items-center hover:underline">3. Inscription</a>
            <a href="#terms-4" className="inline-flex min-h-[44px] items-center hover:underline">4. Obligations du Studio</a>
            <a href="#terms-5" className="inline-flex min-h-[44px] items-center hover:underline">5. Obligations du Pro</a>
            <a href="#terms-6" className="inline-flex min-h-[44px] items-center hover:underline">6. Propriete intellectuelle</a>
            <a href="#terms-7" className="inline-flex min-h-[44px] items-center hover:underline">7. Responsabilite</a>
            <a href="#terms-8" className="inline-flex min-h-[44px] items-center hover:underline">8. Suspension</a>
            <a href="#terms-9" className="inline-flex min-h-[44px] items-center hover:underline">9. Droit applicable</a>
            <a href="#terms-10" className="inline-flex min-h-[44px] items-center hover:underline">10. Date</a>
          </div>
        </nav>

        <section className="app-card space-y-4 p-5 text-sm leading-7 text-white/75">
          <h2 id="terms-1" className="scroll-mt-24 text-lg font-semibold text-white">1. Objet</h2>
          <p>StudioLink permet la mise en relation entre studios et professionnels creatifs.</p>

          <h2 id="terms-2" className="scroll-mt-24 text-lg font-semibold text-white">2. Définitions</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Studio : structure publiant des missions.</li>
            <li>Pro : professionnel candidatant aux missions.</li>
            <li>Mission : besoin formalise publie sur la plateforme.</li>
            <li>Session : espace de collaboration actif entre un Studio et un Pro.</li>
            <li>Plateforme : service StudioLink Paris.</li>
          </ul>

          <h2 id="terms-3" className="scroll-mt-24 text-lg font-semibold text-white">3. Inscription</h2>
          <p>L’inscription est reservee aux utilisateurs invites. Un compte unique est autorise par personne.</p>

          <h2 id="terms-4" className="scroll-mt-24 text-lg font-semibold text-white">4. Obligations du Studio</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Publier des missions conformes a la realite.</li>
            <li>Organiser le paiement direct hors plateforme (version V1).</li>
            <li>Fournir un feedback honnete en fin de collaboration.</li>
          </ul>

          <h2 id="terms-5" className="scroll-mt-24 text-lg font-semibold text-white">5. Obligations du Pro</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Maintenir un profil veridique.</li>
            <li>Respecter les delais de livraison convenus.</li>
            <li>Fournir des livrables conformes a la mission.</li>
          </ul>

          <h2 id="terms-6" className="scroll-mt-24 text-lg font-semibold text-white">6. Propriete intellectuelle</h2>
          <p>
            Sauf stipulation contraire entre les parties, le Pro cede les droits d’exploitation necessaires au Studio
            a la completion de la session. Les parties restent responsables de formaliser leur accord contractuel detaille.
          </p>

          <h2 id="terms-7" className="scroll-mt-24 text-lg font-semibold text-white">7. Responsabilite</h2>
          <p>
            StudioLink agit en qualite d’intermediaire technique. StudioLink n’est pas partie aux contrats conclus entre
            Studios et Pros.
          </p>

          <h2 id="terms-8" className="scroll-mt-24 text-lg font-semibold text-white">8. Suspension</h2>
          <p>
            StudioLink peut suspendre ou supprimer un compte en cas de fraude, abus, usurpation d’identite ou non-respect
            des presentes conditions.
          </p>

          <h2 id="terms-9" className="scroll-mt-24 text-lg font-semibold text-white">9. Droit applicable</h2>
          <p>Droit francais. Juridiction competente : Tribunal de Paris.</p>

          <h2 id="terms-10" className="scroll-mt-24 text-lg font-semibold text-white">10. Date</h2>
          <p>26 mars 2026.</p>
        </section>

        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
          <Link className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-white" to="/legal/privacy">
            Politique de confidentialité
          </Link>
          <Link className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-white" to="/">
            Retour à l'accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
