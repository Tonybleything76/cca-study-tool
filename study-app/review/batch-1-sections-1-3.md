# Review sheet — section 1

## q-s01-01 (core)

A chat assistant forgets a fact the user stated two turns earlier, in a short conversation nowhere near the context limit. What is the most likely cause?

- **A.** The model's memory feature was not enabled for this API key
- **B.** The application is not including those prior messages in the current request ✅
- **C.** The conversation exceeded the model's attention span
- **D.** The system prompt is overriding the user's earlier statements

  - A: There is no memory flag to enable — the Messages API is stateless by design, so memory is always the application's job.
  - B: The model only sees what the request contains. If a fact from two turns ago is missing, the application almost certainly didn't send those messages.
  - C: A short conversation is nowhere near any attention boundary; this explanation doesn't fit the evidence.
  - D: System prompts shape behavior but don't erase conversation content that was actually sent.

  _source: ## 1 > What to Know (statelessness)_

## q-s01-02 (core)

A developer passes a `session_id` with every API request and expects Claude to remember the conversation. What does `session_id` actually do?

- **A.** It tells Claude which stored conversation to load before responding
- **B.** It enables server-side memory for up to 24 hours
- **C.** It links requests for billing purposes but has no memory effect
- **D.** Nothing for the model — it can help your own system locate stored history, but Claude only sees what the request contains ✅

  - A: The API has no conversation store to load from — history must be sent in the `messages` array.
  - B: No such server-side memory mechanism exists in the stateless Messages API.
  - C: Close, but incomplete — a session identifier is purely an application-side concept, not an API billing feature.
  - D: A `session_id` is only meaningful to your product's own database or orchestration layer. The model's view is exactly the request content, nothing more.

  _source: ## 1 > What to Know (session_id)_

## q-s01-03 (warmup)

What does `tool_choice: "any"` guarantee?

- **A.** The model must call one of the provided tools rather than answering in plain text ✅
- **B.** The model may call any tool, including ones not defined in the request
- **C.** The model decides freely between calling a tool and answering normally
- **D.** The model calls every provided tool once

  - A: `any` forces a tool call from the provided set — useful when a tool call must happen but you can't pick which schema in advance.
  - B: Models can only ever call tools defined in the request.
  - C: That describes `auto`, the default.
  - D: No setting calls all tools; the model picks one appropriate tool per call.

  _source: ## 1 > tool_choice table_

## q-s01-04 (core)

A pipeline has several tools available, but `extract_metadata` must always run first before any enrichment calls. What is the reliable way to enforce that?

- **A.** List `extract_metadata` first in the tools array so the model prefers it
- **B.** Add "always call extract_metadata first" to the system prompt
- **C.** Set `tool_choice` to `{"type": "tool", "name": "extract_metadata"}` for the first call, then make subsequent calls for enrichment ✅
- **D.** Give the other tools names that sort alphabetically after extract_metadata

  - A: Tool definition order is not a reliable priority signal.
  - B: Prompt instructions influence but don't guarantee — edge cases will still skip the required first step.
  - C: Naming a specific required tool in `tool_choice` makes the first call deterministic; the sequencing lives in your orchestration code, not in model judgment.
  - D: Tool name ordering has no defined effect on selection.

  _source: ## 1 > Structured Outputs and Tool Use (tool_choice named tool)_

## q-s01-05 (core)

When should you choose JSON structured outputs (`output_config.format`) over defining an extraction tool?

- **A.** When you need the schema enforced — tools cannot enforce schemas
- **B.** When the final assistant response itself should be validated JSON, rather than an intermediate tool call in a workflow ✅
- **C.** When the schema is large, because structured outputs have no token cost
- **D.** Never — tool use supersedes structured outputs

  - A: Both mechanisms enforce schemas; the difference is where the structured data appears, not whether it's enforced.
  - B: That's the dividing line: structured outputs constrain the response body itself; tool use fits function calls, extraction steps, and intermediate agent actions. They can be combined in one workflow.
  - C: Schemas count toward input/overhead tokens in both approaches.
  - D: Both are current, supported mechanisms with different roles.

  _source: ## 1 > Structured Outputs and Tool Use as Output Control_

## q-s01-06 (core)

A team's code ends each request with a partially-written assistant message so the model will continue it ("prefill"). On current-generation models (Claude 4.6 family and later), what happens?

