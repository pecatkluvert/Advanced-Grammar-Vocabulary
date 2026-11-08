# English Atelier

A static English learning app based on the five supplied Advanced Grammar & Vocabulary units. It uses HTML, CSS and JavaScript; no framework, account, API key, database or build step is required.

## What is included

- Five units with lesson explanations and examples.
- 145 vocabulary entries with definitions, usage notes, saved words, flashcards and optional browser pronunciation.
- 324 written practice questions, including adapted exercises and additional vocabulary recall. Each graded question has feedback and an explanation.
- A listening player, track selector, Unit 1 listening answer sheets and a listening notebook in every unit.
- Progress saved in the current browser, mistake review, and JSON export/import for backups.
- Responsive layouts, keyboard controls, labelled inputs and support for reduced motion.

The written material is adapted for independent study from the supplied units. These are editorial answers, not a publisher-provided answer key. Some open responses are converted to constrained, automatically marked questions. Pronunciation uses your browser’s text-to-speech voices; it is separate from the course recordings.

## Upload to GitHub using your browser

1. Download and **extract** the ZIP. Do not upload the ZIP itself as the website.
2. Create a GitHub repository, or open the repository you want to use.
3. Choose **Add file → Upload files**. Drag the contents of the extracted app folder into the upload area, including the folders. Commit the files. The repository should contain `index.html` directly at its root, not inside another `english-app/` folder.
4. Upload your MP3 recordings into the **`audio/` folder at the repository root**. Keep all names exactly as supplied, including capital letters and hyphens.
5. Open the repository’s **Settings → Pages**.
6. Under **Build and deployment**, choose **Deploy from a branch**. Select your branch (usually `main`) and **`/ (root)`**, then save.
7. Wait for the Pages deployment to finish, then open the website URL shown by GitHub. A project URL normally looks like `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

GitHub Pages availability for private repositories depends on your GitHub plan. Publishing from a branch requires no custom workflow. All app asset, JSON and audio paths are relative, so a repository subdirectory in the website URL is supported.

### Folder layout

```text
repository-root/
  index.html
  styles.css
  app.js
  core.js
  assets/
    favicon.svg
  data/
    units.json             # Unit index: add future units here
    unit-1.json            # Complete content for Unit 1
    unit-2.json
    unit-3.json
    unit-4.json
    unit-5.json
    audio-library.json     # Known audio filenames
  audio/
    README.md
    AV-00.mp3              # You upload the actual recordings
    AV-001-2.mp3
    AV-011-2.mp3
    ...
  unit-template.json       # Copy this to start Unit 6
  unit.schema.json         # Optional editor/schema reference
  README.md
  package.json             # Optional checks; no install needed
  tools/validate.mjs
  tests/core.test.mjs
