/** Node's built-in test runner verifies frontend API behavior without npm install. */
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { messageForApiError, summarizeText } from '../src/api.js';

const initialFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = initialFetch; });

test('missing backend URL explains how to configure Vite', async () => {
  await assert.rejects(summarizeText({ text: 'hi', mode: 'extractive', baseUrl: '' }), /VITE_API_URL/);
});

test('successful response returns mode and summary', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ summary: '  Short.  ', mode: 'extractive' }), { status: 200 });
  const result = await summarizeText({ text: 'Long text', mode: 'extractive', baseUrl: 'http://127.0.0.1:8000' });
  assert.deepEqual(result, { summary: 'Short.', mode: 'extractive' });
});

test('validation errors use useful Pydantic field messages', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: [{ msg: 'Value error, Text cannot be blank' }] }), { status: 422 });
  await assert.rejects(summarizeText({ text: ' ', mode: 'extractive', baseUrl: 'http://localhost:8000' }), /Text cannot be blank/);
});

test('network connection failures have friendly errors', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(summarizeText({ text: 'Hi', mode: 'abstractive', baseUrl: 'http://localhost:8000' }), /Cannot connect to backend/);
});

test('empty server summary is rejected', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ summary: '', mode: 'extractive' }), { status: 200 });
  await assert.rejects(summarizeText({ text: 'Hi', mode: 'extractive', baseUrl: 'http://localhost:8000' }), /empty or invalid/);
});

test('fallback non-string errors are human-readable', () => {
  assert.match(messageForApiError({}, 422), /valid text/);
});