- **A.** The model continues from the partial text as before
- **B.** The partial message is silently ignored
- **C.** The model treats the partial text as a user instruction
- **D.** The request returns a validation error — prefill is legacy; use structured outputs, enum schema fields, or system prompt instructions instead ✅

  - A: Continuation from a trailing assistant message is exactly the behavior that was removed.
  - B: It isn't ignored — the request is rejected outright.
  - C: It never reaches interpretation; validation rejects the request shape first.
  - D: A request whose final message is an assistant turn now fails validation. Each prefill use case has a modern replacement: schemas for format, enums for labels, system instructions for suppressing preamble.

  _source: ## 1 > Partial Assistant Prefill (Legacy)_

## q-s01-07 (core)

Users report that a chat assistant gets slower and more expensive the longer a session runs. What is the most likely cause?

- **A.** Input token growth — every turn resends the full conversation history, so cost and latency rise with each message ✅
- **B.** The model allocates more thinking time to longer conversations
- **C.** Database queries for conversation history are slowing down
- **D.** The API applies a surcharge to long-running sessions

  - A: This is the signature of the stateless API: history is resent and re-processed every turn, so input tokens — and with them latency and cost — grow monotonically.
  - B: Reasoning effort doesn't scale with conversation length by default.
  - C: Retrieval from your own store is typically milliseconds; the growth pattern points at token volume.
  - D: There is no session surcharge; billing is per token.

  _source: ## 1 > Token Growth in Extended Conversations_

## q-s01-08 (stretch)

An extraction system uses a detailed 12-field tool schema (~2,500 tokens) on long documents. Accuracy is fine early in each document but degrades on content near the end. What is the root cause?

- **A.** The model reads documents front-to-back and fatigues
- **B.** The schema's field descriptions are too vague
- **C.** Total context consumption — schema plus long document approaches the effective attention boundary, degrading accuracy on late content ✅
- **D.** Structured outputs truncate long documents automatically

  - A: "Fatigue" isn't the mechanism — position only matters because total context is nearly exhausted.
  - B: Vague descriptions would degrade accuracy uniformly, not specifically near the document's end.
  - C: Large schemas spend the same context budget documents need. When combined input approaches the limit, content near the end sits closest to the attention boundary and suffers first. The fix is budgeting total context, not blaming the model.
  - D: No such truncation exists; the degradation is attentional, not a hard cut.

  _source: ## 1 > Structured Outputs (schema token cost)_

## q-s01-09 (core)

An extraction passes schema validation but fails a semantic check in application code (an implausible date). What is the most effective next call?

- **A.** Retry the identical request — extraction is stochastic, so it may succeed
- **B.** Call Claude again with the source document, the invalid extraction, and the specific validation errors ✅
- **C.** Lower the temperature and retry the same prompt
- **D.** Switch to a larger model for all extractions

  - A: Blind retries re-roll the same dice at full cost — no new information reaches the model.
  - B: The validation-error feedback loop gives the model exactly what it needs to correct the specific failure. This is far more effective than any retry of the unchanged prompt.
  - C: Temperature changes randomness, not the model's understanding of what was wrong.
  - D: A bigger model is a cost increase, not a targeted fix, and may repeat the same semantic error.

  _source: ## 1 > Structured Outputs (validation-error feedback loop)_

## q-s01-10 (stretch)

Which statement about JSON structured outputs' operational behavior is TRUE?

- **A.** Schema compliance guarantees the values are factually correct
- **B.** Schema compilation is instant because schemas are interpreted per-request
- **C.** Once a schema compiles, every response is guaranteed to conform
- **D.** The first request with a new schema may add latency while its grammar compiles; refusals or max-token stops can still yield nonconforming output, so domain validation remains necessary ✅

  - A: Schemas constrain shape, never truth — a well-formed wrong value passes.
  - B: First use pays a compilation cost; schemas are then cached for reuse.
  - C: Refusals and `max_tokens` cutoffs can still produce nonconforming output.
  - D: All three operational caveats are real: first-use compile latency, caching thereafter, and edge cases where output still doesn't conform. Schema compliance is not a substitute for domain validation.

  _source: ## 1 > Structured Outputs (operational implications)_

## q-s01-11 (warmup)

Where does the system prompt go in a Messages API request?

