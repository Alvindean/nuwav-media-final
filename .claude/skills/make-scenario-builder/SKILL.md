---
name: make-scenario-builder
description: >
  Build, validate and create Make.com scenarios directly from a described outcome, using the
  Make MCP tools rather than clicking through the UI. Use IMMEDIATELY when the user says
  "build a Make scenario", "automate this in Make", "make a workflow that", "wire this up in
  Make", "we don't have a Make for that", "create the scenario", "Make blueprint", or
  describes an automation they want to exist. Discovers the correct app names, versions and
  module identifiers from the live Make account, builds a blueprint, validates it against
  the real schema and module configuration, and creates it — then reports exactly which
  connections a human still has to authorise. Ships with a working Drive-to-YouTube publish
  blueprint for the vox-doc-factory pipeline.
  Hard rule: never hand the user a description of a scenario when a validated blueprint is
  achievable. Never claim a scenario is live until `scenarios_create` has returned.
---

# MAKE SCENARIO BUILDER

Describing an automation is not delivering one. This builds the blueprint, validates it
against the live account, and creates it.

**Account context (verified 2026-07-30):** organization `945604`, team `378419`, **Core
plan — 10,000 operations/month**.

---

## Why this exists

The instinct when a Make scenario is missing is to write instructions for a human to build
it. That's backwards — the Make MCP tools can read the real app catalogue, the real module
schemas and the real validators. Build it, then hand over only what genuinely needs a
human: the OAuth grants.

---

## The build sequence

Follow it in order. Skipping discovery is how you get a blueprint that validates
structurally and then fails on create with "Module not found".

### 1. Find the apps — never guess the name or version

App names are slugs and versions matter. `youtube` is at **v4**, `google-drive` at **v4**,
`google-sheets` at **v2**. Guessing `youtube@1` returns *"Package not found"*.

```
apps_recommend(intention: "<plain description of the whole automation>")
```

This returns app names, versions **and** the relevant module identifiers in one call. It
is far better than `apps_list`, which paginates across thousands of apps.

### 2. Get the module schemas

```
app-modules_list(organizationId, appName, appVersion)     → the module names
app-module_get(..., moduleName, format: "instructions")   → the full input schema
```

Read the schema properly. **Required fields hide in there.** The YouTube `uploadVideo`
module requires `containsSyntheticMedia` — a field no tutorial mentions and which matters
a great deal for an AI-assisted channel.

### 3. Get the connection IDs

```
connections_list(teamId: 378419)
```

Never invent a connection ID. If the connection doesn't exist, that's the escalation —
leave a `REPLACE_WITH_*` placeholder and say so plainly.

### 4. Validate the module configuration *before* assembling

```
validate_module_configuration(organizationId, teamId, appName, appVersion,
                              moduleName, parameters, mapper)
```

Per-module, so failures point at the actual mistake instead of at the whole blueprint.

### 5. Validate the blueprint

```
validate_blueprint_schema(blueprint)
```

**Know what this does and doesn't check.** It is a *structural* check only. It does not
verify module names exist or that parameters are right. A blueprint can pass this and still
fail on create. That's exactly why steps 1–4 come first.

### 6. Create it

```
scenarios_create(...)   then   scenarios_activate(...)
```

Do not activate a scenario whose connections are still placeholders.

---

## Blueprint anatomy

```json
{
  "name": "Scenario name",
  "flow": [
    {
      "id": 1,
      "module": "google-drive:watchFilesInAFolder",
      "version": 4,
      "parameters": { "__IMTCONN__": 1591311 },
      "mapper": {},
      "metadata": { "designer": { "x": 0, "y": 0 } }
    }
  ],
  "metadata": {
    "instant": false,
    "version": 1,
    "scenario": {
      "roundtrips": 1, "maxErrors": 3, "autoCommit": true,
      "autoCommitTriggerLast": true, "sequential": false,
      "confidential": false, "dataloss": false, "dlq": false
    },
    "designer": { "orphans": [] }
  }
}
```

- `module` is `appName:moduleName`. Both halves come from discovery, never from memory.
- `parameters` holds **static** config, including `__IMTCONN__` (the connection ID).
- `mapper` holds **dynamic** config — the mapped values.
- `{{1.fieldName}}` references the output of module `1`. Module IDs must be unique and
  sequential.
