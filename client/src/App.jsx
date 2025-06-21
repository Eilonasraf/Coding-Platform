// src/App.jsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';

import LobbyPage from './pages/LobbyPage.jsx';
import CodeBlockPage from './pages/CodeBlockPage.jsx';
import './index.css';

export default function App() {
  return (
    <Router>
      {/* top-level wrapper to center everything */}
      <main className="app-container">
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/block/:id" element={<CodeBlockPage />} />
        </Routes>
      </main>
    </Router>
  );
}
