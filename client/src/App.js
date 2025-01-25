import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-darker.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import './styles.css';

const App = () => {
  const [code, setCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [llmInput, setLlmInput] = useState('');
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);

  const jsEditorRef = useRef(null);
  const htmlEditorRef = useRef(null);
  const cssEditorRef = useRef(null);

  useEffect(() => {
    if (mermaidCode) {
      mermaid.initialize({ startOnLoad: true });
      try {
        mermaid.contentLoaded();
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error);
      }
    }
  }, [mermaidCode]);

  useEffect(() => {
    if (jsEditorRef.current) {
      jsEditorRef.current.editor.on('change', () => {
        setCode(jsEditorRef.current.editor.getValue());
      });
    }
  }, []);

  const extractNodesAndLogic = (mermaidCode) => {
    const lines = mermaidCode.split('\n');
    const extractedNodes = new Map();
    const extractedConnections = [];
    const subgraphs = new Map();
    let currentSubgraph = null;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('subgraph')) {
        currentSubgraph = trimmedLine.split(' ')[1];
        subgraphs.set(currentSubgraph, []);
      } else if (trimmedLine === 'end') {
        currentSubgraph = null;
      } else if (trimmedLine.includes('[') && trimmedLine.includes(']')) {
        const nodeMatch = trimmedLine.match(/(\w+)\[([^\]]+)\]/);
        if (nodeMatch) {
          const [, id, label] = nodeMatch;
          if (!extractedNodes.has(id)) {
            const node = {
              id,
              label,
              x: 0,
              y: 0,
              subgraph: currentSubgraph
            };
            extractedNodes.set(id, node);
            if (currentSubgraph) {
              subgraphs.get(currentSubgraph).push(id);
            }
          }
        }
      } else if (trimmedLine.includes('-->')) {
        const connectionMatch = trimmedLine.match(/(\w+)\s*-->\s*(\w+)/);
        if (connectionMatch) {
          extractedConnections.push({ from: connectionMatch[1], to: connectionMatch[2] });
        }
      }
    });

    // Calculate positions
    const nodeArray = Array.from(extractedNodes.values());
    const subgraphArray = Array.from(subgraphs.entries());
    const subgraphSpacing = 300;
    const nodeSpacing = 150;

    subgraphArray.forEach(([subgraphName, nodeIds], subgraphIndex) => {
      const subgraphX = subgraphIndex * subgraphSpacing;
      nodeIds.forEach((nodeId, nodeIndex) => {
        const node = extractedNodes.get(nodeId);
        node.x = subgraphX + (nodeIndex % 3) * nodeSpacing;
        node.y = Math.floor(nodeIndex / 3) * nodeSpacing;
      });
    });

    // Handle nodes not in subgraphs
    const unassignedNodes = nodeArray.filter(node => !node.subgraph);
    unassignedNodes.forEach((node, index) => {
      node.x = (subgraphArray.length + 1) * subgraphSpacing + (index % 3) * nodeSpacing;
      node.y = Math.floor(index / 3) * nodeSpacing;
    });

    setNodes(nodeArray);
    setConnections(extractedConnections);

    // Convert the extracted nodes into a tree structure
    const buildTreeStructure = () => {
        const tree = {
            name: "Code Structure",
            lineNumbers: "1-1000",
            children: []
        };

        // Group nodes by subgraph
        subgraphs.forEach((nodeIds, subgraphName) => {
            const subgraphNode = {
                name: subgraphName,
                lineNumbers: "",
                children: nodeIds.map(id => {
                    const node = extractedNodes.get(id);
                    return {
                        name: node.label,
                        lineNumbers: node.label.match(/#(\d+-\d+|\d+)/)?.[1] || ""
                    };
                })
            };
            tree.children.push(subgraphNode);
        });

        // Add unassigned nodes
        const unassignedNodes = Array.from(extractedNodes.values())
            .filter(node => !node.subgraph)
            .map(node => ({
                name: node.label,
                lineNumbers: node.label.match(/#(\d+-\d+|\d+)/)?.[1] || ""
            }));

        if (unassignedNodes.length > 0) {
            tree.children.push({
                name: "Other",
                lineNumbers: "",
                children: unassignedNodes
            });
        }

        return tree;
    };

    const treeData = buildTreeStructure();
    return treeData;
  };

  const handleSubmit = async () => {
    try {
        console.log("Submit button clicked.");
        
        if (!code || !htmlCode || !cssCode) {
            console.error("All code sections must be provided.");
            return;
        }

        // Calculate longest section
        const codeSections = [
            { type: 'JavaScript', content: code },
            { type: 'HTML', content: htmlCode },
            { type: 'CSS', content: cssCode }
        ];
         // Always use JavaScript section regardless of length
        const longestSection = codeSections.find(section => section.type === 'JavaScript');
        //const longestSection = codeSections.reduce((longest, current) => 
         //   current.content.length > longest.content.length ? current : longest
        //);
        longestSection.type = 'JavaScript';

        const response = await axios.post('http://localhost:5000/generate-flowchart', { 
            code, 
            htmlCode, 
            cssCode,
            longestSection: 'JavaScript'
        });

        setMermaidCode(response.data.mermaid);
        const treeData = extractNodesAndLogic(response.data.mermaid);
        
        const container = document.getElementById('chart-container');
        if (!container) {
            console.error('Chart container not found');
            return;
        }

        // Define the mermaid diagram
        const mermaidDiagram = response.data.mermaid;
        container.innerHTML = `<div class="mermaid">${mermaidDiagram}</div>`;

        // Initialize mermaid
        mermaid.initialize({ 
            startOnLoad: true,
            securityLevel: 'loose', // Allows clicks
            flowchart: {
                htmlLabels: true
            }
        });

        // Render the diagram
        try {
            const { svg } = await mermaid.render('graphDiv', mermaidDiagram);
            container.innerHTML = svg;

            // Add click handlers after rendering
            setTimeout(() => {
                const nodes = container.querySelectorAll('.node');
                nodes.forEach(node => {
                    node.style.cursor = 'pointer';
                    node.addEventListener('click', (e) => {
                        const labelElement = node.querySelector('.label');
                        if (labelElement) {
                            handleNodeClick({ label: labelElement.textContent });
                        }
                    });
                });
            }, 100);
        } catch (renderError) {
            console.error('Mermaid render error:', renderError);
        }
    } catch (error) {
        console.error('Error generating flowchart:', error);
    }
  };

  const handlePreview = () => {
    const previewFrame = document.getElementById('preview-frame');
    if (!previewFrame) {
      console.error('Preview frame not found');
      return;
    }
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <style>${cssCode}</style>
        </head>
        <body>
          ${htmlCode}
          <script>${code}</script>
        </body>
      </html>
    `);
    doc.close();
  };
/*
  const handleLLMChat = async () => {
    try {
      console.log('Sending request to server:', { llmInput, code, htmlCode, cssCode });
      const response = await axios.post('http://localhost:5000/llm-chat', {
        llmInput,
        code,
        htmlCode,
        cssCode
      });
      
      console.log('Received response from server:', response.data);
  
      if (response.data.updatedCode) {
        console.log('Updated code:', response.data.updatedCode);
        setCode(response.data.updatedCode.js || code);
        setHtmlCode(response.data.updatedCode.html || htmlCode);
        setCssCode(response.data.updatedCode.css || cssCode);
      }
    } catch (error) {
      console.error('Error communicating with LLM:', error);
    }
  };

  const renderInteractiveFlowchart = () => {
    return (
      <div className="interactive-flowchart">
        <svg className="connections" width="100%" height="100%">
          {connections.map((connection, index) => {
            const fromNode = nodes.find(node => node.id === connection.from);
            const toNode = nodes.find(node => node.id === connection.to);
            if (fromNode && toNode) {
              return (
                <line
                  key={index}
                  x1={fromNode.x + 100}
                  y1={fromNode.y + 20}
                  x2={toNode.x + 100}
                  y2={toNode.y + 20}
                  stroke="black"
                  strokeWidth="2"
                />
              );
            }
            return null;
          })}
        </svg>
        <div className="node-buttons">
          {nodes.map(node => (
            <button
              key={node.id}
              className="node-button"
              onClick={() => handleNodeClick(node)}
              style={{
                position: 'absolute',
                left: `${node.x}px`,
                top: `${node.y}px`,
              }}
            >
              {node.label}
            </button>
          ))}
        </div>
      </div>
    );
  };
*/
  const handleNodeClick = (node) => {
    // Clear any existing highlights
    if (jsEditorRef.current) {
      const doc = jsEditorRef.current.editor.getDoc();
      const marks = doc.getAllMarks();
      marks.forEach(mark => mark.clear());
    }

    // Assuming node.label contains the line numbers for JavaScript
    const lineNumbers = node.label.match(/#(\d+-\d+|\d+)/)?.[1];
    if (lineNumbers && jsEditorRef.current) {
      const [start, end] = lineNumbers.split('-').map(num => parseInt(num) - 1);
      const doc = jsEditorRef.current.editor.getDoc();
      
      // Highlight the specified lines in JavaScript editor only
      doc.markText(
        { line: start, ch: 0 },
        { line: end, ch: doc.getLine(end).length },
        { className: 'highlighted-line' }
      );
      
      // Scroll to the highlighted section
      jsEditorRef.current.editor.scrollIntoView({ line: start, ch: 0 }, 100);
    }
  };
/*
  const extractLineNumbers = (label) => {
    console.log('Extracting line numbers from label:', label);
    const match = label.match(/#(\d+)(?:-(\d+))?/);
    console.log('Regex match result:', match);
    
    if (match) {
        const start = parseInt(match[1]);
        const end = match[2] ? parseInt(match[2]) : start;
        console.log('Extracted start:', start, 'end:', end);
        return { start, end };
    }
    console.warn('No line numbers found in label');
    return null;
  };

  const highlightLines = (lineNumbers) => {
    console.log('Highlighting lines:', lineNumbers);
    if (!lineNumbers) {
      console.log('No line numbers to highlight');
      return;
    }

    const { start, end } = lineNumbers;
    console.log('Start line:', start, 'End line:', end);

    let editor;
    if (code.length >= htmlCode.length && code.length >= cssCode.length) {
      editor = jsEditorRef.current.editor;
      console.log('Using JS editor');
    } else if (htmlCode.length >= code.length && htmlCode.length >= cssCode.length) {
      editor = htmlEditorRef.current.editor;
      console.log('Using HTML editor');
    } else {
      editor = cssEditorRef.current.editor;
      console.log('Using CSS editor');
    }

    if (!editor) {
      console.error('No editor reference found');
      return;
    }

    // Clear all previous highlights
    editor.operation(() => {
      editor.getAllMarks().forEach(mark => mark.clear());
      for (let i = 0; i < editor.lineCount(); i++) {
        editor.removeLineClass(i, 'background', 'highlighted-line');
      }
    });

    // Add new highlight
    editor.operation(() => {
      for (let i = start; i <= end; i++) {
        console.log('Adding highlight to line', i);
        editor.addLineClass(i - 1, 'background', 'highlighted-line');
      }
    });

    // Scroll to the highlighted area
    console.log('Scrolling to line', start);
    editor.scrollIntoView({ line: start - 1, ch: 0 }, 100);
  };
*/
  const setDefaultCode = () => {
    setCode(`console.clear();

var ww = window.innerWidth,
  wh = window.innerHeight;

var renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("canvas"),
  antialias: true
});
renderer.setSize(ww, wh);
renderer.setClearColor(0x000000);

var scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 100, 160);

var camera = new THREE.PerspectiveCamera(45, ww / wh, 0.1, 1000);
camera.position.y = 30;
camera.position.z = 100;
TweenMax.to(camera.position, 6, {
  z: 50,
  y: 80,
  yoyo:true,
  ease: Power1.easeInOut,
  repeatDelay: 0.5,
  repeat: -1
});


var container = new THREE.Object3D();
scene.add(container);

TweenMax.to(container.rotation, 48, {
  y:Math.PI*2,
  ease:Power0.easeNone
});

var loader = new THREE.TextureLoader();
loader.crossOrigin = 'Anonymous';
/* Options */
var dots, plane;
var width = 150, 
    height = 150;
var center = new THREE.Vector3(0, 0, 0);
var maxDistance = new THREE.Vector3(width*0.5, height*0.5).distanceTo(center);

function createDots() {
  var geom = new THREE.Geometry();
  
  var planeGeom = new THREE.PlaneGeometry( width * 2, height *2, width, height );
  var m = new THREE.Matrix4();
  m.makeRotationX(-Math.PI*0.5);
  planeGeom.applyMatrix(m);
  for(var i=0;i<planeGeom.vertices.length;i++){
    var vector = planeGeom.vertices[i];
    vector.dist = vector.distanceTo(center);
    vector.ratio = (maxDistance - vector.dist) / (maxDistance * 0.1);
  }
  var planeMat = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} );
  plane = new THREE.Mesh( planeGeom, planeMat );
  container.add( plane );
  
  for(var x=(-width*0.5);x<width*0.5;x++){
    for(var z=(-height*0.5);z<height*0.5;z++){
      var vector = new THREE.Vector3(x * 1.2, 0, z * 1.2);
      vector.dist = vector.distanceTo(center);
      vector.ratio = (maxDistance - vector.dist) / (maxDistance * 0.9);
      geom.vertices.push(vector);
    }
  }
  var mat = new THREE.PointsMaterial({
    color:0xffffff,
    map: loader.load('https://collectionapi.metmuseum.org/api/collection/v1/iiif/436533/796180/main-image'),
    transparent: true,
    alphaTest: 0.4,
    size : 2,
    sizeAttenuation: false 
  });
  dots = new THREE.Points(geom, mat);
  container.add(dots);
}

