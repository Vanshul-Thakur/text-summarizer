/** Frontend-only API client. Gemini keys must NEVER be placed in frontend code. */

const DEFAULT_ERROR = 'Something went wrong while generating your summary.';

export function getApiBaseUrl() {
  // Vite injects import.meta.env in the browser. Optional chaining also lets
  // the helper be unit tested using Node without a Vite runtime.
  return (import.meta.env?.VITE_API_URL || '').trim().replace(/\/+$/, '');
}

export function messageForApiError(detail, status) {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const first = detail.find((item) => typeof item?.msg === 'string');
    if (first) return first.msg.replace(/^Value error, /i, '');
  }
  if (status === 422) return 'Please enter valid text and select a supported mode.';
  return DEFAULT_ERROR;
}

export async function summarizeText({ text, mode, signal, baseUrl = getApiBaseUrl() }) {
  if (!baseUrl) {
    throw new Error('Backend URL is not configured. Set VITE_API_URL in frontend/.env.development.');
  }

  let response;
  try {
    response = await fetch(`${baseUrl}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode }),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('The request was canceled.');
    }
    throw new Error('Cannot connect to backend. Check that FastAPI is running and VITE_API_URL is correct.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(messageForApiError(data?.detail, response.status));
  if (typeof data?.summary !== 'string' || !data.summary.trim()) {
    throw new Error('The server returned an empty or invalid summary.');
  }
  return { summary: data.summary.trim(), mode: data.mode };
}
