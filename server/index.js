const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();  
const OpenAI = require('openai');

const app = express();
const PORT = Number(process.env.PORT || 5050);
const HOST = process.env.HOST || '127.0.0.1';
const DEMO_TRIAL_LIMIT = Number(process.env.DEMO_TRIAL_LIMIT || 5);
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const demoUsage = new Map();

app.set('trust proxy', 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by Flow.'));
  },
  allowedHeaders: ['Content-Type', 'X-OpenAI-Api-Key', 'X-Demo-Password']
}));
app.use(bodyParser.json({ limit: '1mb' }));

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getDemoUsage(req) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${req.ip || 'local'}:${day}`;
  const used = demoUsage.get(key) || 0;
  return { key, used, remaining: Math.max(DEMO_TRIAL_LIMIT - used, 0) };
}

function resolveAccess(req) {
  const personalKey = req.get('X-OpenAI-Api-Key');
  if (personalKey) {
    if (personalKey.trim().length < 20) {
      return { error: 'That API key looks incomplete.', status: 400 };
    }
    return { apiKey: personalKey.trim(), mode: 'personal' };
  }

  const suppliedDemoPassword = req.get('X-Demo-Password');
  if (!suppliedDemoPassword) {
    return { error: 'Connect AI before generating a flowchart.', status: 401 };
  }

  if (!process.env.DEMO_PASSWORD || !process.env.OPENAI_API_KEY) {
    return {
      error: 'Demo access is not configured yet. The creator can enable it after adding the server key.',
      status: 503
    };
  }

  if (!safeCompare(suppliedDemoPassword, process.env.DEMO_PASSWORD)) {
    return { error: 'That demo password is not valid.', status: 401 };
  }

  const usage = getDemoUsage(req);
  if (usage.remaining <= 0) {
    return { error: 'This device has used today’s demo trials. Try again tomorrow.', status: 429 };
  }

  return {
    apiKey: process.env.OPENAI_API_KEY,
    mode: 'demo',
    usage
  };
}

app.get('/health', (req, res) => {
  res.json({ ok: true, demoConfigured: Boolean(process.env.DEMO_PASSWORD && process.env.OPENAI_API_KEY) });
});

app.post('/session/connect', (req, res) => {
  const access = resolveAccess(req);
  if (access.error) return res.status(access.status).json({ error: access.error });

  return res.json({
    connected: true,
    mode: access.mode,
    remaining: access.mode === 'demo' ? access.usage.remaining : null
  });
});

 
function mergePartialUpdate(original, update) {
  if (!update || update === original) return original;

  const originalLines = original.split('\n');
  const updateLines = update.split('\n');

  
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < originalLines.length; i++) {
    if (originalLines[i].trim() === updateLines[0].trim()) {
      startIndex = i;
      endIndex = i + updateLines.length;
      break;
    }
  }

  // If we couldn't find the exact match, fall back 
  if (startIndex === -1) {
    for (let i = 0; i < originalLines.length; i++) {
      if (originalLines[i].includes(updateLines[0].trim())) {
        startIndex = i;
        endIndex = i + updateLines.length;
        break;
      }
    }
  }

  // If we still couldn't find a match, return the original code
  if (startIndex === -1) {
    console.warn("Couldn't find the update location in the original code. Returning original code.");
    return original;
  }

  // Merge the update into the original
  return [
    ...originalLines.slice(0, startIndex),
    ...updateLines,
    ...originalLines.slice(endIndex)
  ].join('\n');
}
app.post('/generate-flowchart', async (req, res) => {
  const { code, htmlCode, cssCode, longestSection } = req.body;
  const access = resolveAccess(req);

  if (access.error) {
      return res.status(access.status).json({ error: access.error });
  }

  if (!code || !htmlCode || !cssCode || !longestSection) {
      console.error("All code sections and longest section must be provided.");
      return res.status(400).json({ error: 'All code sections and longest section must be provided.' });
  }

  try {
      const openai = new OpenAI({ apiKey: access.apiKey });

      const prompt = `Create a concise Mermaid flowchart for this JavaScript:

${code}