var ease = {
  hole: 0,
  depth: 0
};
TweenMax.to(ease,  6, {
  hole: 2,
  depth: 1.5,
  yoyo: true,
  ease: Power1.easeInOut,
  repeatDelay: 0.5,
  repeat: -1
});
function render(a){
  
  requestAnimationFrame(render);

  for(var i=0;i<dots.geometry.vertices.length;i++){
    var vector = dots.geometry.vertices[i];
    ratioA = (vector.ratio * ease.depth) + ease.hole;
    ratioA*= vector.ratio * vector.ratio * vector.ratio * vector.ratio;
    vector.y = ratioA * -150;
    vector.y = Math.max(vector.y, -100);
    vector.y += Math.sin(-(vector.dist*0.4) + (a * 0.004));
  }
  for(var i=0;i<plane.geometry.vertices.length;i++){
    var vector = plane.geometry.vertices[i];
    ratioA = (vector.ratio * ease.depth) + ease.hole;
    ratioA*= vector.ratio * vector.ratio * vector.ratio * vector.ratio;
    vector.y = ratioA * -150;
    vector.y = Math.max(vector.y, -100);
    vector.y += Math.sin(-(vector.dist*0.4) + (a * 0.004));
  }

  dots.geometry.verticesNeedUpdate = true;
  plane.geometry.verticesNeedUpdate = true;
  
  camera.lookAt(new THREE.Vector3(0, -20, 0));
  
  renderer.render(scene, camera);
}
createDots();
requestAnimationFrame(render);

