import { chromium } from '@playwright/test'

const BASE = 'http://localhost:5173'

const pagesToTest = [
  { path: '/', name: 'homepage' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/legal/privacy', name: 'privacy' },
  { path: '/legal/terms', name: 'terms' },
  { path: '/legal/mentions', name: 'mentions' },
  { path: '/health', name: 'health' },
  { path: '/cette-page-nexiste-pas', name: '404' },
]

;(async () => {
  const browser = await chromium.launch()

  for (const { path, name } of pagesToTest) {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(700)

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const ok = scrollWidth <= 377
    console.log(`${ok ? 'PASS' : 'OVERFLOW'} ${name} (${path}) — scrollWidth: ${scrollWidth}px`)

    const smallTargets = await page.evaluate(() => {
      const interactive = document.querySelectorAll('a,button,[role="button"],input,select,textarea')
      return Array.from(interactive)
        .map((el) => {
          const rect = (el as HTMLElement).getBoundingClientRect()
          const label = (el as HTMLElement).innerText?.slice(0, 20)
            || (el as HTMLElement).getAttribute('aria-label')
            || el.tagName
          return { h: Math.round(rect.height), w: Math.round(rect.width), label, tag: el.tagName }
        })
        .filter((item) => item.h > 0 && item.w > 0 && item.h < 44)
        .slice(0, 20)
    })

    if (smallTargets.length) {
      console.log('  Tap targets < 44px:')
      for (const t of smallTargets) {
        console.log(`   - ${t.tag} "${t.label}" — ${t.h}px`)
      }
    }

    await page.close()
  }

  await browser.close()
})()
