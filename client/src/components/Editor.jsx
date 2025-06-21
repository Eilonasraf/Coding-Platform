// client/src/components/Editor.jsx
// ----------------------------------
// Purpose: Wraps the CodeMirror editor with standardized props for value, readOnly, and onChange.
// Dependencies: npm install @uiw/react-codemirror @codemirror/lang-javascript @uiw/codemirror-theme-dracula
// Usage: Import and using CodeBlockPage.jsx, passing in the current code, readOnly flag, and change handler.

import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { dracula } from '@uiw/codemirror-theme-dracula';
import './Editor.css';

export default function Editor({ value, readOnly, onChange }) {
  return (
    <CodeMirror
      className="editor"
      value={value}
      height="60vh"
      extensions={[javascript(), dracula]}
      editable={!readOnly}
      onChange={onChange}
    />
  );
}