- **A.** In the top-level `system` parameter — not as a message with a "system" role ✅
- **B.** As the first message in `messages` with `"role": "system"`
- **C.** In a `metadata.instructions` field
- **D.** Concatenated to the front of the first user message

  - A: The Messages API takes system prompts via the dedicated top-level `system` parameter; `messages` holds user and assistant turns only.
  - B: There is no "system" role in the Messages API's `messages` array.
  - C: `metadata` is not an instruction channel.
  - D: Prepending to the user message works crudely but is not the API's system prompt mechanism and loses its special treatment.

  _source: ## 1 > What to Know (system parameter)_


# Flashcards

- **Is the Messages API stateful or stateless?**
  → Stateless. Claude sees only what each request contains — your application stores history and resends the relevant context every turn.

- **What does a `session_id` do for Claude's memory?**
  → Nothing at the model level. It can help YOUR system locate stored history, but the model only sees the request contents.

- **`tool_choice`: what do `auto`, `any`, `tool`, and `none` each mean?**
  → `auto`: may call a tool or answer normally. `any`: must call one of the provided tools. `tool`: must call one specific named tool. `none`: cannot call tools.

- **When do you use `tool_choice: "any"` instead of `auto` + prompt instructions?**
  → When a tool call MUST happen but the right schema isn't known in advance (e.g., several extraction tools). `auto` can still produce conversational text in edge cases; `any` cannot.

- **What happened to partial assistant prefill on current models?**
  → It's legacy — a request ending with an assistant message now returns a validation error. Use structured outputs for format, enum schema fields for labels, system instructions for suppressing preamble.

- **Why do long conversations get slower and more expensive every turn?**
  → The full history is resent as input tokens on every request — cost and latency grow with conversation length. It's not a model or database defect.

- **What's the most effective response when an extraction fails semantic validation?**
  → Call Claude again with the source, the invalid extraction, and the specific validation errors — the validation-error feedback loop. Far better than retrying the same prompt.

- **Does schema compliance mean the output is correct?**
  → No. Structured outputs guarantee shape, not truth. Refusals and max-token stops can still yield nonconforming output. Domain validation in code remains necessary.

- **Do tool definitions and schemas cost tokens?**
  → Yes — they count as input/overhead tokens. A large schema plus a long document can approach the context limit, degrading accuracy on content near the end.

# Review sheet — section 2

## q-s02-01 (warmup)

What should a good tool description include?

- **A.** Only the parameter list — the name conveys the rest
- **B.** Marketing-style language emphasizing the tool's power
- **C.** What it does, when to use it, when NOT to use it, input formats, what the output contains, and limitations ✅
- **D.** Internal implementation details like which backend API it calls

  - A: The agent selects tools from descriptions; a bare parameter list omits the judgment cues (when / when not) that prevent misuse.
  - B: Persuasive language biases selection without informing it.
  - C: The agent's entire basis for choosing and invoking the tool is its name, description, schema, and examples — so the description must cover purpose, applicability, boundaries, formats, outputs, and limits.
  - D: Implementation details don't help the model decide when the tool is appropriate.

  _source: ## 2 > What to Know (tool descriptions)_

## q-s02-02 (core)

A fitness app has one tool, `log_workout(type, value, unit)`, where cardio workouts need duration/distance and strength workouts need sets/reps/weight. Logs show frequent invalid combinations. What is the right fix?

- **A.** Add validation that rejects invalid combinations with an error message
- **B.** Split into `log_cardio_session` and `log_strength_session` so each schema encodes its own required fields ✅
- **C.** Expand the description to enumerate valid combinations for each type
- **D.** Make all parameters optional so no combination is invalid

  - A: Post-hoc validation catches mistakes after the model makes them; better schemas prevent them from being expressible.
  - B: When operations have interdependent constraints, separate tools make the schema itself encode the distinction — invalid combinations become unrepresentable rather than merely discouraged.
  - C: Description prose asks the model to memorize rules the schema could enforce structurally.
  - D: That makes every invalid call schema-legal, trading visible failures for silent bad data.

  _source: ## 2 > Parameter Design (split tools)_

## q-s02-03 (core)

Users refer to projects by name, names are ambiguous, and a delete tool acts on whatever name string the model passes. An agent just deleted the wrong project. What is the correct pattern?

