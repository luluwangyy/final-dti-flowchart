# Flow

Flow helps people understand creative JavaScript by placing the source code, live output, and a clickable structural flowchart in one workspace.

[Open the live demo](https://luluwangyy.github.io/final-dti-flowchart/)

## What you can do

- Load one of four complete creative-coding studies.
- Preview the animation directly in the browser.
- Generate an immediate prebuilt flowchart for every included example.
- Paste your own JavaScript, HTML, and CSS.
- Use demo access or a personal OpenAI API key to map custom code.
- Select a flowchart node to reveal and highlight its source lines.
- Pan and zoom the diagram or resize each workspace card.

## Try the built-in examples

1. Choose a study from the Creative code library.
2. Select **Load & preview**. The preview starts automatically.
3. Select **Generate flowchart**. Included examples use their prebuilt diagrams and do not require AI access.
4. Select any diagram node to jump to the corresponding JavaScript.

## Use your own code

1. Paste or edit code in the JavaScript, HTML, and CSS tabs.
2. Select **Launch preview** and confirm that the result runs correctly.
3. Select **Generate flowchart**.
4. Connect with the demo password or a personal OpenAI API key when prompted.
5. After a successful connection, generation resumes automatically.

## Run locally

### Requirements

- Node.js 20 or newer
- npm
- An OpenAI API key if you want to generate diagrams for custom code

### Install the server

```bash
cd server
npm install
```

Create `server/.env`:

```dotenv
OPENAI_API_KEY=your_openai_api_key
DEMO_PASSWORD=choose_a_demo_password
CLIENT_ORIGIN=http://localhost:3000
HOST=127.0.0.1
PORT=5050
DEMO_TRIAL_LIMIT=5
```

Start the API:

```bash
node index.js
```

### Install the client

In a second terminal:

```bash
cd client
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

| Variable | Location | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Server | OpenAI credential used for demo requests |
| `DEMO_PASSWORD` | Server | Password that unlocks limited demo requests |
| `DEMO_TRIAL_LIMIT` | Server | Daily demo-request allowance per client address |
| `CLIENT_ORIGIN` | Server | Comma-separated origins allowed by CORS |
| `HOST` | Server | Address used by the Express server |
| `PORT` | Server | API port; defaults to `5050` |
| `REACT_APP_API_URL` | Client build | Public URL of the deployed Flow API |

## Deployment

The GitHub Pages workflow publishes the React client from the `codex/live-demo-release` branch. The included examples are fully functional in this static deployment.

Custom AI generation requires the Express server to be deployed separately over HTTPS. Add its public URL as a GitHub Actions repository variable named `REACT_APP_API_URL`, set `CLIENT_ORIGIN` on the server to `https://luluwangyy.github.io`, and redeploy the Pages workflow.

Never place `OPENAI_API_KEY` or `DEMO_PASSWORD` in the client, this repository, or a GitHub Actions variable exposed to the browser. Store both as secrets on the backend host.

## Project structure

```text
final-dti-flowchart/
├── client/             React interface, CodeMirror editor, previews, and Mermaid rendering
├── server/             Express API and OpenAI integration
├── .github/workflows/  GitHub Pages deployment
└── README.md
```

## Technology

- React 18
- CodeMirror 5
- Mermaid 11
- Express 4
- OpenAI Node SDK

## Security notes

- Built-in sample diagrams are generated locally and do not transmit code.
- Personal API keys are kept in browser memory for the current page session and are sent only to the configured Flow API.
- Demo credentials and the creator's OpenAI key remain on the server.
- `server/.env` and build artifacts are excluded from Git.
