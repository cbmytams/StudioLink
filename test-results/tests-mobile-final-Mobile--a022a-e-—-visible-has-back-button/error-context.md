# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Aller au contenu" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - heading "404" [level=1] [ref=e8]
        - generic [ref=e9]: Page introuvable
      - paragraph [ref=e10]: L'URL que vous recherchez semble incorrecte ou la page a été déplacée. Reprenons une connexion plus stable.
      - generic [ref=e11]:
        - link "Retour à l'accueil" [ref=e12] [cursor=pointer]:
          - /url: /
          - img [ref=e13]
          - text: Retour à l'accueil
        - link "Contacter l'agence" [ref=e16] [cursor=pointer]:
          - /url: /questionnaire/brands
          - text: Contacter l'agence
          - img [ref=e17]
  - generic [ref=e20]:
    - generic [ref=e21]:
      - text: Nous utilisons des cookies pour améliorer l'expérience et mesurer la performance. Consultez notre
      - link "politique cookies" [ref=e22] [cursor=pointer]:
        - /url: /legal/cookies
      - text: .
    - generic [ref=e23]:
      - button "Refuser" [ref=e24]
      - button "Accepter" [ref=e25]
  - button "Open Next.js Dev Tools" [ref=e31] [cursor=pointer]:
    - img [ref=e32]
  - alert [ref=e35]
```