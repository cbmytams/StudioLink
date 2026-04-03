import { chromium } from '@playwright/test'

const BASE = 'http://localhost:5173'

const publicPages = [
  '/', '/login', '/register',
  '/legal/privacy', '/legal/terms', '/legal/mentions',
  '/health', '/cette-page-nexiste-pas'
]

;(async () => {
  const browser = await chromium.launch()

  for (const path of publicPages) {
    const pageName = path.replace(/\//g, '-').slice(1) || 'home'

    const desktop = await browser.newPage()
    await desktop.setViewportSize({ width: 1280, height: 800 })
    await desktop.goto(BASE + path, { waitUntil: 'load', timeout: 30000 })
    await desktop.waitForTimeout(700)
    await desktop.screenshot({
      path: `/tmp/studiolink-visual-audit/desktop/${pageName}.png`,
      fullPage: true
    })
    await desktop.close()

    const mobile = await browser.newPage()
    await mobile.setViewportSize({ width: 375, height: 812 })
    await mobile.goto(BASE + path, { waitUntil: 'load', timeout: 30000 })
    await mobile.waitForTimeout(700)
    await mobile.screenshot({
      path: `/tmp/studiolink-visual-audit/mobile/${pageName}.png`,
      fullPage: true
    })
    await mobile.close()

    console.log(`Screenshot ${path}`)
  }

  await browser.close()
  console.log('Captures terminées: /tmp/studiolink-visual-audit/')
})()
