// client/src/pages/CodeBlockPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate }        from 'react-router-dom';
import {
  fetchCodeblock,
  saveSnapshot,
  fetchSnapshots
} from '../api/codeblocks';
import { socket }       from '../socket';
import Editor           from '../components/Editor';
import SmileyOverlay    from '../components/SmileyOverlay';
import './CodeBlockPage.css';

export default function CodeBlockPage() {
  const { id: blockId } = useParams();
  const navigate         = useNavigate();

  const [code, setCode]           = useState('');
  const [instruction, setInstruction] = useState('');
  const [role, setRole]           = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [solved, setSolved]       = useState(false);
  const [snapshots, setSnapshots] = useState([]);

  const solutionRef  = useRef('');   // holds the official solution source
  const joinedRef    = useRef(false);
  const clientId     = socket.id;    // uniquely identifies this user/session

  // 1) Fetch template & solution
  useEffect(() => {
    fetchCodeblock(blockId)
      .then(block => {
        const lines = block.template.split('\n');
        const todo  = lines.find(l => l.includes('// TODO'));
        if (todo) {
          setInstruction(todo.replace(/\/\/\s*TODO:?/, '').trim());
        }
        // show template (minus TODO) in editor
        setCode(lines.filter(l => !l.includes('// TODO')).join('\n'));
        solutionRef.current = block.solution;
      })
      .catch(() => navigate('/'));
  }, [blockId, navigate]);

  // 2) Socket.io: join room, assign role, sync code & count
  useEffect(() => {
    if (!joinedRef.current) {
      socket.emit('join-room', blockId);
      joinedRef.current = true;
    }
    socket.on('role', setRole);
    socket.on('code-update', setCode);
    socket.on('student-count', setStudentCount);
    socket.on('mentor-left', () => {
      alert('Mentor has left. Returning to lobby.');
      navigate('/');
    });
    return () => {
      socket.removeAllListeners('role');
      socket.removeAllListeners('code-update');
      socket.removeAllListeners('student-count');
      socket.removeAllListeners('mentor-left');
    };
  }, [blockId, navigate]);

  // 3) On unmount, mentor explicitly leaves room
  useEffect(() => {
    return () => {
      if (role === 'mentor') {
        socket.emit('leave-room', blockId);
      }
    };
  }, [blockId, role]);

  // 4) Load my snapshots on mount
  const loadMySnapshots = async () => {
    try {
      const list = await fetchSnapshots(blockId, clientId);
      setSnapshots(list);
    } catch (err) {
      console.error('Failed to load snapshots:', err);
    }
  };
  useEffect(() => {
    loadMySnapshots();
  }, []); // run once on mount

  // 5) Submission: semicolon check + run & compare + always save snapshot
  const handleSubmit = async () => {
    // 5a) SEMICOLON CHECK
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const codeOnly = raw.split('//')[0].trim();
      const line = raw.trim();
      if (
        codeOnly === '' ||
        line === '{' ||
        line === '}' ||
        line.endsWith('{') ||
        line.startsWith('//')
      ) continue;
      if (!codeOnly.endsWith(';')) {
        alert(`Line ${i + 1} is missing a semicolon:\n${raw}`);
        return;
      }
    }

    // 5b) CAPTURE AND RUN SNIPPETS
    const capture = () => {
      const logs = [];
      return {
        console: { log: (...args) => logs.push(args.join(' ')) },
        getLogs: () => logs
      };
    };
    const runSnippet = src => {
      const { console, getLogs } = capture();
      const runner = new Function('console', `"use strict";\n${src}`);
      runner(console);
      return getLogs();
    };

    // student vs solution outputs
    let studentLogs, solutionLogs;
    try {
      studentLogs  = runSnippet(code);
      solutionLogs = runSnippet(solutionRef.current);
    } catch (err) {
      alert('Error running your code: ' + err.message);
      return;
    }

    const passed =
      studentLogs.length === solutionLogs.length &&
      studentLogs.every((ln, i) => ln === solutionLogs[i]);

    // 5c) SAVE A SNAPSHOT (pass or fail) & refresh list
    try {
      await saveSnapshot(blockId, code, clientId);
      await loadMySnapshots();
    } catch (err) {
      console.error('Snapshot save failed:', err);
    }

    if (passed) {
      setSolved(true);
    } else {
      alert('Not quite yet—try again!');
    }
  };

  const handleExit = () => {
    socket.emit('leave-room', blockId);
    navigate('/');
  };

  return (
    <div className="codeblock-page">
      <div className="codeblock-container">
        <div className="left-pane">
          <h1>Exercise</h1>
          {instruction && <p className="instruction">{instruction}</p>}
          <p>Role: <strong>{role || '…'}</strong></p>
          <p>Students: <strong>{studentCount}</strong></p>

          <div className="button-group">
            {role === 'student' && !solved && (
              <button className="submit-btn" onClick={handleSubmit}>
                Submit
              </button>
            )}
            {(role === 'student' || role === 'mentor') && (
              <button className="exit-btn" onClick={handleExit}>
                Leave
              </button>
            )}
          </div>

          {snapshots.length > 0 && (
            <>
              <h3>Your Attempts</h3>
              <ul className="snapshot-list">
                {snapshots.map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setCode(s.code)}
                      className="snapshot-btn"
                    >
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="center-pane">
          <Editor
            value={code}
            readOnly={role === 'mentor' || solved}
            onChange={setCode}
          />
        </div>
      </div>

      {solved && <SmileyOverlay onClose={() => setSolved(false)} />}
    </div>
  );
}