window.addEventListener("resize", onResize);

function onResize() {
  ww = window.innerWidth;
  wh = window.innerHeight;
  camera.aspect = ww / wh;
  camera.updateProjectionMatrix();
  renderer.setSize(ww, wh);
} 
`);
    setHtmlCode(`<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/84/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.20.0/TweenMax.min.js"></script>
</head>
<body>
    
</body>
</html>
<canvas></canvas>`);
    setCssCode(`body{
  margin: 0;
  overflow: hidden;
}
canvas {
  position: absolute;
  top:0;
  left:0;
}`);
  };

  const setDefaultCodeOption2 = () => {
    setCode(`var tl = anime.timeline({
    easing: 'easeOutInBounce',
    direction: 'alternate',
    loop: true
  });

  // define letters
  const L = [20, 40, 60, 80, 81, 82];
  const I = [20, 40, 60, 80];

  // Define word
  const LILI = L.map(num => num + 3)
    .concat(I.map(num => num + 8))
    .concat(L.map(num => num + 11))
    .concat(I.map(num => num + 16));

  const circles = document.querySelectorAll('.el');

  // Get LILI circles using the indices in LILI
  const LILI_circles = LILI.map(index => circles[index]);

  // Get the background circles by excluding indices in LILI
  const background_circles = Array.from(circles).filter((el, index) => !LILI.includes(index));

  tl.add({
    targets: LILI_circles,
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    rotateX: 180,
    duration: 500,
    delay: anime.stagger(200, {grid: [14, 5], from: 'center'}),
  });

  tl.add({
    targets: background_circles,
    rotateX: 180,
    duration: 500,
    delay: anime.stagger(200, {grid: [14, 5], from: 'center'}),
  }, 0);

  tl.add({
    targets: LILI_circles,
    backgroundColor: '#FFFFFF',
    duration: 2000,
  });`);

    setHtmlCode(`<!DOCTYPE html>
    <html lang="en">
    <head>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    </head>
    <body>
      <div class="spiral-animation-demo">
        ${Array(110).fill('<div class="el"></div>').join('\n        ')}
      </div>
    </body>
    </html>`);

    setCssCode(`body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #C8C8C8;
    }

    .spiral-animation-demo {
      display: grid;
      grid-template-columns: repeat(20, 50px); 
      grid-template-rows: repeat(6, 50px);
      gap: 10px;
    }

    .el {
      border: 4px solid white;
      width: 50px;
      height: 50px;
      background-color: black;
      border-radius: 50%;
    }`);
  };

  return (
    <div className="app">
      <div className="input-section">
        <div className="editors-container">
          <div className="input-container">
            <CodeMirror
              value={code}
              options={{
                mode: 'javascript',
                theme: 'material-darker',
                lineNumbers: true
              }}
              onChange={(editor, data, value) => setCode(value)}
              ref={jsEditorRef}
            />
            <CodeMirror
              value={htmlCode}
              options={{
                mode: 'htmlmixed',
                theme: 'material-darker',
                lineNumbers: true
              }}
              onChange={(editor, data, value) => setHtmlCode(value)}
              ref={htmlEditorRef}
            />
            <CodeMirror
              value={cssCode}
              options={{
                mode: 'css',
                theme: 'material-darker',
                lineNumbers: true
              }}
              onChange={(editor, data, value) => setCssCode(value)}
              ref={cssEditorRef}
            />
            <div className="button-group">
              <button onClick={handleSubmit}>Generate Flowchart</button>
              <button onClick={handlePreview}>Preview</button>
              <button onClick={setDefaultCode}>Load Default Code</button>
              <button onClick={setDefaultCodeOption2}>Load Default Code 2</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="right-section">
        <div className="flowchart-section">
          <h2>Flowchart Preview</h2>
          <div id="chart-container"></div>
        </div>
        <div className="preview-section">
          <h3>Code Preview</h3>
          <iframe id="preview-frame" title="Code Preview"></iframe>
        </div>
      </div>
    </div>
  );
};

export default App;