- **A.** Require the model to double-check the name with the user before every delete
- **B.** Fuzzy-match names and act on the closest match above a similarity threshold
- **C.** Add an "are you sure?" boolean parameter to the delete tool
- **D.** Lookup-then-act: a search tool returns candidate IDs with distinguishing metadata; when multiple match, the user picks; the delete tool accepts only unambiguous IDs ✅

  - A: Per-call confirmation prompts add friction everywhere while the interface still permits acting on an ambiguous name.
  - B: Fuzzy matching automates the guess that caused the incident.
  - C: The model sets that boolean itself — it adds ceremony, not safety.
  - D: Resolving which entity via search + user selection, then acting only on stable IDs, removes name ambiguity from the destructive path entirely.

  _source: ## 2 > Parameter Design (lookup-then-act)_

## q-s02-04 (core)

A search tool finds nothing matching the query. What should it return?

- **A.** A successful result with an empty `results` array and a total count of zero ✅
- **B.** An `isError: true` result saying "no matches found"
- **C.** Nothing — omit the tool result so the model moves on
- **D.** A retryable error so the agent tries alternative phrasings

  - A: "No matches" is a valid answer, not a failure. A successful empty result tells the agent the query worked and the data simply isn't there.
  - B: Flagging it as an error invites the agent to retry a perfectly valid query as though the tool broke.
  - C: Tool calls must have results; omission is a protocol violation.
  - D: Encouraging retries conflates "absent" with "failed" — the classic empty-vs-error confusion.

  _source: ## 2 > Output Design (empty vs error)_

## q-s02-05 (core)

A document search tool returns: "Found these documents: Maintenance Schedule, Lab Access Plan, Vendor Notes." What is the main design problem?

- **A.** The response is too short to be useful
- **B.** The tone is too informal for a tool result
- **C.** No identifiers or structured fields — downstream tools can't act on prose titles, and the agent must guess how to reference each document ✅
- **D.** It should have returned the full text of each document

  - A: Length isn't the issue — the same information structured would be excellent.
  - B: Tools aren't judged on tone; they're judged on machine-usability.
  - C: Tool results should be structured and carry the IDs the next decision needs (`document_id`, owner, updated_at). Prose-only output forces fragile title-matching downstream.
  - D: Returning full text wastes tokens; results should be compact and useful for the next decision.

  _source: ## 2 > Output Design_

## q-s02-06 (core)

A tool wraps an API whose queries can match thousands of records. How should it handle result volume?

- **A.** Fetch all pages so the agent has complete information
- **B.** Return the first page plus a `total_count` and a cursor, fetching more only when actually needed ✅
- **C.** Return only the count and require a second call for any data
- **D.** Cap results at 10 and silently drop the rest

  - A: Auto-fetching everything burns latency and tokens and can blow the context on large matches — usually for items nobody needed.
  - B: First page + total + cursor gives the agent enough to decide whether more is worth fetching. Volume control stays a deliberate choice.
  - C: Forcing two calls for every query adds a turn to the common case.
  - D: Silent truncation misrepresents the result set; the agent can't know more exists.

  _source: ## 2 > Pagination_

## q-s02-07 (stretch)

An agent platform has 80 connectors' worth of operations. Exposing them all degrades tool selection. Which design fixes this without hiding decisions from the agent?

- **A.** Group operations into ten mega-tools with an `operation` parameter
- **B.** Keep all 80 exposed but sort the most-used first
- **C.** Add a single `find_and_execute(task)` tool that searches for and runs the best operation
- **D.** Discovery tools return a ranked shortlist of relevant operations, which are then dynamically added to the agent's available tools for subsequent turns ✅

  - A: Mega-tools recreate the free-form `action` parameter problem — schemas can no longer encode per-operation requirements.
  - B: Ordering doesn't reduce the choice set; selection accuracy still degrades with count.
  - C: Search-and-execute hides the final decision inside one call and can perform the wrong action before anyone can inspect it.
  - D: Progressive availability narrows choices while keeping execution a separate, inspectable step — the pattern the Agent SDK supports natively via tool search and dynamic registration.

  _source: ## 2 > Large Tool Sets and Progressive Availability_

## q-s02-08 (core)

An ML-backed extraction tool returns per-field confidence scores. How should it help the agent decide what needs human review?

- **A.** Return the data plus a derived `requires_review` boolean with reasons, using thresholds calibrated against a labeled validation set ✅
- **B.** Return raw confidence scores and let the model judge each one
- **C.** Round confidences to high/medium/low so the model has fewer values to reason about
- **D.** Suppress fields below 0.9 confidence entirely

  - A: Calibrated thresholds turn statistical scores into consistent decisions; the boolean plus reasons gives the agent an actionable signal instead of an interpretation problem.
  - B: Raw scores invite both over-trust and over-escalation — the model has no basis for knowing what 0.62 means for this pipeline.
  - C: Coarser buckets are still uncalibrated; the interpretation burden remains.
  - D: A hard cutoff hides potentially correct data and still embeds an uncalibrated threshold.

  _source: ## 2 > Output: requires_review and Decision Hints_

