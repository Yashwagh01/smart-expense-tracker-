/**
 * Vercel Serverless Function Proxy for Internal AI Service
 * Resolves the internal AI service URL using the Vercel Service Binding 'AI_URL'.
 */

export default async function handler(req: any, res: any) {
  // Read bound internal service URL from Vercel service binding
  const internalAiUrl = process.env.AI_URL || process.env.AI_SERVICE_URL;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!internalAiUrl) {
    return res.status(503).json({
      error: 'AI service binding (AI_URL) is not available.',
      hint: 'Ensure vercel.json includes the service binding from "app" to "ai".'
    });
  }

  try {
    // Extract target path from query or URL
    const url = new URL(req.url, 'http://localhost');
    const pathParts = url.pathname.replace(/^\/api\/ai\/?/, '').split('/');
    const model = req.query?.model || pathParts[0] || '';

    const targetUrl = new URL(model, internalAiUrl.endsWith('/') ? internalAiUrl : `${internalAiUrl}/`);

    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const responseData = await upstreamResponse.json();
    return res.status(upstreamResponse.status).json(responseData);
  } catch (error: any) {
    return res.status(502).json({
      error: `Failed to forward request to internal AI service: ${error.message}`,
    });
  }
}
