// ── ChainLine Pinkbike Listing Scraper ──────────────────────────────────────
// Instructions:
// 1. Go to: https://www.pinkbike.com/u/ChainLineCycle/buysell/
// 2. Open DevTools → Console (Cmd+Option+J on Mac)
// 3. Paste this entire script and press Enter
// 4. Copy the JSON output
// 5. Paste it into /chainline-website/pinkbike.json (replace the [] with the array)

(function() {
  const listings = [];
  
  // Pinkbike listing cards — try multiple selector patterns
  const cards = document.querySelectorAll(
    '.bsitem, .buysell-item, [class*="bsitem"], [class*="buysell"], article[data-id]'
  );
  
  cards.forEach(card => {
    try {
      // URL + ID
      const link = card.querySelector('a[href*="/buysell/"]');
      const url  = link ? 'https://www.pinkbike.com' + link.getAttribute('href').split('?')[0] : null;
      if (!url || url === 'https://www.pinkbike.com') return;
      const idMatch = url.match(/\/buysell\/(\d+)\//);
      const id = idMatch ? idMatch[1] : null;
      
      // Title
      const titleEl = card.querySelector('b, h3, h4, .title, [class*="title"]');
      const title   = titleEl ? titleEl.innerText.trim() : null;
      
      // Price
      const priceEl = card.querySelector('[class*="price"], .buysell-price');
      let price = 0;
      if (priceEl) {
        const m = priceEl.innerText.match(/[\d,]+/);
        if (m) price = parseInt(m[0].replace(/,/g,''));
      }
      if (!price) {
        const allText = card.innerText;
        const pm = allText.match(/\$\s*([\d,]+)/);
        if (pm) price = parseInt(pm[1].replace(/,/g,''));
      }
      
      // Image
      const imgEl = card.querySelector('img');
      const image = imgEl ? (imgEl.dataset.src || imgEl.src || null) : null;
      
      // Condition
      const condEl = card.querySelector('[class*="condition"], [class*="cond"]');
      let condition = condEl ? condEl.innerText.trim() : '';
      if (!condition) {
        const condMatch = card.innerText.match(/(New|Like New|Very Good|Good|Fair|Poor)/i);
        if (condMatch) condition = condMatch[1];
      }
      
      if (title && price > 0) {
        listings.push({ id, title, price, condition, image, url });
      }
    } catch(e) {}
  });
  
  if (listings.length === 0) {
    console.warn('No listings found. Try scrolling down to load all listings first, then run again.');
    console.log('Page HTML snippet:', document.querySelector('.bsitem, article')?.outerHTML?.slice(0,500));
    return;
  }
  
  const json = JSON.stringify(listings, null, 2);
  console.log('%cChainLine Pinkbike Listings — Copy the JSON below:', 'font-weight:bold;font-size:14px;color:green');
  console.log(json);
  
  // Also try to copy to clipboard
  navigator.clipboard.writeText(json)
    .then(() => console.log('%c✓ Copied to clipboard!', 'color:green;font-weight:bold'))
    .catch(() => console.log('Could not auto-copy — select and copy the JSON above manually'));
  
  return listings;
})();
