// client/src/api/codeblocks.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// set up the base URL for API requests
export async function fetchCodeblockList() {
  const res = await fetch(`${BASE_URL}/api/codeblocks`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

// fetch a single code block by ID
export async function fetchCodeblock(id) {
  const res = await fetch(`${BASE_URL}/api/codeblocks/${id}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

// save a snapshot of the current code for a specific code block
export async function saveSnapshot(blockId, code, clientId) {
  const res = await fetch(
    `${BASE_URL}/api/codeblocks/${blockId}/snapshot`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, clientId })
    }
  );
  if (!res.ok) throw new Error(res.statusText);
}

// fetch all snapshots for a code block, optionally filtered by clientId
export async function fetchSnapshots(blockId, clientId) {
  const res = await fetch(
    `${BASE_URL}/api/codeblocks/${blockId}/snapshots?clientId=${clientId}`
  );
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
