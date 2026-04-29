#!/usr/bin/env python3
# Run anytime to refresh Pinkbike listings: python3 refresh-pinkbike.py
import asyncio, json, subprocess, sys
from playwright.async_api import async_playwright

async def scrape():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width":1280,"height":900},
        )
        page = await ctx.new_page()
        await page.goto("https://www.pinkbike.com/u/ChainLineCycle/buysell/", wait_until="commit", timeout=30000)
        await page.wait_for_timeout(6000)
        data = await page.evaluate("""() => {
            const results = [], ids = new Set();
            document.querySelectorAll('a[href*="/buysell/"]').forEach(a => {
                const m = a.href.match(/\/buysell\/(\d{6,})\//); if (m) ids.add(m[1]);
            });
            ids.forEach(id => {
                const links = Array.from(document.querySelectorAll(`a[href*="/buysell/${id}/"]`));
                const titleLink = links.find(a => a.innerText.trim().length > 5);
                if (!titleLink) return;
                let tr = titleLink; while (tr && tr.tagName !== 'TR') tr = tr.parentElement;
                if (!tr) return;
                const tds = tr.querySelectorAll('td'); if (tds.length < 3) return;
                const imgSrc = tds[0].querySelector('img')?.src || null;
                const detText = tds[1] ? tds[1].innerText : '';
                let price = 0;
                for (const td of tds) {
                    if (td.className?.includes('price')) { const m=td.innerText.match(/[\d,]+/); if(m){price=parseInt(m[0].replace(/,/g,''));break;} }
                }
                if (!price) for (const td of tds) { const m=td.innerText.match(/\$\s*([\d,]+)/); if(m){price=parseInt(m[1].replace(/,/g,''));break;} }
                const condM = detText.match(/Condition\s*[:\-]\s*([^\n]+)/i);
                results.push({ id, title: titleLink.innerText.trim(), price, condition: condM?condM[1].trim():'', image: imgSrc, url: `https://www.pinkbike.com/buysell/${id}/` });
            });
            return results;
        }""")
        await browser.close()
        return data

listings = asyncio.run(scrape())
print(f"Found {len(listings)} listings")
for l in listings: print(f"  ${l['price']:,} — {l['title']}")

import os, pathlib
outfile = pathlib.Path(__file__).parent / 'pinkbike.json'
with open(outfile, 'w') as f: json.dump(listings, f, indent=2)
print(f"\nSaved to {outfile}")

# Auto git commit + push
try:
    d = str(outfile.parent)
    subprocess.run(['git', '-C', d, 'add', 'pinkbike.json'], check=True)
    subprocess.run(['git', '-C', d, 'commit', '-m', f'Pinkbike: refresh ({len(listings)} listings)'], check=True)
    subprocess.run(['git', '-C', d, 'push'], check=True)
    print("Pushed to live site.")
except Exception as e:
    print(f"Git push failed: {e} — file saved locally, push manually.")
