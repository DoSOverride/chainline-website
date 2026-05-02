// Cloudflare Pages Function middleware — SPA fallback + staging noindex
export async function onRequest(context) {
  const host = context.request.headers.get('host') || '';
  const isStaging = host.includes('pages.dev');

  const response = await context.next();

  if (response.status !== 404) {
    if (!isStaging) return response;
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, { status: response.status, headers });
  }

  const indexUrl = new URL('/', context.request.url);
  const indexResponse = await context.env.ASSETS.fetch(indexUrl.toString());
  return new Response(indexResponse.body, {
    status: 200,
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'no-store',
      ...(isStaging ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
  });
}
