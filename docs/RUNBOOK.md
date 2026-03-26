# StudioLink - Runbook operationnel

## Rollback Vercel (< 2 min)

En cas de deploiement problematique :

1. Aller sur https://vercel.com/dashboard
2. Projet studiolink-paris -> Deployments
3. Trouver le dernier deploiement stable (avant le probleme)
4. Cliquer sur "..." -> "Redeploy"
5. Confirmer le redeploiement

Delai estime : 1-2 minutes

## Rollback Git

```bash
git log --oneline -10
git revert HEAD
git push origin main
```

## Incident Supabase DB

1. Dashboard Supabase -> Settings -> Database
2. Onglet "Backups" -> Choisir le dernier backup sain
3. "Restore" -> Confirmer

Attention : restaure toute la base et supprime les donnees ajoutees depuis le backup.

## Incident Auth (utilisateurs bloques)

Symptome : utilisateurs ne peuvent plus se connecter.

1. Supabase Dashboard -> Authentication -> Users
2. Verifier les logs d'erreur dans Database -> Logs
3. Si JWT secret compromis :
   - Settings -> API -> Generate new JWT Secret
   - Attention : invalide toutes les sessions actives

## Monitoring

- Uptime : https://uptimerobot.com/dashboard
- Erreurs : https://sentry.io/organizations/studiolink/
- Analytics : https://eu.posthog.com/
- Supabase : https://supabase.com/dashboard/project/[ref]
- Vercel : https://vercel.com/dashboard

## SMTP Supabase Auth (etat)

- Provider cible : Gmail SMTP (smtp.gmail.com:587)
- Sender name : StudioLink
- Sender email : [A COMPLETER]
- Dernier test signup email : [A COMPLETER - date/heure]
- Resultat test (<30s) : [A COMPLETER - OK/KO]

Configuration dashboard (manuel) :
1. Supabase Dashboard -> Authentication -> Email -> SMTP Settings
2. Enable Custom SMTP = ON
3. Host `smtp.gmail.com`, Port `587`, User/Pass Gmail App Password
4. Mettre a jour templates FR : Confirm signup, Reset password, Magic link

## Securite Supabase (dashboard manuel)

1. SSL enforcement
- Database -> Settings -> SSL Configuration -> Enforce SSL = ON

2. Network restrictions
- Database -> Settings -> Network Restrictions
- Garder "Allow all" tant que les IPs Vercel ne sont pas stabilisees.
- Ne jamais bloquer les IPs internes Supabase.

3. MFA compte Supabase
- supabase.com -> Account -> Security -> Enable MFA
- Sauvegarder les recovery codes hors ligne.

4. Security Advisor
- Dashboard -> Advisors -> Security
- Corriger tous les warnings rouges immediatement.
- Basculer les warnings orange en backlog sprint 2.

## Contacts

- On-call dev : [ton numero]
- Supabase support : support@supabase.io
- Vercel support : https://vercel.com/support

## Checklist post-incident

- [ ] Incident resolu
- [ ] Cause identifiee (root cause)
- [ ] Utilisateurs affectes notifies
- [ ] Post-mortem redige (pour incidents > 30 min)
- [ ] Action corrective planifiee
