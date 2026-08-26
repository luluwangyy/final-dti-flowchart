import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-darker.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import './styles.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

const EMPTY_SOURCE = {
  javascript: '',
  html: '',
  css: ''
};

const EXAMPLES = [
  {
    name: 'Particle field',
    category: 'Canvas animation',
    description: 'A visual loop with setup, particles, motion, and resize handling.',
    source: {
      javascript: [
        "const canvas = document.querySelector('#field');",
        "const context = canvas.getContext('2d');",
        'const particles = [];',
        '',
        'function resizeCanvas() {',
        '  canvas.width = window.innerWidth;',
        '  canvas.height = window.innerHeight;',
        '}',
        '',
        'function createParticles(count = 80) {',
        '  for (let index = 0; index < count; index += 1) {',
        '    particles.push({',
        '      x: Math.random() * canvas.width,',
        '      y: Math.random() * canvas.height,',
        '      radius: Math.random() * 3 + 1,',
        '      speed: Math.random() * 0.6 + 0.2',
        '    });',
        '  }',
        '}',
        '',
        'function renderFrame() {',
        "  context.fillStyle = '#f2f2ef';",
        '  context.fillRect(0, 0, canvas.width, canvas.height);',
        "  context.fillStyle = '#1d1d1f';",
        '',
        '  particles.forEach((particle) => {',
        '    particle.y -= particle.speed;',
        '    if (particle.y < -4) particle.y = canvas.height + 4;',
        '    context.beginPath();',
        '    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);',
        '    context.fill();',
        '  });',
        '',
        '  requestAnimationFrame(renderFrame);',
        '}',
        '',
        "window.addEventListener('resize', resizeCanvas);",
        'resizeCanvas();',
        'createParticles();',
        'renderFrame();'
      ].join('\n'),
      html: [
        '<main class="demo-shell">',
        '  <p>Generative study 01</p>',
        '  <h1>A quiet field in motion.</h1>',
        '  <canvas id="field"></canvas>',
        '</main>'
      ].join('\n'),
      css: [
        '* { box-sizing: border-box; }',
        'body {',
        '  margin: 0;',
        '  overflow: hidden;',
        '  font-family: -apple-system, BlinkMacSystemFont, sans-serif;',
        '  background: #f2f2ef;',
        '  color: #1d1d1f;',
        '}',
        '.demo-shell { padding: 48px; }',
        'p { color: #777; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }',
        'h1 { position: relative; z-index: 1; max-width: 420px; font-size: 48px; letter-spacing: -.05em; }',
        'canvas { position: fixed; inset: 0; }'
      ].join('\n')
    }
  },
  {
    name: 'Focus list',
    category: 'DOM interactions',
    description: 'A compact task filter that shows events, state, and conditional UI.',
    source: {
      javascript: [
        "const filters = document.querySelectorAll('[data-filter]');",
        "const tasks = document.querySelectorAll('[data-state]');",
        '',
        'function updateFilter(nextFilter) {',
        '  filters.forEach((button) => {',
        "    button.setAttribute('aria-pressed', button.dataset.filter === nextFilter);",
        '  });',
        '',
        '  tasks.forEach((task) => {',
        "    const shouldShow = nextFilter === 'all' || task.dataset.state === nextFilter;",
        '    task.hidden = !shouldShow;',
        '  });',
        '}',
        '',
        'filters.forEach((button) => {',
        "  button.addEventListener('click', () => updateFilter(button.dataset.filter));",
        '});',
        '',
        "updateFilter('all');"
      ].join('\n'),
      html: [
        '<main class="focus-list">',
        '  <header><span>Today</span><strong>3 focused tasks</strong></header>',
        '  <nav aria-label="Task filters">',
        '    <button data-filter="all">All</button>',
        '    <button data-filter="open">Open</button>',
        '    <button data-filter="done">Done</button>',
        '  </nav>',
        '  <article data-state="open">Refine product story <small>09:30</small></article>',
        '  <article data-state="open">Review interaction map <small>12:00</small></article>',
        '  <article data-state="done">Prepare prototype <small>Done</small></article>',
        '</main>'
      ].join('\n'),
      css: [
        'body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #ececea; font-family: -apple-system, sans-serif; color: #1d1d1f; }',
        '.focus-list { width: min(440px, 88vw); padding: 28px; border: 1px solid rgba(0,0,0,.06); border-radius: 22px; background: rgba(255,255,255,.72); box-shadow: 0 24px 60px rgba(0,0,0,.08); }',
        'header { display: flex; justify-content: space-between; margin-bottom: 24px; color: #777; }',
        'header strong { color: #1d1d1f; }',
        'nav { display: flex; gap: 6px; margin-bottom: 18px; }',
        'button { padding: 8px 12px; border: 0; border-radius: 9px; background: #eee; }',
        'button[aria-pressed="true"] { color: white; background: #1d1d1f; }',
        'article { display: flex; justify-content: space-between; padding: 16px 2px; border-top: 1px solid rgba(0,0,0,.07); }',
        'small { color: #8a8a8f; }'
      ].join('\n')
    }
  },
  {
    name: 'Theme switcher',
    category: 'UI state',
    description: 'A small theme controller using data attributes and local preferences.',
    source: {
      javascript: [
        "const themeButtons = document.querySelectorAll('[data-theme]');",
        "const preview = document.querySelector('.theme-preview');",
        '',
        'function applyTheme(theme) {',
        '  preview.dataset.activeTheme = theme;',
        '  themeButtons.forEach((button) => {',
        "    const isActive = button.dataset.theme === theme;",
        "    button.setAttribute('aria-pressed', isActive);",
        '  });',
        '}',
        '',
        'themeButtons.forEach((button) => {',
        "  button.addEventListener('click', () => {",
        '    applyTheme(button.dataset.theme);',
        '  });',
        '});',
        '',
        "applyTheme('light');"
      ].join('\n'),
      html: [
        '<main class="theme-preview">',
        '  <p>Appearance</p>',
        '  <h1>Choose a calm workspace.</h1>',
        '  <div class="themes">',
        '    <button data-theme="light">Light</button>',
        '    <button data-theme="warm">Warm</button>',
        '    <button data-theme="dark">Dark</button>',
        '  </div>',
        '</main>'
      ].join('\n'),
      css: [
        'body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: sans-serif; background: #efefed; }',
        '.theme-preview { width: min(420px, 84vw); padding: 36px; border-radius: 24px; background: #fff; color: #1d1d1f; transition: .25s ease; }',
        '.theme-preview[data-active-theme="warm"] { background: #f3e8d8; color: #3e3024; }',
        '.theme-preview[data-active-theme="dark"] { background: #252628; color: #f5f5f2; }',
        'p { opacity: .56; text-transform: uppercase; letter-spacing: .12em; font-size: 11px; }',
        'h1 { max-width: 320px; letter-spacing: -.04em; }',
        '.themes { display: flex; gap: 8px; margin-top: 28px; }',
        'button { padding: 10px 14px; border: 0; border-radius: 10px; }',
        'button[aria-pressed="true"] { color: white; background: #146ed8; }'
      ].join('\n')
    }
  },
  {
    name: 'Form validation',
    category: 'Input logic',
    description: 'A friendly signup form with validation, errors, and a success state.',
    source: {
      javascript: [
        "const form = document.querySelector('#signup');",
        "const emailInput = document.querySelector('#email');",
        "const message = document.querySelector('#message');",
        '',
        'function validateEmail(email) {',
        "  return email.includes('@') && email.includes('.');",
        '}',
        '',
        "form.addEventListener('submit', (event) => {",
        '  event.preventDefault();',
        '  const email = emailInput.value.trim();',
        '',
        '  if (!email) {',
        "    message.textContent = 'Enter your email to continue.';",
        "    message.dataset.state = 'error';",
        '    return;',
        '  }',
        '',
        '  if (!validateEmail(email)) {',
        "    message.textContent = 'That email does not look complete.';",
        "    message.dataset.state = 'error';",
        '    return;',
        '  }',
        '',
        "  message.textContent = 'You are on the list.';",
        "  message.dataset.state = 'success';",
        '  form.reset();',
        '});'
      ].join('\n'),
      html: [
        '<main class="signup-card">',
        '  <p>Early access</p>',
        '  <h1>Get the next field note.</h1>',
        '  <form id="signup">',
        '    <label for="email">Email address</label>',
        '    <div><input id="email" type="email" placeholder="you@example.com"><button>Join</button></div>',
        '    <small id="message" aria-live="polite"></small>',
        '  </form>',
        '</main>'
      ].join('\n'),
      css: [
        'body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #e9edf3; font-family: sans-serif; color: #1d1d1f; }',
        '.signup-card { width: min(460px, 86vw); padding: 38px; border-radius: 24px; background: rgba(255,255,255,.82); box-shadow: 0 30px 70px rgba(32,44,62,.12); }',
        'p, label, small { color: #707077; font-size: 12px; }',
        'h1 { margin: 10px 0 30px; letter-spacing: -.04em; }',
        'label { display: block; margin-bottom: 8px; }',
        'form div { display: flex; gap: 8px; }',
        'input { flex: 1; padding: 13px; border: 1px solid #ddd; border-radius: 11px; }',
        'button { padding: 0 18px; color: white; border: 0; border-radius: 11px; background: #146ed8; }',
        'small { display: block; min-height: 18px; margin-top: 10px; }',
        'small[data-state="error"] { color: #b64f49; }',
        'small[data-state="success"] { color: #388157; }'
      ].join('\n')
    }
  }
];

