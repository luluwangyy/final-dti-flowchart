import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-darker.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import './styles.css';
import { CREATIVE_EXAMPLES } from './creativeExamples';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050';

const EMPTY_SOURCE = {
  javascript: '',
  html: '',
  css: ''
};

export const LEGACY_UI_EXAMPLES = [
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
        '  font-family: "Maven Pro", sans-serif;',
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
        'body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #ececea; font-family: "Maven Pro", sans-serif; color: #1d1d1f; }',
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
        'body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: "Maven Pro", sans-serif; background: #efefed; }',
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
        'body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #e9edf3; font-family: "Maven Pro", sans-serif; color: #1d1d1f; }',
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

const EXAMPLES = CREATIVE_EXAMPLES;

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
    label: 'Couldn’t finish this chart',
    detail: 'Your code is still here. Review the message and try again.',
    tone: 'error'
  }
};

function cleanMermaidSyntax(value = '') {
  const cleaned = value
    .replace(/^\x60{3}(?:mermaid)?\s*/i, '')
    .replace(/\s*\x60{3}$/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
  const lines = cleaned.split('\n');
  const diagramStart = lines.findIndex((line) => /^\s*(?:flowchart|graph)\s+(?:TD|TB|BT|RL|LR)\b/i.test(line));

  return (diagramStart >= 0 ? lines.slice(diagramStart) : lines)
    .filter((line) => !/^\s*(?:click|style|classDef|class)\s+/i.test(line))
    .join('\n')
    .trim();
}

function buildFallbackMermaid(code = '') {
  const lines = code.split('\n');
  const declarations = [];

  lines.forEach((line, index) => {
    const match = line.match(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/);
    const name = match && (match[1] || match[2]);
    if (name) declarations.push({ name, start: index + 1 });
  });

  const sections = declarations.length
    ? declarations.map((item, index) => ({
        label: item.name.replace(/[^A-Za-z0-9_$ -]/g, ''),
        start: item.start,
        end: index < declarations.length - 1 ? declarations[index + 1].start - 1 : lines.length
      }))
    : Array.from({ length: Math.ceil(lines.length / 6) }, (_, index) => ({
        label: `Code section ${index + 1}`,
        start: index * 6 + 1,
        end: Math.min((index + 1) * 6, lines.length)
      }));

  const visibleSections = sections.slice(0, 18);
  const nodeLines = visibleSections.map((section, index) => {
      const range = section.start === section.end ? section.start : `${section.start}-${section.end}`;
      return `  S${index + 1}["${section.label} #${range}"]`;
    });

  if (!declarations.length) {
    return ['flowchart TD', '  Root["Code structure"]', ...nodeLines.map((node, index) => `${node}\n  Root --> S${index + 1}`)].join('\n');
  }

  const edges = [];
  const incoming = new Set();
  visibleSections.forEach((section, sourceIndex) => {
    const body = lines.slice(section.start - 1, section.end).join('\n');
    visibleSections.forEach((target, targetIndex) => {
      if (sourceIndex === targetIndex) return;
      const escapedName = target.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escapedName}\\s*\\(`).test(body)) {
        edges.push(`  S${sourceIndex + 1} --> S${targetIndex + 1}`);
        incoming.add(targetIndex);
      }
    });
  });

  const entryEdges = visibleSections
    .map((section, index) => ({ section, index }))
    .filter(({ index }) => !incoming.has(index))
    .map(({ index }) => `  Root --> S${index + 1}`);

  return ['flowchart TD', '  Root["Code structure"]', ...nodeLines, ...entryEdges, ...edges].join('\n');
}

function App() {
  const [source, setSource] = useState(EMPTY_SOURCE);
  const [activeFile, setActiveFile] = useState('javascript');
  const [outputView, setOutputView] = useState('hidden');
  const [selectedExample, setSelectedExample] = useState(0);
  const [mermaidCode, setMermaidCode] = useState('');
  const [previewDocument, setPreviewDocument] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [generationState, setGenerationState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [connectionMode, setConnectionMode] = useState('demo');
  const [credentialInput, setCredentialInput] = useState('');
  const [connectionState, setConnectionState] = useState('disconnected');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [aiAccess, setAiAccess] = useState(null);
  const [pendingLineRange, setPendingLineRange] = useState(null);
  const [diagramTransform, setDiagramTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDiagramDragging, setIsDiagramDragging] = useState(false);
  const [cardHeights, setCardHeights] = useState(() => (
    window.innerWidth <= 1120
      ? { editor: 1030, preview: 340, flowchart: 680 }
      : { editor: 1120, preview: 400, flowchart: 708 }
  ));

  const editorRef = useRef(null);
  const diagramRef = useRef(null);
  const diagramViewportRef = useRef(null);
  const diagramDragRef = useRef({ active: false, moved: false, x: 0, y: 0 });
  const cardResizeRef = useRef(null);
  const renderId = useRef(0);
  const highlightedLinesRef = useRef([]);
  const activeMeta = FILES.find((file) => file.id === activeFile);
  const activeValue = source[activeFile];
  const lineCount = useMemo(
    () => (activeValue ? activeValue.split('\n').length : 1),
    [activeValue]
  );
  const hasSource = Object.values(source).some((value) => value.trim());
  const currentStatus = previewLoading
    ? {
        label: 'Launching preview',
        detail: 'Loading the creative-coding libraries and animation canvas…',
        tone: 'thinking'
      }
    : generationState !== 'idle'
    ? STATUS[generationState]
    : !hasPreviewed
      ? STATUS.idle
      : !aiAccess
        ? {
            label: 'Connect AI to continue',
            detail: 'Connect AI with demo access or a personal key to generate the flowchart.',
            tone: 'success'
          }
        : {
            label: 'Ready to map',
            detail: 'The preview is checked and AI access is connected.',
            tone: 'success'
          };
  const example = EXAMPLES[selectedExample];
  const matchesSelectedExample = FILES.every((file) => source[file.id] === example.source[file.id]);
  const hasInstantFlowchart = matchesSelectedExample && Boolean(example.flowchart);

  const applySourceHighlight = useCallback((range) => {
    const editor = editorRef.current;
    if (!editor || !range) return false;

    const document = editor.getDoc();
    const lastLine = Math.max(document.lineCount() - 1, 0);
    const safeStart = Math.min(range.start, lastLine);
    const safeEnd = Math.min(range.end, lastLine);

    highlightedLinesRef.current.forEach((line) => {
      document.removeLineClass(line, 'background', 'highlighted-code-line');
    });

    const highlightedLines = [];
    editor.operation(() => {
      for (let line = safeStart; line <= safeEnd; line += 1) {
        document.addLineClass(line, 'background', 'highlighted-code-line');
        highlightedLines.push(line);
      }
      document.setCursor({ line: safeStart, ch: 0 });
    });

    highlightedLinesRef.current = highlightedLines;
    editor.refresh();
    editor.scrollTo(null, Math.max(editor.heightAtLine(safeStart, 'local') - 8, 0));
    editor.focus();
    return true;
  }, []);

  const fitDiagramToViewport = useCallback(() => {
    window.requestAnimationFrame(() => {
      const viewport = diagramViewportRef.current;
      const content = diagramRef.current;
      if (!viewport || !content) return;

      const contentWidth = Math.max(content.scrollWidth, 1);
      const scale = Math.min(Math.max((viewport.clientWidth - 28) / contentWidth, 0.4), 0.82);
      setDiagramTransform({
        x: Math.max((viewport.clientWidth - contentWidth * scale) / 2, 14),
        y: 18,
        scale
      });
    });
  }, []);

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
        fontFamily: 'Maven Pro, sans-serif'
      },
      flowchart: {
        curve: 'basis',
        htmlLabels: false,
        nodeSpacing: 28,
        rankSpacing: 72,
        useMaxWidth: true
      }
    });
  }, []);

  useEffect(() => {
    if (!isConnectOpen && !isInfoOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsConnectOpen(false);
        setIsInfoOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isConnectOpen, isInfoOpen]);

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
          diagramRef.current.querySelectorAll('.node').forEach((node) => {
            const label = node.textContent && node.textContent.trim();
            const sourceRange = label && label.match(/#(\d+)(?:-(\d+))?/);
            node.setAttribute('role', 'button');
            node.setAttribute('tabindex', '0');
            node.setAttribute('aria-label', label ? `Show source: ${label}` : 'Show source code');
            if (sourceRange) {
              node.dataset.sourceStart = sourceRange[1];
              node.dataset.sourceEnd = sourceRange[2] || sourceRange[1];
            }
          });
          fitDiagramToViewport();
        }
      } catch (error) {
        if (!cancelled) {
          const fallback = buildFallbackMermaid(source.javascript);
          if (mermaidCode !== fallback) {
            setMermaidCode(fallback);
            setGenerationState('completed');
            setErrorMessage('');
          } else {
            setGenerationState('error');
            setErrorMessage('The diagram format could not be repaired. Try generating it again.');
          }
        }
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [fitDiagramToViewport, mermaidCode, source.javascript]);

  useEffect(() => {
    setDiagramTransform({ x: 0, y: 0, scale: 1 });
  }, [mermaidCode]);

  useEffect(() => () => {
    if (cardResizeRef.current) cardResizeRef.current.finishResize();
  }, []);

  useEffect(() => {
    if (!pendingLineRange || activeFile !== pendingLineRange.file) return undefined;
    applySourceHighlight(pendingLineRange);
    return undefined;
  }, [activeFile, applySourceHighlight, pendingLineRange]);

  const clearCodeHighlights = () => {
    const editor = editorRef.current;
    if (editor) {
      const document = editor.getDoc();
      highlightedLinesRef.current.forEach((line) => {
        document.removeLineClass(line, 'background', 'highlighted-code-line');
      });
    }
    highlightedLinesRef.current = [];
    setPendingLineRange(null);
  };

  const updateActiveFile = (value) => {
    clearCodeHighlights();
    setSource((current) => ({ ...current, [activeFile]: value }));
    setHasPreviewed(false);
    setPreviewLoading(false);
    setMermaidCode('');
    if (generationState === 'error') {
      setGenerationState('idle');
      setErrorMessage('');
    }
  };

  const loadExample = (index) => {
    const nextSource = EXAMPLES[index].source;
    clearCodeHighlights();
    setSource(nextSource);
    setSelectedExample(index);
    setActiveFile('javascript');
    setMermaidCode('');
    setPreviewDocument('');
    setPreviewLoading(false);
    setHasPreviewed(false);
    setGenerationState('idle');
    setErrorMessage('');
    handlePreview(nextSource);
  };

  const clearWorkspace = () => {
    clearCodeHighlights();
    setSource(EMPTY_SOURCE);
    setActiveFile('javascript');
    setMermaidCode('');
    setPreviewDocument('');
    setPreviewLoading(false);
    setHasPreviewed(false);
    setGenerationState('idle');
    setErrorMessage('');
  };

  function handlePreview(previewSource = source) {
    const safeScript = previewSource.javascript.replace(/<\/script/gi, '<\\/script');
    const document = [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link href="https://fonts.googleapis.com/css2?family=Maven+Pro:wght@400..900&display=swap" rel="stylesheet">',
      '<style>' + previewSource.css + '</style>',
      '</head>',
      '<body>',
      previewSource.html || '<main style="font-family: Maven Pro, sans-serif; padding: 32px;">Add HTML to preview your interface.</main>',
      '<script>' + safeScript + '</script>',
      '</body>',
      '</html>'
    ].join('');

    setPreviewLoading(true);
    setPreviewDocument(document + `<!-- preview-${Date.now()} -->`);
    setHasPreviewed(false);
    setGenerationState('idle');
    setErrorMessage('');
  }

  const handleSubmit = async () => {
    if (!source.javascript.trim()) {
      setActiveFile('javascript');
      setGenerationState('error');
      setErrorMessage('Add JavaScript before generating a flowchart.');
      return;
    }

    if (!hasPreviewed) {
      setGenerationState('error');
      setErrorMessage(previewLoading
        ? 'Wait for the preview to finish loading before mapping it.'
        : 'Launch the preview first so you can check the code before mapping it.');
      return;
    }

    if (!aiAccess) {
      setIsConnectOpen(true);
      return;
    }

    setGenerationState('generating');
    setErrorMessage('');

    if (hasInstantFlowchart) {
      setMermaidCode(cleanMermaidSyntax(example.flowchart));
      setGenerationState('completed');
      return;
    }

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
    if (diagramDragRef.current.moved) {
      diagramDragRef.current.moved = false;
      return;
    }

    const node = event.target.closest('.node');
    const text = node && node.textContent;
    const match = text && text.match(/#(\d+)(?:-(\d+))?/);
    const sourceStart = node && node.dataset.sourceStart;
    const sourceEnd = node && node.dataset.sourceEnd;
    if (!sourceStart && !match) return;

    const start = Math.max(Number(sourceStart || match[1]) - 1, 0);
    const end = Math.max(Number(sourceEnd || match[2] || match[1]) - 1, start);
    diagramRef.current.querySelectorAll('.node.is-source-active').forEach((activeNode) => {
      activeNode.classList.remove('is-source-active');
    });
    node.classList.add('is-source-active');
    const range = { file: 'javascript', start, end, selectedAt: Date.now() };
    setActiveFile('javascript');
    setPendingLineRange(range);
    if (activeFile === 'javascript') applySourceHighlight(range);
  };

  const updateDiagramZoom = (nextScale, originX, originY) => {
    setDiagramTransform((current) => {
      const scale = Math.min(Math.max(nextScale, 0.45), 2.8);
      const viewport = diagramViewportRef.current;
      const centerX = originX == null && viewport ? viewport.clientWidth / 2 : originX || 0;
      const centerY = originY == null && viewport ? viewport.clientHeight / 2 : originY || 0;
      const contentX = (centerX - current.x) / current.scale;
      const contentY = (centerY - current.y) / current.scale;

      return {
        x: centerX - contentX * scale,
        y: centerY - contentY * scale,
        scale
      };
    });
  };

  const handleDiagramWheel = (event) => {
    event.preventDefault();
    const bounds = diagramViewportRef.current.getBoundingClientRect();
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    updateDiagramZoom(
      diagramTransform.scale * factor,
      event.clientX - bounds.left,
      event.clientY - bounds.top
    );
  };

  const handleDiagramPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest('.node')) return;
    diagramDragRef.current = {
      active: true,
      moved: false,
      x: event.clientX,
      y: event.clientY
    };
    setIsDiagramDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDiagramPointerMove = (event) => {
    const drag = diagramDragRef.current;
    if (!drag.active) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 3) drag.moved = true;
    drag.x = event.clientX;
    drag.y = event.clientY;
    setDiagramTransform((current) => ({ ...current, x: current.x + deltaX, y: current.y + deltaY }));
  };

  const handleDiagramPointerUp = (event) => {
    diagramDragRef.current.active = false;
    setIsDiagramDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const beginCardResize = (event, card, minHeight) => {
    event.preventDefault();
    const startHeight = cardHeights[card];
    const startY = event.pageY;

    const continueResize = (moveEvent) => {
      const height = Math.max(minHeight, startHeight + moveEvent.pageY - startY);
      setCardHeights((current) => ({ ...current, [card]: Math.round(height) }));
    };

    const finishResize = () => {
      window.removeEventListener('mousemove', continueResize);
      window.removeEventListener('mouseup', finishResize);
      cardResizeRef.current = null;
      window.setTimeout(() => editorRef.current && editorRef.current.refresh(), 0);
    };

    cardResizeRef.current = { card, finishResize };
    window.addEventListener('mousemove', continueResize);
    window.addEventListener('mouseup', finishResize);
  };

  const resizeCardWithKeyboard = (event, card, minHeight) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const change = event.key === 'ArrowUp' ? -32 : 32;
    setCardHeights((current) => ({
      ...current,
      [card]: Math.max(minHeight, current[card] + change)
    }));
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
          <button
            className="info-button"
            type="button"
            aria-label="About Flow"
            title="What is Flow?"
            onClick={() => {
              setIsConnectOpen(false);
              setIsInfoOpen(true);
            }}
          >
            i
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="glass-panel editor-panel resizable-card" style={{ height: cardHeights.editor }} aria-label="Code workspace" title="Drag the bottom handle to make this card taller or shorter">
          <header className="editor-heading">
            <div>
              <h1 className="card-title">1. Code</h1>
            </div>

            <div className="example-library" aria-label="Example code library">
              <div className="example-library-heading">
                <span>Creative code library</span>
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
                  Load &amp; preview
                </button>
              </div>
              {example.description && <p className="example-description">{example.description}</p>}
              <p className="own-code-note">You can also paste your own creative-coding example into the editor below.</p>
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
              Load an example or paste your own code
              <small>
                {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {activeMeta.label}
                {pendingLineRange && activeFile === 'javascript'
                  ? ` · Showing ${pendingLineRange.start + 1}${pendingLineRange.end > pendingLineRange.start ? `–${pendingLineRange.end + 1}` : ''}`
                  : ''}
              </small>
            </span>
            <span className="resize-hint">Drag corner to resize</span>
          </footer>
          <button
            className="card-resize-handle"
            type="button"
            aria-label="Resize code card vertically"
            onMouseDown={(event) => beginCardResize(event, 'editor', 560)}
            onKeyDown={(event) => resizeCardWithKeyboard(event, 'editor', 560)}
          ><span aria-hidden="true" /></button>
        </section>

        <div className="right-column" aria-label="Preview and flowchart workspace">
        <section className="glass-panel preview-panel resizable-card" style={{ height: cardHeights.preview }} aria-label="Live preview" title="Drag the bottom handle to make this card taller or shorter">
          <header className="card-toolbar">
            <h2 className="card-title">2. Preview</h2>
            <button
              className="button button-preview"
              type="button"
              onClick={() => handlePreview()}
              disabled={!hasSource || previewLoading}
            >
              <strong aria-hidden="true">▶</strong>
              {previewLoading ? 'Loading preview…' : previewDocument ? 'Reload preview' : 'Launch preview'}
            </button>
          </header>

          <div className="output-stage preview-stage">
            {previewDocument ? (
              <iframe
                className="preview-frame"
                title="Live code preview"
                sandbox="allow-scripts"
                srcDoc={previewDocument}
                onLoad={() => {
                  setPreviewLoading(false);
                  setHasPreviewed(true);
                }}
              />
            ) : (
              <div className="empty-state compact">
                <span className="preview-symbol" aria-hidden="true">↗</span>
                <h2>See the code in motion.</h2>
                <p>The preview loads scripts and animation systems in an isolated canvas.</p>
              </div>
            )}

            {previewLoading && (
              <div className="preview-loading" role="status" aria-live="polite">
                <span className="motion-symbol" aria-hidden="true"><i /><i /><i /></span>
                <strong>Launching the animation</strong>
                <p>Loading libraries, geometry, and the first frame…</p>
              </div>
            )}
          </div>

          {(previewLoading || !hasPreviewed) && (
            <footer className="card-footer">
              <span className={'status-dot ' + (previewLoading ? 'is-loading' : '')} aria-hidden="true" />
              <span>{previewLoading ? 'Preparing preview' : 'Waiting for code'}</span>
            </footer>
          )}
          <button
            className="card-resize-handle"
            type="button"
            aria-label="Resize preview card vertically"
            onMouseDown={(event) => beginCardResize(event, 'preview', 240)}
            onKeyDown={(event) => resizeCardWithKeyboard(event, 'preview', 240)}
          ><span aria-hidden="true" /></button>
        </section>

        <section className="glass-panel flowchart-panel resizable-card" style={{ height: cardHeights.flowchart }} aria-label="Generated flowchart" title="Drag the bottom handle to make this card taller or shorter">
          <header className="card-toolbar">
            <h2 className="card-title">3. Flowchart</h2>
            <button
              className="button button-flowchart"
              type="button"
              onClick={handleSubmit}
              disabled={generationState === 'generating' || !hasSource || !hasPreviewed}
            >
              <span className={generationState === 'generating' ? 'spark is-thinking' : 'spark'} aria-hidden="true">✦</span>
              {generationState === 'generating' ? 'Mapping…' : 'Generate flowchart'}
            </button>
          </header>

          <div className="output-stage flowchart-stage">
            {!hasPreviewed && !previewLoading && !mermaidCode && (
              <div className="empty-state compact">
                <div className="flow-glyph" aria-hidden="true"><span /><span /><span /></div>
                <span className="empty-step">Preview first</span>
                <h2>The map follows the motion.</h2>
                <p>Launch the preview before generating the code structure.</p>
              </div>
            )}

            {previewLoading && !mermaidCode && (
              <div className="empty-state compact">
                <span className="thinking-orbit" aria-hidden="true"><i /></span>
                <h2>Preview is still loading.</h2>
                <p>The flowchart unlocks after the first frame is ready.</p>
              </div>
            )}

            {hasPreviewed && !aiAccess && !mermaidCode && (
              <div className="api-gate">
                <span className="empty-step">AI access required</span>
                <h2>Connect before mapping.</h2>
                <button className="button button-soft" type="button" onClick={() => setIsConnectOpen(true)}>
                  Connect AI
                </button>
              </div>
            )}

            {hasPreviewed && aiAccess && !mermaidCode && generationState !== 'generating' && (
              <div className="empty-state compact">
                <span className="preview-symbol" aria-hidden="true">✦</span>
                <h2>{hasInstantFlowchart ? 'Instant map ready.' : 'Ready to understand the system.'}</h2>
                <p>{hasInstantFlowchart ? 'This archived example includes a prebuilt, non-linear flowchart.' : 'AI will trace dependencies, loops, branches, and parallel systems.'}</p>
              </div>
            )}

            {generationState === 'generating' && (
              <div className="thinking-state" aria-live="polite">
                <span className="thinking-orbit" aria-hidden="true"><i /></span>
                <strong>Understanding your code</strong>
                <p>Mapping dependencies, decisions, and relationships.</p>
              </div>
            )}

            {mermaidCode && (
              <>
                <div className="diagram-controls" aria-label="Flowchart zoom controls">
                  <button type="button" onClick={() => updateDiagramZoom(diagramTransform.scale / 1.2)} aria-label="Zoom out">−</button>
                  <span>{Math.round(diagramTransform.scale * 100)}%</span>
                  <button type="button" onClick={() => updateDiagramZoom(diagramTransform.scale * 1.2)} aria-label="Zoom in">+</button>
                  <button
                    className="diagram-reset"
                    type="button"
                    onClick={fitDiagramToViewport}
                  >
                    Reset
                  </button>
                </div>
                <div
                  className={'diagram-viewport' + (isDiagramDragging ? ' is-dragging' : '')}
                  ref={diagramViewportRef}
                  onWheel={handleDiagramWheel}
                  onPointerDown={handleDiagramPointerDown}
                  onPointerMove={handleDiagramPointerMove}
                  onPointerUp={handleDiagramPointerUp}
                  onPointerCancel={handleDiagramPointerUp}
                >
                  <div
                    className="diagram-canvas"
                    style={{ transform: `translate(${diagramTransform.x}px, ${diagramTransform.y}px) scale(${diagramTransform.scale})` }}
                  >
                    <div
                      className="diagram-container"
                      ref={diagramRef}
                      onClick={handleDiagramClick}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleDiagramClick(event);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="diagram-help">Drag to pan · Scroll to zoom · Select a node to reveal its code</div>
              </>
            )}
          </div>

          <footer className={'ai-status ' + currentStatus.tone} aria-live="polite">
            <span className="ai-indicator" aria-hidden="true"><i /></span>
            <div>
              <strong>{currentStatus.label}</strong>
              <span>{errorMessage || currentStatus.detail}</span>
            </div>
            {generationState === 'error' && source.javascript.trim() && (
              <button className="button button-tertiary" type="button" onClick={handleSubmit}>Try again</button>
            )}
          </footer>
          <button
            className="card-resize-handle"
            type="button"
            aria-label="Resize flowchart card vertically"
            onMouseDown={(event) => beginCardResize(event, 'flowchart', 420)}
            onKeyDown={(event) => resizeCardWithKeyboard(event, 'flowchart', 420)}
          ><span aria-hidden="true" /></button>
        </section>
        </div>

        <section className="glass-panel output-panel legacy-output-panel" aria-hidden="true">
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
                    onClick={() => handlePreview()}
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

      {isInfoOpen && (
        <div className="modal-backdrop">
          <section
            className="connect-modal info-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-title"
          >
            <header className="connect-modal-header">
              <div>
                <span className="eyebrow">About Flow</span>
                <h2 id="info-title">See how creative code works.</h2>
              </div>
              <button
                className="modal-close"
                type="button"
                aria-label="Close information"
                onClick={() => setIsInfoOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="info-content">
              <p>Flow turns creative JavaScript into a live preview and a concise, clickable structure map.</p>
              <ol>
                <li>Load an example or paste your own HTML, CSS, and JavaScript.</li>
                <li>Check the work in the live preview.</li>
                <li>Generate the flowchart, then select any node to reveal its source lines.</li>
              </ol>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