## q-s02-09 (core)

A workspace-deletion operation must always be previewed by a human before executing. Which design actually enforces that?

- **A.** A `dry_run: true` default the model can override when the user seems sure
- **B.** A system prompt rule: "always preview deletions before executing"
- **C.** `preview_delete_workspace` returns the impact and a one-time confirmation token; `execute_delete_workspace` requires that token and verifies it matches the previewed action ✅
- **D.** Logging every deletion for weekly audit

  - A: The model controls the flag, so nothing structurally prevents `dry_run: false` on the first call.
  - B: Prompt rules are probabilistic; a must-always-hold invariant needs structural enforcement.
  - C: The two-tool token pattern makes execution *impossible* without a preview having happened — the sequence is enforced by the interface, not by model compliance.
  - D: Audit finds violations after the workspace is gone.

  _source: ## 2 > Safety and Confirmation_

## q-s02-10 (core)

An agent can already run Bash. Why promote email-sending to a dedicated `send_email` tool anyway?

- **A.** Bash cannot make network calls in agent environments
- **B.** A dedicated tool can be gated behind confirmation, rendered specially, audited, and safely parallelized — `bash -c "curl -X POST ..."` gives the application only an opaque string to inspect ✅
- **C.** Dedicated tools execute faster than shell commands
- **D.** The model writes more reliable curl commands when a tool with the same name exists

  - A: Bash typically can make network calls — that's exactly the problem.
  - B: The heuristic: promote an action to a dedicated tool when the application needs to intercept it. A structured `send_email` call can pass through approval and audit paths; an opaque command string cannot.
  - C: Speed isn't the distinction; interceptability is.
  - D: Tool existence doesn't improve unrelated shell commands.

  _source: ## 2 > Where Tools Run (Bash vs dedicated tool)_

## q-s02-11 (stretch)

Which pair of composition decisions is correct for (1) a booking system where slots can be taken between calls, and (2) a research workflow that retrieves sources and writes conclusions?

- **A.** (1) Combine availability-check and reserve into one atomic operation — separate calls create a race; (2) keep retrieval and conclusion-writing separate — the model must inspect sources and preserve provenance ✅
- **B.** (1) Keep check and reserve separate for auditability; (2) combine retrieve-and-conclude for efficiency
- **C.** Combine both — fewer calls is always better
- **D.** Separate both — composition is an anti-pattern

  - A: Composition is for mechanical sequences and atomicity needs; separation is for judgment. Booking needs atomicity (the race is real); research needs the model between retrieval and writing.
  - B: Backwards on both counts: the separate booking calls are exactly what creates the race, and merging research steps hides required judgment.
  - C: Combining the research steps removes the inspection and provenance step the task needs.
  - D: Atomic check-and-book is a legitimate, sometimes necessary composition.

  _source: ## 2 > Tool Composition_

## q-s02-12 (core)

A neighborhood-info tool requires an address, so agents always call `get_property_details(property_id)` first just to extract the address and pass it along. What is the better design?

- **A.** Cache the address after the first lookup to speed up later calls
- **B.** Combine both tools into one `get_property_with_neighborhood` call
- **C.** Have the system prompt remind the agent to fetch details first
- **D.** Have the neighborhood tool accept `property_id` directly and resolve the address internally — the intermediate hop is mechanical, requiring no model judgment ✅

  - A: Caching speeds the workaround instead of removing it.
  - B: Merging couples two capabilities that are separately useful; the actual problem is just the parameter choice.
  - C: Prompt guidance institutionalizes the unnecessary hop.
  - D: Prefer stable identifiers over derived intermediates: when a dependency is mechanical, the tool should resolve it internally, eliminating a lookup's latency and its failure coupling.

  _source: ## 2 > Parameter Design / Tool Composition (stable identifiers)_


# Flashcards

- **What must a good tool description cover?**
  → What it does, when to use it, when NOT to use it, required input formats, what the output contains, and limitations/safety concerns. The description IS the agent's decision basis.

- **When should one tool be split into several?**
  → When operations have different required fields or interdependent constraints. Separate tools let each schema encode its own requirements — invalid combinations become unrepresentable.