const FILES = [
  { id: 'javascript', label: 'JavaScript', short: 'JS', mode: 'javascript' },
  { id: 'html', label: 'HTML', short: 'HTML', mode: 'htmlmixed' },
  { id: 'css', label: 'CSS', short: 'CSS', mode: 'css' }
];

const STATUS = {
  idle: {
    label: 'Preview comes first',
    detail: 'Load an example or add your own code, then run the live preview.',
    tone: 'neutral'
  },
  generating: {
    label: 'Reading your code',
    detail: 'Tracing structure, decisions, and relationships…',
    tone: 'thinking'
  },
  completed: {
    label: 'Flowchart generated',
    detail: 'Select a diagram node to return to its source lines.',
    tone: 'success'
  },
  error: {
    label: 'Connection needed',
    detail: 'The AI service is not connected yet. Your code is still here.',
    tone: 'error'
  }
};

function cleanMermaidSyntax(value = '') {
  return value
    .replace(/^\x60{3}(?:mermaid)?\s*/i, '')
    .replace(/\s*\x60{3}$/, '')
    .trim();
}

function App() {
  const [source, setSource] = useState(EMPTY_SOURCE);
  const [activeFile, setActiveFile] = useState('javascript');
  const [outputView, setOutputView] = useState('preview');
  const [selectedExample, setSelectedExample] = useState(0);
  const [mermaidCode, setMermaidCode] = useState('');
  const [previewDocument, setPreviewDocument] = useState('');
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [generationState, setGenerationState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [connectionMode, setConnectionMode] = useState('demo');
  const [credentialInput, setCredentialInput] = useState('');
  const [connectionState, setConnectionState] = useState('disconnected');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [aiAccess, setAiAccess] = useState(null);

  const editorRef = useRef(null);
  const diagramRef = useRef(null);
  const renderId = useRef(0);
  const activeMeta = FILES.find((file) => file.id === activeFile);
  const activeValue = source[activeFile];
  const lineCount = useMemo(
    () => (activeValue ? activeValue.split('\n').length : 1),
    [activeValue]
  );
  const hasSource = Object.values(source).some((value) => value.trim());
  const currentStatus = generationState !== 'idle'
    ? STATUS[generationState]
    : !hasPreviewed
      ? STATUS.idle
      : !aiAccess
        ? {
            label: 'Preview ready',
            detail: 'Connect AI with demo access or a personal key to generate the flowchart.',
            tone: 'success'
          }
        : {
            label: 'Ready to map',
            detail: 'The preview is checked and AI access is connected.',
            tone: 'success'
          };
  const example = EXAMPLES[selectedExample];

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: {
        background: 'transparent',
        primaryColor: '#ffffff',
        primaryTextColor: '#1d1d1f',
        primaryBorderColor: '#d5d5d2',
        lineColor: '#8a8a8f',
        secondaryColor: '#f1f1ef',
        tertiaryColor: '#fafaf8',
        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif'
      },
      flowchart: {
        curve: 'basis',
        htmlLabels: true,
        nodeSpacing: 42,
        rankSpacing: 62,
        useMaxWidth: true
      }
    });
  }, []);

  useEffect(() => {
    if (!isConnectOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsConnectOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isConnectOpen]);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      if (!mermaidCode || !diagramRef.current) return;

      try {
        const id = 'flow-diagram-' + renderId.current;
        renderId.current += 1;
        const { svg } = await mermaid.render(id, mermaidCode);
        if (!cancelled && diagramRef.current) {
          diagramRef.current.innerHTML = svg;
        }
      } catch (error) {
        if (!cancelled) {
          setGenerationState('error');
          setErrorMessage('The returned diagram could not be rendered. Try generating it again.');
        }
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [mermaidCode]);

  const updateActiveFile = (value) => {
    setSource((current) => ({ ...current, [activeFile]: value }));
    setHasPreviewed(false);
    if (generationState === 'error') {
      setGenerationState('idle');
      setErrorMessage('');
    }
  };

  const loadExample = (index) => {
    setSource(EXAMPLES[index].source);
    setSelectedExample(index);
    setActiveFile('javascript');
    setMermaidCode('');
    setPreviewDocument('');
    setOutputView('preview');
    setHasPreviewed(false);
    setGenerationState('idle');
    setErrorMessage('');
  };

  const clearWorkspace = () => {
    setSource(EMPTY_SOURCE);
    setActiveFile('javascript');
    setMermaidCode('');
    setPreviewDocument('');
    setOutputView('preview');
    setHasPreviewed(false);
    setGenerationState('idle');
    setErrorMessage('');
  };

  const handlePreview = () => {
    const safeScript = source.javascript.replace(/<\/script/gi, '<\\/script');
    const document = [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<style>' + source.css + '</style>',
      '</head>',
      '<body>',
      source.html || '<main style="font-family: sans-serif; padding: 32px;">Add HTML to preview your interface.</main>',
      '<script>' + safeScript + '</script>',
      '</body>',
      '</html>'
    ].join('');

    setPreviewDocument(document);
    setOutputView('preview');
    setHasPreviewed(true);
    setGenerationState('idle');
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    if (!source.javascript.trim()) {
      setActiveFile('javascript');
      setGenerationState('error');
      setErrorMessage('Add JavaScript before generating a flowchart.');
      return;
    }

    if (!hasPreviewed) {
      setOutputView('preview');
      setGenerationState('error');
      setErrorMessage('Run the live preview first so you can check the code before mapping it.');
      return;
    }

    if (!aiAccess) {
      setIsConnectOpen(true);
      return;
    }

    setGenerationState('generating');
    setErrorMessage('');
    setOutputView('flowchart');

    try {
      const headers = aiAccess.mode === 'personal'
        ? { 'X-OpenAI-Api-Key': aiAccess.secret }
        : { 'X-Demo-Password': aiAccess.secret };
      const response = await axios.post(
        API_URL + '/generate-flowchart',
        {
          code: source.javascript,
          htmlCode: source.html || '<!-- No HTML provided -->',
          cssCode: source.css || '/* No CSS provided */',
          longestSection: 'JavaScript'
        },
        { headers }
      );

      const diagram = cleanMermaidSyntax(response.data.mermaid);
      if (!diagram) throw new Error('The service returned an empty diagram.');

      setMermaidCode(diagram);
      setGenerationState('completed');
    } catch (error) {
      const responseMessage =
        error.response && error.response.data && error.response.data.error;
      setGenerationState('error');
      setErrorMessage(
        responseMessage ||
        'Flow could not reach the AI service. Check the server connection and try again.'
      );
    }
  };

  const handleConnect = async (event) => {
    event.preventDefault();
    const secret = credentialInput.trim();

    if (!secret) {
      setConnectionState('error');
      setConnectionMessage(
        connectionMode === 'demo'
          ? 'Enter the demo password.'
          : 'Enter an OpenAI API key.'
      );
      return;
    }

    setConnectionState('connecting');
    setConnectionMessage('');

    const headers = connectionMode === 'personal'
      ? { 'X-OpenAI-Api-Key': secret }
      : { 'X-Demo-Password': secret };

    try {
      await axios.post(API_URL + '/session/connect', {}, { headers });
      setAiAccess({ mode: connectionMode, secret });
      setConnectionState('connected');
      setConnectionMessage('');
      setCredentialInput('');
      setIsConnectOpen(false);
    } catch (error) {
      const responseMessage =
        error.response && error.response.data && error.response.data.error;
      setConnectionState('error');
      setConnectionMessage(
        responseMessage || 'Flow could not reach the AI service. The server may still be offline.'
      );
    }
  };

  const disconnectAI = () => {
    setAiAccess(null);
    setConnectionState('disconnected');
    setConnectionMessage('');
  };

  const handleDiagramClick = (event) => {
    const node = event.target.closest('.node');
    const text = node && node.textContent;
    const match = text && text.match(/#(\d+)(?:-(\d+))?/);
    if (!match) return;

    const start = Math.max(Number(match[1]) - 1, 0);
    const end = Math.max(Number(match[2] || match[1]) - 1, start);
    setActiveFile('javascript');

    window.setTimeout(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const document = editor.getDoc();
      const lastLine = Math.max(document.lineCount() - 1, 0);
      const safeStart = Math.min(start, lastLine);
      const safeEnd = Math.min(end, lastLine);

      document.getAllMarks().forEach((mark) => mark.clear());
      document.markText(
        { line: safeStart, ch: 0 },
        { line: safeEnd, ch: document.getLine(safeEnd).length },
        { className: 'highlighted-line' }
      );
      editor.scrollIntoView({ line: safeStart, ch: 0 }, 120);
    }, 80);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup" aria-label="Flow">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brand-name">Flow</span>
          <span className="project-name">Untitled workspace</span>
        </div>

        <div className="topbar-actions">
          <button
            className={'connect-button' + (aiAccess ? ' is-connected' : '')}
            type="button"
            onClick={() => setIsConnectOpen(true)}
          >
            <i aria-hidden="true" />
            {aiAccess ? 'AI connected' : 'Connect AI'}
          </button>
          <button className="button button-tertiary" type="button" onClick={clearWorkspace}>
            New workspace
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="glass-panel editor-panel" aria-label="Code workspace">
          <header className="editor-heading">
            <div>
              <span className="eyebrow">Source</span>
              <h1>Shape the code.<br />See the system.</h1>
              <p>Turn implementation details into a clear, navigable map.</p>
            </div>

            <div className="example-library" aria-label="Example code library">
              <div className="example-library-heading">
                <span>Example library</span>
                <small>Ready-made code you can load and edit</small>
              </div>
              <div className="example-picker">
                <label className="sr-only" htmlFor="example-select">Choose example code</label>
                <select
                  id="example-select"
                  value={selectedExample}
                  onChange={(event) => setSelectedExample(Number(event.target.value))}
                >
                  {EXAMPLES.map((item, index) => (
                    <option key={item.name} value={index}>
                      {item.name} — {item.category}
                    </option>
                  ))}
                </select>
                <button
                  className="button button-soft"
                  type="button"
                  onClick={() => loadExample(selectedExample)}
                >
                  Load example
                </button>
              </div>
              <p>{example.description}</p>
            </div>
          </header>

          <nav className="file-tabs" aria-label="Source files">
            {FILES.map((file) => (
              <button
                className={'file-tab' + (activeFile === file.id ? ' is-active' : '')}
                key={file.id}
                type="button"
                aria-current={activeFile === file.id ? 'page' : undefined}
                onClick={() => setActiveFile(file.id)}
              >
                <span>{file.short}</span>
                {file.label}
              </button>
            ))}
          </nav>

          <div className="editor-surface">
            <CodeMirror
              value={activeValue}
              options={{
                mode: activeMeta.mode,
                theme: 'material-darker',
                lineNumbers: true,
                lineWrapping: false,
                tabSize: 2,
                indentUnit: 2
              }}
              editorDidMount={(editor) => {
                editorRef.current = editor;
              }}
              onBeforeChange={(editor, data, value) => updateActiveFile(value)}
            />
          </div>

          <footer className="editor-footer">
            <span>
              <strong>Step 1</strong>
              Check your code in the live preview
              <small>{lineCount} {lineCount === 1 ? 'line' : 'lines'} · {activeMeta.label}</small>
            </span>
            <button
              className="button button-preview"
              type="button"
              onClick={handlePreview}
              disabled={!hasSource}
            >
              <strong aria-hidden="true">▶</strong>
              Run live preview
              <span aria-hidden="true">↗</span>
            </button>
          </footer>
        </section>

        <section className="glass-panel output-panel" aria-label="Generated output">
          <header className="output-toolbar">
            <div className="view-switcher" aria-label="Output view">
              <button
                className={outputView === 'flowchart' ? 'is-active' : ''}
                type="button"
                disabled={!hasPreviewed && !mermaidCode}
                onClick={() => setOutputView('flowchart')}
              >
                Flowchart
              </button>
              <button
                className={outputView === 'preview' ? 'is-active' : ''}
                type="button"
                onClick={() => setOutputView('preview')}
              >
                Live preview
              </button>
            </div>

            <button
              className="button button-flowchart"
              type="button"
              onClick={handleSubmit}
              disabled={generationState === 'generating' || !hasSource || !hasPreviewed}
            >
              <span className="step-number" aria-hidden="true">2</span>
              <span
                className={generationState === 'generating' ? 'spark is-thinking' : 'spark'}
                aria-hidden="true"
              >
                ✦
              </span>
              {generationState === 'generating'
                ? 'Mapping…'
                : aiAccess
                  ? 'Generate flowchart'
                  : 'Connect AI to map'}
            </button>
          </header>

          <div className={'output-stage ' + (outputView === 'preview' ? 'preview-stage' : '')}>
            {outputView === 'flowchart' && (
              <>
                {!mermaidCode && generationState !== 'generating' && (
                  <div className="empty-state">
                    <div className="flow-glyph" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <h2>Your code, made visible.</h2>
                    <p>
                      {hasPreviewed
                        ? 'Your preview is checked. Connect AI, then generate the full flowchart.'
                        : 'Run the live preview first. Flowchart generation unlocks after you check the code.'}
                    </p>
                    {!hasSource && (
                      <button className="button button-soft" type="button" onClick={() => loadExample(0)}>
                        Try an example
                      </button>
                    )}
                  </div>
                )}

                {generationState === 'generating' && (
                  <div className="thinking-state" aria-live="polite">
                    <span className="thinking-orbit" aria-hidden="true"><i /></span>
                    <strong>Understanding your code</strong>
                    <p>Mapping the primary flow and its decisions.</p>
                  </div>
                )}

                {mermaidCode && (
                  <div
                    className="diagram-container"
                    ref={diagramRef}
                    onClick={handleDiagramClick}
                  />
                )}
              </>
            )}

            {outputView === 'preview' && (
              previewDocument ? (
                <iframe
                  className="preview-frame"
                  title="Live code preview"
                  sandbox="allow-scripts"
                  srcDoc={previewDocument}
                />
              ) : (
                <div className="empty-state compact">
                  <span className="preview-symbol" aria-hidden="true">↗</span>
                  <span className="empty-step">Step 1 · Preview first</span>
                  <h2>Check what your code makes.</h2>
                  <p>Run the current HTML, CSS, and JavaScript in an isolated canvas before asking AI to map it.</p>
                  <button
                    className="button button-preview"
                    type="button"
                    onClick={handlePreview}
                    disabled={!hasSource}
                  >
                    <strong aria-hidden="true">▶</strong>
                    Run live preview
                  </button>
                </div>
              )
            )}
          </div>

          <footer className={'ai-status ' + currentStatus.tone} aria-live="polite">
            <span className="ai-indicator" aria-hidden="true"><i /></span>
            <div>
              <strong>{currentStatus.label}</strong>
              <span>{errorMessage || currentStatus.detail}</span>
            </div>
            {generationState === 'error' && source.javascript.trim() && (
              <button className="button button-tertiary" type="button" onClick={handleSubmit}>
                Try again
              </button>
            )}
          </footer>
        </section>
      </main>

      {isConnectOpen && (
        <div className="modal-backdrop">
          <section
            className="connect-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-title"
          >
            <header className="connect-modal-header">
              <div>
                <span className="eyebrow">AI access</span>
                <h2 id="connect-title">Connect AI</h2>
                <p>Choose how you want to unlock flowchart generation.</p>
              </div>
              <button
                className="modal-close"
                type="button"
                aria-label="Close AI connection"
                onClick={() => setIsConnectOpen(false)}
              >
                ×
              </button>
            </header>

            {aiAccess ? (
              <div className="connected-card">
                <span className="connected-mark" aria-hidden="true">✓</span>
                <div>
                  <strong>AI is connected</strong>
                  <p>
                    {aiAccess.mode === 'demo'
                      ? 'Using limited demo access for this session.'
                      : 'Using your personal key for this browser session only.'}
                  </p>
                </div>
                <button
                  className="button button-soft"
                  type="button"
                  onClick={() => {
                    disconnectAI();
                    setIsConnectOpen(false);
                  }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnect}>
                <div className="connection-switcher" aria-label="AI connection method">
                  <button
                    className={connectionMode === 'demo' ? 'is-active' : ''}
                    type="button"
                    onClick={() => {
                      setConnectionMode('demo');
                      setCredentialInput('');
                      setConnectionState('disconnected');
                      setConnectionMessage('');
                    }}
                  >
                    Demo access
                  </button>
                  <button
                    className={connectionMode === 'personal' ? 'is-active' : ''}
                    type="button"
                    onClick={() => {
                      setConnectionMode('personal');
                      setCredentialInput('');
                      setConnectionState('disconnected');
                      setConnectionMessage('');
                    }}
                  >
                    Personal API key
                  </button>
                </div>

                <div className="connection-copy">
                  <strong>
                    {connectionMode === 'demo' ? 'Use trial credits' : 'Use your own OpenAI access'}
                  </strong>
                  <p>
                    {connectionMode === 'demo'
                      ? 'Enter the password shared by the creator. Trial access uses the app key securely on the server.'
                      : 'Your key is sent to the Flow server for requests in this session and is never saved to browser storage.'}
                  </p>
                </div>

                <label className="credential-field" htmlFor="ai-credential">
                  <span>{connectionMode === 'demo' ? 'Demo password' : 'OpenAI API key'}</span>
                  <input
                    id="ai-credential"
                    type="password"
                    autoComplete="off"
                    value={credentialInput}
                    placeholder={connectionMode === 'demo' ? 'Enter demo password' : 'sk-…'}
                    onChange={(event) => {
                      setCredentialInput(event.target.value);
                      if (connectionState === 'error') {
                        setConnectionState('disconnected');
                        setConnectionMessage('');
                      }
                    }}
                  />
                </label>

                {connectionMessage && (
                  <p className="connection-error" role="alert">{connectionMessage}</p>
                )}

                <div className="connection-note">
                  <span aria-hidden="true">⌁</span>
                  <p>
                    The creator key is never included in the website. Personal keys are held in memory only and clear when the page reloads.
                  </p>
                </div>

                <button
                  className="button button-primary connect-submit"
                  type="submit"
                  disabled={connectionState === 'connecting'}
                >
                  {connectionState === 'connecting' ? 'Connecting…' : 'Continue securely'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