Return only raw Mermaid syntax and follow every rule:
- Begin with flowchart TD.
- Use Root["Code structure"] as the root node.
- Use simple IDs such as A, B, C.
- Put every label inside double quotes.
- Every non-root label must end with its exact source marker, such as #6 or #6-12.
- Labels may contain only words, spaces, numbers, parentheses, hyphens, colons, and the source marker.
- Do not output click, callback, style, class, classDef, HTML, Markdown fences, or comments.
- Map real dependencies: connect setup, data construction, animation, rendering, interaction, and resize systems to the functions they call or affect.
- Show conditions and loop branches when they materially change execution.
- Use subgraphs when the code has parallel systems. Do not force independent systems into one linear chain.
- Every node ID must be unique and defined only once.
- Prefer 8 to 14 nodes and never exceed 14 nodes.
- Combine low-level implementation steps into concise system-level nodes.
- Prioritize accurate dependencies over exhaustive detail.`;

      const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
              {
                  role: "system",
                  content: "You are a helpful assistant that generates Mermaid flowchart syntax based on code analysis."
              },
              {
                  role: "user",
                  content: prompt
              }
          ],
          temperature: 0.2,
      });

      const mermaidCode = completion.choices[0].message.content;
      if (access.mode === 'demo') {
          demoUsage.set(access.usage.key, access.usage.used + 1);
      }
      res.json({ mermaid: mermaidCode });

  } catch (error) {
      const status = error.status || 500;
      const message = status === 401
          ? 'The OpenAI API key was rejected.'
          : 'Flow could not generate the chart. Please try again.';
      console.error("Error generating flowchart:", error.message);
      res.status(status).json({ error: message });
  }
});
// POST endpoint to handle the JavaScript code input
app.post('/generate-flowchart-de', async (req, res) => {
    const { code, htmlCode, cssCode, longestSection } = req.body;

    if (!code || !htmlCode || !cssCode || !longestSection) {
        console.error("All code sections and longest section must be provided.");
        return res.status(400).send('All code sections and longest section must be provided.');
    }

    try {
        console.log("Received code:", code);
        console.log("Received HTML:", htmlCode);
        console.log("Received CSS:", cssCode);
        console.log("Longest section:", longestSection);

        // Set the default Mermaid syntax
        const defaultMermaidSyntax =`
        graph LR
    Root[Structure of Code]

    Root --> A[1.Three.js Setup #6-38]
    Root --> B[2.Create Dot Geometry #46-80]
    Root --> C[3.Animate Dot Geometry #82-121]
    Root --> D[4.Handle Window Resize #125-133]

    A --> E[Set size #10]
    A --> F[Create a scene #13-14]
    A --> G[Setup Camera #16-26]
    G --> H[Position Camera #17-26]
    A --> I[Add 3D Object Container #29-30]
    A --> J[Add a texture loader #37-38]

    B --> K[Setup vectors #53-69]
    B --> L[Setup material properties #70-80]

    %% Add Clicks
    click A callback "Click for lines 6-38"
    click B callback "Click for lines 46-80"
    click C callback "Click for lines 82-121"
    click D callback "Click for lines 125-133"
    click E callback "Click for lines 10"
    click F callback "Click for lines 13-14"
    click G callback "Click for lines 16-26"
    click H callback "Click for lines 17-26"
    click I callback "Click for lines 29-30"
    click J callback "Click for lines 37-38"
    click K callback "Click for lines 53-69"
    click L callback "Click for lines 70-80"

    %% Styles
    style Root fill:#e5e5e5
    style A fill:#c6b5ff
    style B fill:#c6b5ff
    style C fill:#c6b5ff
    style D fill:#c6b5ff
    style E fill:#ffd966
    style F fill:#ffd966
    style G fill:#ffd966
    style H fill:#97d077
    style I fill:#ffd966
    style J fill:#ffd966
    style K fill:#ffd966
    style L fill:#ffd966

`;/*graph TD
A[Start #1-10] --> B[Process]
B --> C[End]
click A callback "Click for lines 1-10"
click B callback "Click for lines 11-20"
click C callback "Click for lines 21-30"`;graph LR
        U[Flowchart] --> A[1.Three.JS Setup]
        U --> B[2.Create Dot Geometry]
        U --> K[3.Animate Dot Geometry]
        U --> L[4.Handle Window Resize]
    
        A --> C[Set size]
        A --> D[Create a scene]
        A --> E[Setup Camera]
        E --> F[Position Camera]
        A --> G[Add 3D Object Container]
        A --> H[Add a texture loader]
        
        B --> I[Setup vectors]
        B --> J[Setup material properties]`
        
        flowchart TD
    A[Setup Window & Renderer #1-11] --> B[Scene Configuration #13-14]
    B --> C[Camera Setup & Animation #16-26]
    C --> D[Container & Rotation #29-35]
    D --> E[Initialize Parameters #37-44]
    E --> F[Create Geometry System #46-80]
    F --> G[Animation Parameters #82-93]
    G --> H[Render Loop #94-121]
    H -->|Loop| H
    H --> I[Window Resize Handler #125-133]
    
    subgraph Geometry System
    F1[Create Plane #49-60] --> F2[Generate Dots #62-79]
    end
    
    subgraph Animation Loop
    H1[Update Dots #98-105] --> H2[Update Plane #106-113]
    H2 --> H3[Render Frame #114-120]
    end`;
        
        const defaultMermaidSyntax = `flowchart TD
  A["1. Initialize Renderer (#1-11)"] --> B["2. Create Scene and Set Fog (#12-14)"]
  B --> C["3. Setup Camera with Perspective View (#15-26)"]
  C --> D["4. Animate Camera using TweenMax (#19-26)"]
  D --> E["5. Create Container Object for Dots and Plane (#29-30)"]
  E --> F["6. Rotate Container using TweenMax (#32-35)"]
  F --> G["7. Setup Texture Loader (#37-38)"]
  G --> H["8. Define Options and Center Coordinates (#40-44)"]
  H --> I["9. Create Dots Function (#46-80)"]
  I --> I1["10. Initialize Plane Geometry (#49-56)"]
  I1 --> I2["11. Apply Transformation and Calculate Ratios (#50-56)"]
  I2 --> I3["12. Create Plane Material and Add to Container (#58-60)"]
  I3 --> I4["13. Generate Dot Geometry with Loop (#62-79)"]
  I4 --> I5["14. Set Dot Material and Texture (#70-77)"]
  I5 --> I6["15. Add Dots to Container (#78-79)"]
  I6 --> J["16. Animate Ease Properties with TweenMax (#82-93)"]
  J --> K["17. Render Function: Calculate Vertex Transformations (#94-120)"]
  K --> K1["18. Update Dot and Plane Geometry (#115-116)"]
  K1 --> L["19. Camera Adjustments and LookAt Function (#118-119)"]
  L --> M["20. Render Scene with Camera (#120)"]
  M --> N["21. Invoke CreateDots and Start Animation (#122-123)"]
  N --> O["22. Handle Window Resize Event (#125-133)"]
`;
*/

        console.log("Generated Mermaid syntax:", defaultMermaidSyntax);
        res.json({ mermaid: defaultMermaidSyntax });
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).send('Error generating flowchart.');
    }
});

// POST endpoint to handle the LLM chat
app.post('/llm-chat', async (req, res) => {
  console.log('Received request to /llm-chat');
  try {
    const { llmInput, code, htmlCode, cssCode } = req.body;
    console.log('Request body:', { llmInput, code, htmlCode, cssCode });

    if (!llmInput || !code || !htmlCode || !cssCode) {
      console.log('Missing required input fields');
      return res.status(400).json({ error: 'Missing required input fields' });
    }

    console.log('Sending request to OpenAI API');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that can modify code based on user requests. Respond with a valid JSON object containing modified code sections.' },
          { role: 'user', content: `Given the following code:

JavaScript:
${code}

HTML:
${htmlCode}

CSS:
${cssCode}

User request: ${llmInput}

Please modify the appropriate code to fulfill the user's request. Return ONLY a valid JSON object with keys 'js', 'html', and 'css'. Each key should contain an object with 'original' and 'modified' properties. 

If a section needs modification, include ONLY the changed function section in the 'modified' property.
If a section doesn't need modification, set both 'original' and 'modified' to null.

Example response format:

{
  "js": {
    "original": null,
    "modified": "// Only the modified function section of JavaScript code"
  },
  "html": {
    "original": null,
    "modified": "<!-- Only the modified part of HTML code -->"
  },
  "css": {
    "original": null,
    "modified": null
  }
}

Do not include any explanations or additional text outside of the JSON object.` }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    console.log('Received response from OpenAI API');
    if (response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      try {
        // Parse the content as JSON
        const updatedCode = JSON.parse(content);
        
        // Merge partial updates
        const mergedCode = {
          js: mergePartialUpdate(code, updatedCode.js.modified),
          html: mergePartialUpdate(htmlCode, updatedCode.html.modified),
          css: mergePartialUpdate(cssCode, updatedCode.css.modified)
        };
        
        res.json({ updatedCode: mergedCode });
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        console.log("Raw response content:", content);
        
        // Attempt to extract JSON from the content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            res.json({ updatedCode: extractedJson });
          } catch (extractError) {
            console.error("Error extracting JSON from content:", extractError);
            res.status(500).json({ 
              error: 'Error parsing OpenAI response', 
              details: content,
              rawContent: content 
            });
          }
        } else {
          res.status(500).json({ 
            error: 'Error parsing OpenAI response', 
            details: 'No valid JSON found in the response',
            rawContent: content 
          });
        }
      }
    } else {
      console.error("Unexpected response format from OpenAI API:", response.data);
      res.status(500).json({ error: 'Unexpected response format from OpenAI API' });
    }
  } catch (error) {
    console.error('Error in /llm-chat:', error);
    if (error.response) {
      console.error('OpenAI API response:', error.response.data);
      res.status(error.response.status).json({ error: 'Error processing LLM chat request', details: error.response.data });
    } else {
      res.status(500).json({ error: 'Error processing LLM chat request', details: error.message });
    }
  }
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
