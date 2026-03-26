# Checklist Prise de Domaine

## Domaine suggéré
- studiolink.app (disponible ?)
- studiolink.fr (disponible ?)
- studiolink-paris.fr (disponible ?)

Vérifier sur:
- https://www.namecheap.com
- https://www.ovhcloud.com/fr/

## Une fois le domaine pris

### Vercel (hosting)
1. Vercel Dashboard -> `studiolink-paris` -> Settings -> Domains
2. Add Domain -> entrer le domaine
3. Ajouter le CNAME ou A record indiqué par Vercel dans le registrar DNS
4. Validation automatique + HTTPS

### Supabase Auth (redirect URLs)
1. Dashboard -> Authentication -> URL Configuration
2. Site URL -> `https://[domaine]`
3. Redirect URLs -> ajouter `https://[domaine]/**`

### Resend (emails)
1. Resend Dashboard -> Domains -> Add Domain
2. Ajouter les records DNS:
   - SPF: `TXT @ "v=spf1 include:amazonses.com ~all"`
   - DKIM: `TXT resend._domainkey [valeur Resend]`
   - DMARC: `TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@[domaine]"`
3. Vérifier le domaine dans Resend

### Mise à jour du code après domaine
Remplacer `studiolink-paris.vercel.app` par le domaine final dans:
- `src/components/SEO.tsx` (`BASE_URL`)
- `public/sitemap.xml`
- `public/robots.txt`

Commande utile:
```bash
grep -rn "studiolink-paris.vercel.app" src/ public/ --include="*.tsx" --include="*.ts" --include="*.xml" --include="*.txt"
```

### Variables d'environnement à mettre à jour
- Vercel -> Environment Variables:
  - `VITE_APP_URL=https://[domaine]`
- `.env.production`:
  - `VITE_APP_URL=https://[domaine]`

## DNS propagation
- Délai de propagation: 15 min à 48h
- Vérification: https://dnschecker.org