- **What is lookup-then-act?**
  → A search tool returns stable IDs with distinguishing metadata; mutating tools accept only IDs. Ambiguous names never reach a destructive operation. Multiple candidates → let the user pick.

- **A search finds nothing. Error or success?**
  → Success — return an empty `results` array with a count. `isError` would make the agent retry a valid query. Absence and failure must be distinguishable.

- **How should a tool handle APIs that return thousands of matches?**
  → Return the first page + `total_count` + a cursor. Fetch more only when needed. Auto-fetching every page burns latency, tokens, and context.

- **An agent has dozens of connectors. How do you avoid tool-selection degradation?**
  → Progressive availability: discovery tools return a ranked shortlist, then relevant tools are dynamically added to the agent. NOT a `find_and_execute` tool — that hides the final decision.

- **Why is `dry_run: boolean` not a safety mechanism?**
  → The model sets the flag, so nothing prevents `dry_run: false`. Use preview → one-time confirmation token → execute-with-token so the interface enforces the sequence.

- **When is combining two tools into one the RIGHT call?**
  → Mechanical sequences with no decision between steps, repeated lookups that always co-occur, and atomicity needs (check-and-book where a slot could be taken between calls). Never to hide judgment.

- **ML tool outputs include confidence scores. Return them raw?**
  → No — calibrate thresholds against a labeled set and return a derived `requires_review` boolean with reasons. Raw scores invite over-trust and over-escalation.

- **When should an action get a dedicated tool instead of going through Bash?**
  → When the application needs to gate, confirm, render, audit, or parallelize it. A `send_email` call can be intercepted; `bash -c "curl ..."` is an opaque string.

# Review sheet — section 3

## q-s03-01 (warmup)

A read-only API call inside a tool times out, and immediate retries usually succeed. Where should the retry happen?

- **A.** At the model level — return the error so the agent can decide
- **B.** Inside the tool, with backoff — the model doesn't need to see transient infrastructure noise ✅
- **C.** At the user level — ask them to try again later
- **D.** Nowhere — timeouts should end the session for safety

  - A: Sending it to the model costs a turn and tokens for a decision that has only one right answer.
  - B: Transient failures on safe reads are the tool's job to absorb. Surface only the final success or failure.
  - C: Punting recoverable infrastructure noise to users is the worst experience available.
  - D: A read timeout threatens nothing; ending the session is wildly disproportionate.

  _source: ## 3 > What to Know (retry inside tool)_

## q-s03-02 (core)

A `search_catalog` tool fails 12% of the time: ~8% transient timeouts that succeed on retry, ~4% syntax errors in user-provided filters that never succeed. Today both return the same generic error. What is the correct redesign?

- **A.** Return `retryable: true` for timeouts and `retryable: false` for syntax errors, and let the agent handle both
- **B.** Retry everything twice inside the tool before returning any error
- **C.** Return richer error text describing both possibilities so the model can judge
- **D.** Retry transient errors inside the tool with backoff, surfacing only final outcomes; surface syntax errors immediately with validation details the model can correct ✅

  - A: Better than nothing, but the boolean still spends a model turn on retries the tool could do itself — and the agent may retry anyway.
  - B: Retrying syntax errors wastes time on failures that can never succeed.
  - C: Describing ambiguity doesn't resolve it; the tool knows which category occurred and should act on that knowledge.
  - D: Each failure class gets handled where the needed information lives: the tool absorbs recoverable noise; the model gets actionable detail for input errors it can actually fix.

  _source: ## 3 > Retry Responsibility_

## q-s03-03 (core)

For an MCP `check_availability(user_email)` tool, a caller omits the required `user_email` parameter entirely. Separately, a correct call finds the calendar API returns 404 because the user doesn't exist. How are these two classified?

- **A.** Omitted required parameter = protocol error (JSON-RPC); user-not-found = tool execution error with `isError: true` ✅
- **B.** Both are protocol errors — each violates the tool's contract
- **C.** Both are tool execution errors — the tool was named correctly in both
- **D.** Omitted parameter = execution error; 404 = protocol error since it's an HTTP failure

  - A: A structurally malformed call (missing schema-mandated parameter) never validly invokes the tool — protocol tier. A correctly invoked tool whose operation fails (missing record, 503) reports through `isError: true`.
  - B: The 404 case invoked the tool correctly; the failure is in the operation, not the protocol.
  - C: The missing-parameter call fails schema validation before the tool ever runs.
  - D: Backwards on both: HTTP status codes from upstream APIs are operation outcomes, not MCP protocol failures.

  _source: ## 3 > MCP Error Tiers_