```

## Exactly where to put the audio

**Upload recordings to `audio/`, beside `index.html` and `data/`.** For example:

```text
audio/AV-00.mp3
audio/AV-001-2.mp3
audio/AV-011-2.mp3
audio/AV-018-2.mp3
audio/AV-023-3.mp3
audio/AV-031-3.mp3
audio/AV-034-4.mp3
audio/AV-037-2.mp3
audio/AV-042-1.mp3
audio/AV-043-3.mp3
audio/AV-052-1.mp3
audio/AV-056-2.mp3
audio/AV-069-1.mp3
audio/AV-070-1.mp3
audio/AV-081-1.mp3
audio/AV-091-2.mp3
audio/AV-104-1.mp3
```

These exact filenames are already in `data/audio-library.json`, based on your screenshot. The ZIP does **not** contain the recordings. A screenshot cannot supply audio or establish which track belongs to a particular unit.

In GitHub, you can open the existing `audio/` folder and use **Add file → Upload files**. If adding one MP3 at a time, make sure you are inside that folder. For large recordings, GitHub’s browser upload limit is 25 MiB per file; keep individual recordings within that limit or upload using Git if needed.

### Assign a track to a unit

Open a unit’s **Listening** tab and choose a filename. This choice is saved for your browser. `AV-001-2.mp3` is offered as an **unverified suggestion** for Unit 1, Exercise 2. No other track-to-unit mapping is assumed.

To make a verified assignment apply to everyone, edit that unit’s JSON on GitHub:

```json
"audio": {
  "track": "audio/AV-001-2.mp3",
  "note": "Verified recording for Unit 1, Exercise 2.",
  "activities": []
}
```

This is an illustration: preserve any existing `activities` when you edit the real unit file. A browser’s saved choice overrides the default; use **Reset progress** or choose the new track manually to change it locally.

**Preview local MP3s** lets you choose files on your device and play them without uploading. It does not send the files anywhere. You must select them again after reloading. Upload to `audio/` for permanent playback on the website.

### Listening answers

Unit 1 includes the two five-extract listening answer sheets from the supplied PDF. The PDF and screenshot did not provide a transcript or verified listening answer key. The app therefore saves these answers **without grading them**.

If you later have a verified key, replace `"answerKey": null` in the relevant activity with an array of five exact option strings in extract order. For example, the data structure is:

```json
"answerKey": ["exact option for extract 1", "exact option for extract 2", "exact option for extract 3", "exact option for extract 4", "exact option for extract 5"]
```

Use real values from that activity’s `options` array, not these placeholders. A **Check listening answers** button then appears. Listening scores stay separate from written practice progress. Units 2–5 contain no listening tasks in the supplied pages; their Listening tab provides the player and notebook for supplementary study.

## Add Unit 6, Unit 7 and beyond

No app-code change is needed.

1. Copy `unit-template.json` into `data/` and name it `unit-6.json`.
2. In the new file change `"$schema": "./unit.schema.json"` to `"$schema": "../unit.schema.json"` because the file now lives in `data/`.
3. Set a unique `id`, positive `number`, title, description, objectives and estimated study time. For Unit 7, use `unit-7` and number `7`.
4. Replace the sample lessons, vocabulary and exercise groups with your new content. Keep JSON punctuation valid: double quotes, commas between items, no trailing commas or comments.
5. Add an entry to `data/units.json`:

```json
{
  "schemaVersion": 1,
  "title": "English Atelier",
  "subtitle": "A little practice. A richer vocabulary.",
  "units": [
    {"id": "unit-1", "file": "unit-1.json"},
    {"id": "unit-2", "file": "unit-2.json"},
    {"id": "unit-3", "file": "unit-3.json"},
    {"id": "unit-4", "file": "unit-4.json"},
    {"id": "unit-5", "file": "unit-5.json"},
    {"id": "unit-6", "file": "unit-6.json"}
  ]
}
```

6. Commit both files. Refresh the GitHub Pages website after its deployment finishes. Units are sorted by `number`.

### Supported question formats

Multiple choice (also use this for True/False or category matching):

```json
{
  "id": "meaning-1",
  "type": "choice",
  "prompt": "Which adjective means very careful about details?",
  "options": ["reckless", "meticulous", "fickle"],
  "answer": "meticulous",
  "explanation": "Meticulous people pay close attention to details."
}
```

Written response, with multiple acceptable answers if appropriate:

```json
{
  "id": "spelling-1",
  "type": "text",
  "prompt": "A ___ schedule left the team exhausted.",
  "answer": ["gruelling", "grueling"],
  "hint": "The word starts with gr-.",
  "explanation": "Gruelling means exhausting over a long period; grueling is the US spelling."
}
```

A group can have an optional `passage` string for reading-based questions. Keep group and question IDs stable after learners begin: progress is linked to these IDs. Change IDs when replacing an exercise with a different one. Changing an answer key does not retroactively regrade old browser results; learners should retry those questions.

Text marking ignores case, extra spaces, typographic apostrophes/dashes and final sentence punctuation. It does not guess spelling or synonyms; list all acceptable responses explicitly. All displayed JSON text is escaped as text, so lesson fields do not support raw HTML.

## Local preview and optional checks

Opening `index.html` by double-clicking is not enough because browsers restrict fetching JSON through `file://` URLs.

With Python installed, run from the app folder:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. Stop the server with Ctrl+C.

With Node.js 20+ installed, these optional checks need no package installation:

```sh
npm run validate
npm test
```

The validator checks unit structure, choices, answer keys, identifiers, audio metadata and paths. The included tests cover answer matching, progress, malformed data and the future-unit template. The app itself has no runtime dependencies and does not require Node.js on GitHub Pages.

## Troubleshooting

- **Setup-help screen:** confirm the site is served over HTTP(S), and all `data/` files were uploaded. Check spelling and JSON syntax.
- **Unit missing:** its manifest ID must match the file’s ID. Run the validator, or inspect the load message on the site.
- **Audio missing:** verify `audio/AV-001-2.mp3` exists in the repository with exact case, and that the Pages deployment has completed. Select the right file in Listening.
- **Progress disappeared:** private browsing, a different device, a different Pages origin, or clearing browser storage creates a new local workspace. Import an exported backup to restore it.
- **Pronunciation silent:** your browser or device may not have an English text-to-speech voice available. Use the course recordings or another supported device.

Verification for this delivery: content validation, JavaScript syntax checks, pure-logic tests and simulated-DOM interaction checks. A real-browser visual check was unavailable in the build environment. Actual MP3 playback requires your recordings and has not been verified.
