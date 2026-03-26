import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/shared/PageMeta';

export default function PrivacyPage() {
  return (
    <div className="app-shell min-h-[100dvh] px-4 py-8">
      <PageMeta
        title="Politique de confidentialite"
        description="Politique de confidentialite RGPD de StudioLink Paris."
        canonicalPath="/legal/privacy"
      />
      <main className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Politique de confidentialite</h1>
          <p className="text-sm text-white/60">Derniere mise a jour : 26 mars 2026</p>
        </header>

        <section className="app-card p-5 space-y-4 text-sm text-white/75">
          <h2 className="text-lg font-semibold text-white">1. Qui sommes-nous</h2>
          <p>
            StudioLink Paris est une plateforme de mise en relation entre studios creatifs et professionnels
            independants (ci-apres « StudioLink »).
          </p>

          <h2 className="text-lg font-semibold text-white">2. Donnees collectees</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Compte : email, nom affiche, photo de profil, role (studio/pro).</li>
            <li>Profil pro : competences, tarif, bio, localisation.</li>
            <li>Activite : missions creees/consultees, candidatures, messages, fichiers uploades.</li>
            <li>Technique : adresse IP, user-agent, cookies de session.</li>
          </ul>

          <h2 className="text-lg font-semibold text-white">3. Finalites</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Mise en relation studios/professionnels.</li>
            <li>Authentification et gestion du compte.</li>
            <li>Notifications de suivi de collaboration.</li>
            <li>Amelioration continue du service.</li>
          </ul>

          <h2 className="text-lg font-semibold text-white">4. Base legale</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Execution du contrat : creation et usage du compte.</li>
            <li>Consentement : cookies analytiques et mesure d’usage.</li>
            <li>Interet legitime : securite, prevention de la fraude et stabilite de la plateforme.</li>
          </ul>

          <h2 className="text-lg font-semibold text-white">5. Sous-traitants</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Supabase Inc. (USA/EU) : base de donnees, authentification, stockage.</li>
            <li>Vercel Inc. (USA/EU) : hebergement frontend.</li>
            <li>Sentry (USA/EU) : monitoring erreurs (donnees anonymisees).</li>
            <li>PostHog (EU) : analytics (donnees pseudonymisees).</li>
            <li>Resend (USA/EU) : emails transactionnels (ajout phase 4).</li>
          </ul>

          <h2 className="text-lg font-semibold text-white">6. Duree de conservation</h2>
          <p>Les donnees sont conservees pendant la duree de vie du compte puis jusqu’a 2 ans apres la derniere connexion.</p>

          <h2 className="text-lg font-semibold text-white">7. Vos droits</h2>
          <p>
            Vous disposez des droits d’acces, de rectification, de suppression, de portabilite et d’opposition.
            Pour exercer ces droits : privacy@studiolink-paris.fr
          </p>

          <h2 className="text-lg font-semibold text-white">8. Suppression de compte</h2>
          <p>
            La suppression est disponible depuis Parametres &gt; Compte. Cette action est irreversible et
            entraine la suppression des donnees associees.
          </p>

          <h2 className="text-lg font-semibold text-white">9. Cookies</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Cookies de session : necessaires au fonctionnement (sans consentement).</li>
            <li>Cookies analytiques : soumis a consentement explicite.</li>
          </ul>

          <h2 className="text-lg font-semibold text-white">10. Date de mise a jour</h2>
          <p>26 mars 2026.</p>
        </section>

        <div className="flex items-center gap-4 text-sm text-white/60">
          <Link className="underline underline-offset-2 hover:text-white" to="/legal/terms">
            Consulter les conditions d'utilisation
          </Link>
          <Link className="underline underline-offset-2 hover:text-white" to="/">
            Retour a l'accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
