import React, { useEffect, useState } from 'react';
import { Link }                      from 'react-router-dom';
import { fetchCodeblockList }        from '../api/codeblocks';
import './LobbyPage.css';

export default function LobbyPage() {
  const [blocks, setBlocks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCodeblockList()
      .then(setBlocks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="lobby-container">
        <h1 className="lobby-header">Choose a Code Block</h1>
        <div className="cards-grid">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="block-card skeleton" />
          ))}
        </div>
      </section>
    );
  }

  // purpose: Display a list of code blocks available for selection
  return (
    <section className="lobby-container">
      <h1 className="lobby-header">Choose a Code Block</h1>
      <div className="cards-grid">
        {blocks.map(b => (
          <Link key={b._id} to={`/block/${b._id}`} className="block-card">
            <h3 className="block-title">{b.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