- `metadata.designer.x/y` positions the node on the canvas. Space them ~300px apart or the
  canvas is unreadable.

---

## Operations budget

Core is **10,000 operations/month**. An operation is one module execution per bundle.

| Scenario | Ops per run | At this cadence |
|---|---|---|
| Vox doc publish | ~15–25 | 12 episodes/month → ~300 ops |

A polling trigger consumes an operation **every time it checks**, even when it finds
nothing. A trigger set to every 15 minutes burns ~2,880 ops/month doing nothing. **Set the
publish scenario's schedule to match the real cadence** — every 6 hours is plenty for a
2–3× weekly upload, and costs ~120 ops/month instead.

That single setting is the difference between comfortably inside the plan and mysteriously
out of operations.

---

## Shipped blueprints

### `blueprints/vox-doc-youtube-publish.json`

Drive → YouTube, for the vox-doc-factory pipeline.

**Flow:** watch the ready folder → download the master → find the sibling `metadata.json` →
parse it → upload to YouTube (private/scheduled) → set the thumbnail → log to a Sheet.

**Status:** passes `validate_blueprint_schema`. All module names verified against
`app-modules_list` for `youtube@4`, `google-drive@4`, `google-sheets@2`.

**Placeholders a human must fill** — these are credentials and IDs, not information:

| Placeholder | What it needs |
|---|---|
| `REPLACE_WITH_YOUTUBE_CONNECTION_ID` | **The YouTube connection does not exist yet.** See below. |
| `REPLACE_WITH_READY_TO_UPLOAD_FOLDER_ID` | The Drive folder ID for `/Vox Docs/_READY_TO_UPLOAD/` |
| `REPLACE_WITH_EPISODE_LOG_SHEET_ID` | The episode log spreadsheet ID |

### Connecting YouTube

Verified against the live account: connections exist for Facebook, Google, OpenAI,
Printify, TikTok, Hunter and PhantomBuster. **No YouTube connection.**

The fast path — add a YouTube module in Make, click *Create a connection*, sign in with
Google. Done in a couple of minutes.

The durable path, if the weekly re-auth becomes annoying — use your own Google Cloud
credentials:

1. Google Cloud Console → new project
2. APIs & Services → Library → enable **YouTube Data API v3**
3. Google Auth Platform → configure the consent screen, **External** audience
4. Authorised domains: `make.com` and `integromat.com`
5. Scopes: `https://www.googleapis.com/auth/youtube.upload` and
   `https://www.googleapis.com/auth/youtube`
6. Create an OAuth client, type **Web application**
7. Authorised redirect URI: `https://www.make.com/oauth/cb/youtube`
8. Copy the Client ID and Secret into Make's advanced connection settings

**The publishing-status trap:** a project left in **Testing** forces re-authorisation
**every week** — which will silently break a hands-off publishing pipeline. Set the project
to **In production** (Google Auth Platform → Audience → Publish app).

---

## The synthetic media declaration

`uploadVideo` requires `containsSyntheticMedia`. For a channel whose visuals are AI-
generated, this is **`true`**.

Set it honestly. YouTube's altered-and-synthetic-media policy is the live enforcement risk
for exactly this kind of channel, and a truthful disclosure costs nothing while an
undisclosed one puts the channel at risk. The blueprint ships with it set to `true`.

`selfDeclaredMadeForKids` is `false` for this content.

---

## Error handling

Put an error handler on the upload module. The two realistic failures are YouTube's daily
upload quota and transient auth expiry. Retry once after 10 minutes, then notify — a silent
failure in a hands-off pipeline means an episode that simply never appears.

---

## Hard rules

1. Never guess an app name, version, or module identifier. Discovery is one call.
2. Never invent a connection ID. Missing connection → placeholder + escalation.
3. Validate module configs individually before validating the blueprint.
4. Know that `validate_blueprint_schema` is structural only. It is not a green light.
5. Never activate a scenario with placeholder connections.
6. Match the trigger schedule to the real cadence — polling is billed.
7. Never say a scenario is live until `scenarios_create` has returned.
