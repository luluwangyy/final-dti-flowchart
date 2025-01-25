# JavaScript to Mermaid Flowchart Generator

## Overview
This application is designed to convert JavaScript, HTML, and CSS code into interactive flowcharts using Mermaid.js. It provides a visual representation of the code's structure and flow, leveraging OpenAI's GPT-4 for code analysis and Mermaid syntax generation. The tool is especially useful for developers and educators aiming to visually debug or understand their code.

## Project Structure

### Components
1. **Client-side (React Application)**  
   - Manages user interaction and displays the generated flowchart.  
   - Utilizes **CodeMirror** for a code-editing interface and **Mermaid.js** for rendering flowcharts.

2. **Server-side (Express Application)**  
   - Processes the code using OpenAI's GPT-4 API to generate Mermaid.js syntax.  
   - Provides API endpoints for flowchart generation and language model interactions.

### Directory Layout
```
js-to-mermaid-app/
├── client/ # Frontend React application
│ ├── src/
│ │ ├── App.js # Main application logic
│ │ ├── styles.css # Application styling
│ │ └── index.js # React entry point
│ ├── public/
│ │ ├── index.html # Main HTML file
│ │ └── vendor/ # jQuery plugins for visualization
│ └── package.json # Frontend dependencies
└── server/ # Backend Express server
├── index.js # Server logic and API endpoints
├── .env # Environment variables
└── package.json # Backend dependencies
```

## Setup Instructions
### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Installation

#### Backend Setup
1. Navigate to the server directory:
   ```
   cd server
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Start the server:
   ```
   node index.js
   ```

#### Frontend Setup
1. Navigate to the client directory:
   ```
   cd client
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the React application:
   ```
   npm start
   ```

## It Works
### Code Input Process
1. **User Interface**: The application provides three editors for JavaScript, HTML, and CSS code input using CodeMirror.
2. **Code Submission**: Users can submit their code by clicking the "Generate Flowchart" button, which sends the code to the backend for processing.

### Flowchart Generation
1. **Backend Processing**: The server receives the code and uses OpenAI's GPT-4 to generate Mermaid syntax.
2. **Mermaid Syntax**: The generated syntax is sent back to the frontend, where it is rendered into a flowchart using Mermaid.js.

### Interactive Features
- **Code Preview**: The application provides a live preview of the HTML/CSS/JS implementation in an iframe.
- **Flowchart Interaction**: Users can interact with the flowchart nodes to view related code sections.
- **LLM Chat**: Users can request code modifications through natural language, which are processed by GPT-4.

##Code Walkthrough
### Frontend Core (App.js)
- **State Management**: Manages the state for code inputs and generated Mermaid syntax.
  ```javascript
  const [code, setCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  ```

- **Editor Setup**: Configures CodeMirror editors for JavaScript, HTML, and CSS.
  ```javascript
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
  ```

- **Flowchart Rendering**: Uses Mermaid.js to render the flowchart from the generated syntax.
  ```javascript
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
  ```

### Backend Core (index.js)
- **Flowchart Generation Endpoint**: Processes code and generates Mermaid syntax.
  ```javascript
  app.post('/generate-flowchart', async (req, res) => {
    const { code, htmlCode, cssCode } = req.body;
    // Process code through OpenAI
    // Return Mermaid syntax
  });
  ```

- **Code Merging Function**: Merges updated code sections with the original code.
  ```javascript
  function mergePartialUpdate(original, update) {
    if (!update || update === original) return original;
    // Merge logic for code updates
  }
  ```


Troubleshooting
---------------
### Common Issues
1. **OpenAI API Connection**:
   - Ensure the API key is correctly set in the `.env` file.
   - Verify network connectivity and API rate limits.

2. **Mermaid Rendering**:
   - Check for syntax errors in the generated Mermaid code.
   - Monitor the browser console for rendering errors.

3. **Code Preview**:
   - Ensure the iframe is correctly configured to display content.
   - Verify that all resources are loading without errors.

##Technical Notes
- **React**: v18.3.1
- **Express**: v4.21.0
- **OpenAI API**: v4.73.0
- **Mermaid**: v11.2.1
