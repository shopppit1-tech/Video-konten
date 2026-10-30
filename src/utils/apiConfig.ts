/**
 * Cloud Run backend URL where the live server runs with Gemini AI API.
 */
export const CLOUD_RUN_BACKEND_URL =
  'https://ais-pre-aqftsw3zofseppjy6nq3zl-831915608361.asia-southeast1.run.app';

/**
 * Returns the full API URL based on runtime environment.
 * If the app is loaded from GitHub Pages (*.github.io) or another external static host,
 * requests are automatically routed to the live Cloud Run backend.
 */
export function getApiUrl(endpoint: string): string {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isExternalHost =
      hostname.includes('github.io') ||
      hostname.includes('vercel.app') ||
      hostname.includes('netlify.app') ||
      (hostname === 'localhost' && window.location.port !== '3000');

    if (isExternalHost) {
      return `${CLOUD_RUN_BACKEND_URL}${cleanPath}`;
    }
  }

  return cleanPath;
}