## q-s03-04 (core)

An MCP tool's upstream service returns 503 (temporarily down). The developer makes the server raise a JSON-RPC error. Why is this wrong?

- **A.** JSON-RPC errors are reserved for authentication failures only
- **B.** It isn't wrong — infrastructure failures are protocol-level by definition
- **C.** The tool was invoked correctly and the operation failed — that is a tool execution error (`isError: true`), not a protocol failure; business and backend failures must not masquerade as protocol errors ✅
- **D.** 503 responses should be silently converted into empty results

  - A: Protocol errors cover malformed requests, unknown tools, and schema violations — not upstream availability.
  - B: The protocol operation succeeded: a valid call reached a real tool. What failed is the work the tool attempted.
  - C: The two tiers carry different meanings to clients: protocol errors say "your request was malformed," execution errors say "your valid request's operation failed." Blurring them misleads every consumer of the server.
  - D: Empty results would falsely signal "success, nothing found" — a worse lie than the tier confusion.

  _source: ## 3 > MCP Error Tiers_

## q-s03-05 (core)

A payment tool's API call times out after the charge request was submitted. The tool cannot know whether the charge went through. What should it return?

- **A.** A retryable error, since timeouts are transient by nature
- **B.** An error communicating uncertainty — the charge may have succeeded; do not retry without an idempotency check; verify via status lookup or confirm with the user ✅
- **C.** Success, since most submitted charges complete
- **D.** A validation error asking the model to check the card details

  - A: Marking it retryable invites the double charge — the retry-safety of timeouts applies to reads, not submitted writes.
  - B: Uncertain write state is its own category: report the uncertainty explicitly, block automatic retry, and steer the agent toward verification. This is the inverse of read-side timeout handling.
  - C: Fabricating certainty the tool doesn't have — some of those "successes" never charged, and some retries would charge twice.
  - D: The inputs weren't the problem; misclassifying this hides the real hazard.

  _source: ## 3 > Uncertain Side Effects_

## q-s03-06 (core)

A warranty-claim tool determines the device is outside its warranty window. How should it report this?

- **A.** Throw an exception so the framework logs the rejection
- **B.** Return an empty result — no claim was created
- **C.** Return a retryable error in case the dates were wrong
- **D.** Return a structured non-retryable business-rule error with a customer-facing explanation and next steps (paid repair, escalation for exception review) ✅

  - A: Frameworks often hide exception details from the model — the agent learns nothing usable.
  - B: Empty results mean "success with no matches"; this is a definitive business outcome, not an absence.
  - C: Business rules don't change on retry; marking it retryable wastes turns.
  - D: Business-rule failures are expected outcomes deserving structure: category, retryable=false, an explanation the agent can relay, and concrete next steps to offer.

  _source: ## 3 > Structured Error Results (business rule)_

## q-s03-07 (core)

When is model-level retry (surfacing the error to the agent) the RIGHT design?

- **A.** When the inputs or strategy need to change — validation failures, filter syntax errors, wrong identifiers ✅
- **B.** When the backend is briefly overloaded
- **C.** When the operation may have already caused a side effect
- **D.** Whenever latency budget allows the extra turn

  - A: The model should retry only what the model can fix — errors where new inputs or a different approach are needed, guided by structured validation details.
  - B: Transient overload is tool-level retry territory; the same request will succeed.
  - C: Uncertain side effects need verification or human confirmation, not any automatic retry.
  - D: Retry placement follows where the corrective information lives, not spare latency.

  _source: ## 3 > Retry Responsibility_

## q-s03-08 (stretch)

A team adds `retryable: true/false` to every error and considers transient-failure handling done. What does this design still cost, compared to retrying inside the tool?

- **A.** Nothing — the boolean gives the agent everything it needs
- **B.** It only fails when the boolean is set incorrectly
- **C.** Slightly larger payloads, but identical behavior
- **D.** Every transient failure still burns a model turn (tokens + latency) to make a decision with one right answer — and the agent may ignore the flag and retry anyway ✅

  - A: The agent must still receive the error, reason about it, and reissue the call — every time.
  - B: Even with perfect flags, the turn cost and behavioral risk remain.
  - C: Behavior is not identical: one design absorbs the noise, the other routes it through the model.
  - D: A flag is advice; in-tool retry with backoff is behavior. For failures where retrying is unambiguously correct, encode the behavior, not the advice.

  _source: ## 3 > Retry Responsibility (retryable boolean)_

