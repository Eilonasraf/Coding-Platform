// client/src/api/codeblocks.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchCodeblockList() {
  const res = await fetch(`${BASE_URL}/api/codeblocks`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function fetchCodeblock(id) {
  const res = await fetch(`${BASE_URL}/api/codeblocks/${id}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

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

export async function fetchSnapshots(blockId, clientId) {
  const res = await fetch(
    `${BASE_URL}/api/codeblocks/${blockId}/snapshots?clientId=${clientId}`
  );
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
