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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const EMPTY_SOURCE = {
  javascript: '',
  html: '',
  css: ''
};

const EXAMPLES = [
  {
    name: 'Particle field',
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
  }
];

const FILES = [
  { id: 'javascript', label: 'JavaScript', short: 'JS', mode: 'javascript' },
  { id: 'html', label: 'HTML', short: 'HTML', mode: 'htmlmixed' },
  { id: 'css', label: 'CSS', short: 'CSS', mode: 'css' }
];

const STATUS = {
  idle: {
    label: 'Ready to map',
    detail: 'Add JavaScript or begin with an example.',
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
  const [outputView, setOutputView] = useState('flowchart');
  const [mermaidCode, setMermaidCode] = useState('');
  const [previewDocument, setPreviewDocument] = useState('');
  const [generationState, setGenerationState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

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
  const currentStatus = STATUS[generationState];

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
    if (generationState === 'error') {
      setGenerationState('idle');
      setErrorMessage('');
    }
  };

  const loadExample = (index) => {
    setSource(EXAMPLES[index].source);
    setActiveFile('javascript');
    setMermaidCode('');
    setPreviewDocument('');
    setOutputView('flowchart');
    setGenerationState('idle');
    setErrorMessage('');
  };

  const clearWorkspace = () => {
    setSource(EMPTY_SOURCE);
    setActiveFile('javascript');
    setMermaidCode('');
    setPreviewDocument('');
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
  };

  const handleSubmit = async () => {
    if (!source.javascript.trim()) {
      setActiveFile('javascript');
      setGenerationState('error');
      setErrorMessage('Add JavaScript before generating a flowchart.');
      return;
    }

    setGenerationState('generating');
    setErrorMessage('');
    setOutputView('flowchart');

    try {
      const response = await axios.post(API_URL + '/generate-flowchart', {
        code: source.javascript,
        htmlCode: source.html || '<!-- No HTML provided -->',
        cssCode: source.css || '/* No CSS provided */',
        longestSection: 'JavaScript'
      });

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
          <span className="service-status">
            <i aria-hidden="true" />
            AI flow mapper
          </span>
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

            <div className="example-actions" aria-label="Load example">
              {EXAMPLES.map((example, index) => (
                <button
                  className="button button-soft"
                  key={example.name}
                  type="button"
                  onClick={() => loadExample(index)}
                >
                  {example.name}
                </button>
              ))}
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
            <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'} · {activeMeta.label}</span>
            <button
              className="button button-secondary"
              type="button"
              onClick={handlePreview}
              disabled={!hasSource}
            >
              Run preview
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
              className="button button-primary"
              type="button"
              onClick={handleSubmit}
              disabled={generationState === 'generating' || !hasSource}
            >
              <span
                className={generationState === 'generating' ? 'spark is-thinking' : 'spark'}
                aria-hidden="true"
              >
                ✦
              </span>
              {generationState === 'generating' ? 'Mapping…' : 'Generate flowchart'}
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
                    <p>Load an example or add JavaScript, then let Flow trace the structure for you.</p>
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
                  <h2>Preview your interface.</h2>
                  <p>Run the current HTML, CSS, and JavaScript in an isolated canvas.</p>
                  <button
                    className="button button-soft"
                    type="button"
                    onClick={handlePreview}
                    disabled={!hasSource}
                  >
                    Run preview
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
    </div>
  );
}

export default App;
