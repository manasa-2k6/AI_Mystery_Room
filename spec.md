Here is a comprehensive Technical Specification Sheet designed for Spec-Driven Development (SDD) to guide development agents (like Codex) and engineers in building the **AI Mystery Room** application.

---

# Technical Specification Sheet: AI Mystery Room

## 1. System Overview & Objective

**AI Mystery Room** is an interactive, web-based deduction game. A user inputs a scenario, theme, or premise, and the backend leverages Google Gemini to dynamically orchestrate an unsolved mystery case file. The engine generates suspects, motive profiles, timelines, and multimodal digital evidence (fabricated WhatsApp chat threads, visual crime scene/surveillance stills, simulated cam transcripts). The player examines the evidence board, accuses a suspect, and receives a verdict based on evidentiary consistency.

---

## 2. Core Architecture & Tech Stack

```
[ React.js SPA (Vite / Tailwind / Lucide) ]
                 │
           REST / JSON
                 ▼
[ Node.js + Express.js API Gateway ]
       │                     │
       ▼                     ▼
[ MongoDB Atlas ]     [ Google Gemini API (gemini-2.5-flash / gemini-2.5-pro / Imagen) ]

```

* **Frontend**: React.js (Vite), Tailwind CSS (sleek, dark investigation-board UI), Lucide Icons, Axios.
* **Backend**: Node.js, Express.js.
* **Database**: MongoDB (Mongoose ODM) for storing generated case files, player sessions, and game state.
* **AI Orchestration**: Google Gemini API via official SDK (`@google/genai`).
* Text & Logic Generation: Gemini (Structured Outputs via JSON Schema).
* Evidence Image Generation: Imagen 3 / Gemini Image Generation endpoints.



---

## 3. Data Schema & Contracts

### 3.1 MongoDB / Mongoose Data Models

#### `CaseSession`

```json
{
  "_id": "ObjectId",
  "prompt": "String",
  "status": "pending | active | solved | failed",
  "createdAt": "ISODate",
  "mystery": {
    "title": "String",
    "synopsis": "String",
    "culpritId": "String",
    "solutionExplanation": "String",
    "suspects": [
      {
        "id": "String",
        "name": "String",
        "role": "String",
        "alibi": "String",
        "motive": "String",
        "avatarUrl": "String"
      }
    ],
    "evidence": [
      {
        "id": "String",
        "type": "whatsapp_chat | security_cam | crime_scene_photo | document",
        "title": "String",
        "description": "String",
        "data": {
          "messages": [
            {
              "sender": "String",
              "timestamp": "String",
              "text": "String"
            }
          ],
          "imageUrl": "String",
          "camTranscript": "String"
        },
        "pointsToSuspectId": "String"
      }
    ]
  },
  "playerSubmission": {
    "accusedSuspectId": "String",
    "playerReasoning": "String",
    "isCorrect": "Boolean",
    "feedback": "String"
  }
}

```

---

## 4. API Specifications

### `POST /api/cases/generate`

* **Description**: Accepts a premise and calls Gemini using Structured JSON Schema to generate a logically consistent mystery, suspects, and multimodal evidence descriptors.
* **Request Body**:
```json
{
  "scenario": "A high-profile art collector's diamond watch disappears during an intimate penthouse dinner in Manhattan."
}

```


* **Gemini Generation Pipeline**:
1. **Phase 1: Case Architecture**: System instruction prompts Gemini to define 3–4 suspects, choose 1 actual culprit, develop motives, and create 3–5 interconnected pieces of evidence that contain unambiguous logical deduction paths without making the culprit immediately obvious.
2. **Phase 2: Asset Synth**:
* Generates structured message arrays for WhatsApp chat evidence.
* Generates descriptive image prompts to synthesize surveillance stills / crime scene photos.


3. **Phase 3: Persistence**: Saves session with the culprit concealed from the initial client payload.


* **Response (Sanitized for Player)**:
```json
{
  "sessionId": "66f4b23...",
  "title": "The Vanishing Audemars",
  "synopsis": "During dessert at Julian Vance's penthouse, the vault was opened...",
  "suspects": [
    { "id": "s1", "name": "Elena Rostova", "role": "Art Curator" },
    { "id": "s2", "name": "Marcus Vance", "role": "Estranged Brother" },
    { "id": "s3", "name": "Chef Daniel", "role": "Private Caterer" }
  ],
  "evidence": [
    {
      "id": "ev1",
      "type": "whatsapp_chat",
      "title": "Leaked Chat: Marcus & Unknown Contact",
      "data": { "messages": [...] }
    },
    {
      "id": "ev2",
      "type": "security_cam",
      "title": "Hallway Cam 03 - 21:42",
      "data": { "imageUrl": "https://...", "camTranscript": "Timestamp 21:42:10..." }
    }
  ]
}

```



---

### `POST /api/cases/:id/accuse`

* **Description**: Evaluates the user's accusation against the stored ground truth and returns the investigation resolution.
* **Request Body**:
```json
{
  "suspectId": "s2",
  "playerReasoning": "The timestamp in Marcus's text contradicts his statement about being in the wine cellar."
}

```


* **Response**:
```json
{
  "isCorrect": true,
  "actualCulprit": "s2",
  "solutionExplanation": "Marcus claimed to be downstairs, but the CCTV reflection at 21:42 shows him near the study.",
  "verdictFeedback": "Case Closed! Excellent deduction based on timeline discrepancies."
}

```



---

## 5. Frontend UI/UX Specifications

### 5.1 Screens & Layout

1. **Case Creation Hub**:
* Text prompt input with quick presets (e.g., "Cyberpunk Heist", "Victorian Manor Murder", "Tech Startup Sabotage").
* Interactive loading screen with animated forensic status updates ("Interrogating witnesses...", "Extracting surveillance data...").


2. **Investigation Dashboard (Split-Pane / Grid)**:
* **Left Panel / Top Bar**: Case overview, countdown/score tracker, and suspect lineup modal cards.
* **Center Stage (Evidence Board)**:
* Interactive tabs or draggable pins:
* **WhatsApp Evidence Viewer**: Authentic iOS/Android chat bubble view showing timestamps, delivery ticks, and sender names.
* **Surveillance / Cam Viewer**: Dark CRT/glitch overlay with timestamp stamps and pause/pan zoom for inspection.
* **Forensic Notes / Documents**: Scanned memo or receipt styles.




* **Bottom / Right Action Bar**: "File Accusation" CTA button opening the verdict submission modal.


3. **Verdict Screen**:
* Dramatic reveal animation (Success / Miscarriage of Justice).
* Complete timeline breakdown detailing how every clue connected to the culprit.



---

## 6. Implementation Milestones (Codex Execution Steps)

1. **Sprint 1 (Backend Core & AI Integration)**:
* Setup Express server and MongoDB Mongoose models.
* Build Gemini prompt pipeline with enforced JSON response schemas using the `@google/genai` SDK.
* Integrate asset fallback/image generation for evidence media.


2. **Sprint 2 (API Endpoints & Validation Logic)**:
* Implement `/generate`, `/case/:id`, and `/accuse` endpoints with sanitization (never expose `culpritId` before accusation).


3. **Sprint 3 (Frontend Interactive Investigation Board)**:
* Construct React layout with Tailwind CSS.
* Build the dedicated evidence viewer components (`WhatsAppViewer.jsx`, `CamPlayback.jsx`).
* Wire client state management and accusation flow.


4. **Sprint 4 (Testing & Edge Cases)**:
* Ensure robust fallback handling if image generation timeouts occur.
* Add input sanitation on scenario prompts to keep cases logically coherent and guard against hallucinations.