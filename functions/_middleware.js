// Cloudflare Pages Function middleware — SPA fallback
// Intercepts 404s from the asset layer and serves current index.html with 200.
// This ensures pSEO routes like /marin-bikes-kelowna get the latest SPA, not a
// stale fallback from an old Worker deployment.
export async function onRequest(context) {
  const response = await context.next();
  if (response.status !== 404) return response;

  // Fetch the current deployment's index.html and return with 200
  const indexUrl = new URL('/', context.request.url);
  const indexResponse = await context.env.ASSETS.fetch(indexUrl.toString());
  return new Response(indexResponse.body, {
    status: 200,
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'no-store',
    },
  });
}