## q-s03-09 (core)

A tool's backend API fails, and the tool returns `{"results": []}`. Why is this dangerous?

- **A.** It leaks backend implementation details to the model
- **B.** The agent reads it as "success — nothing matches" and confidently reports wrong information instead of recognizing a failure ✅
- **C.** Empty arrays are invalid JSON in tool results
- **D.** It forces an unnecessary retry loop

  - A: An empty array leaks nothing — the problem is what it falsely asserts.
  - B: Empty-result-on-failure converts an outage into misinformation: "the customer has no orders" versus "I couldn't check the orders." Failures must be distinguishable from absence.
  - C: Empty arrays are perfectly valid JSON.
  - D: The opposite — the agent won't retry because nothing looks wrong.

  _source: ## 3 > Common Pitfalls (empty data for failures)_

## q-s03-10 (warmup)

Why should expected business errors be returned as structured results rather than thrown as exceptions?

- **A.** Exceptions are slower to process than return values
- **B.** Exceptions crash the agent loop permanently
- **C.** Frameworks often hide exception details from the model, leaving the agent with no usable information to correct or explain the failure ✅
- **D.** Structured results are encrypted; exceptions are not

  - A: Performance isn't the issue; information loss is.
  - B: Most frameworks survive exceptions — they just swallow the detail.
  - C: An expected failure is information the agent needs: category, explanation, next steps. Exceptions tend to reach the model as a generic opaque failure, if at all.
  - D: Encryption has nothing to do with it.

  _source: ## 3 > Common Pitfalls (exceptions)_

## q-s03-11 (stretch)

A tool returns "Error: something went wrong, please try again" for every failure: timeouts, invalid dates, permission denials, and payment-submission timeouts alike. Which consequence is NOT caused by this design?

- **A.** The model runs out of context window faster due to error verbosity ✅
- **B.** The agent retries permanent failures that can never succeed
- **C.** Duplicate side effects when submitted writes are retried
- **D.** Users told to "try again later" for problems the agent could have fixed immediately

  - A: Correct — this is the one consequence the design does NOT cause. The message is short; context exhaustion isn't the failure mode. The other three are exactly what generic errors produce.
  - B: With no category information, the agent can't distinguish a bad date (fixable now) from a timeout, so it retries both.
  - C: "Please try again" on an uncertain write is an instruction to create duplicates.
  - D: Fixable validation errors get deferred as if they were infrastructure problems.

  _source: ## 3 > What to Know (error categories)_


# Flashcards

- **Name the five error categories for agent tools.**
  → Transient infrastructure (retry in tool), permanent validation (structured details to agent), business rule (non-retryable + explanation), permission (non-retryable + escalation path), uncertain write state (report uncertainty, no auto-retry).

- **Where does retry logic belong?**
  → Where the corrective information lives: tool-level for transient backend noise; model-level when inputs/strategy must change; human approval when retry could duplicate a side effect or violate policy.

- **MCP: protocol error vs tool execution error?**
  → Protocol (JSON-RPC error): the call itself was malformed — unknown tool, missing schema-required parameter. Execution (`isError: true`): the tool ran and the operation failed — 404, 503, business rules, permissions.

- **A write request times out AFTER submission. What must the tool do?**
  → Return an uncertain-state error: "delivery status unknown, may have succeeded, do not retry without idempotency check." Steer toward a status lookup or user confirmation. Never mark it retry-safe.

- **Why not throw exceptions for expected business errors?**
  → Frameworks often hide exception details from the model. Return structured results: category, retryable flag, user-facing explanation, next steps.

- **Backend API fails — can the tool return an empty list?**
  → No. An empty list means "success with no matches." Returning it on failure turns an outage into confident misinformation.

- **Why is a `retryable: true` flag weaker than retrying inside the tool?**
  → The flag still costs a model turn per transient failure, and the agent may ignore it. For unambiguously-correct retries, encode the behavior, not the advice.

- **Read timeout vs write-after-submission timeout — how do they differ?**
  → They're inverses: read timeouts are usually safe to retry (do it in the tool); a write submitted before timing out may have succeeded, so retrying risks duplicates — verify instead.

