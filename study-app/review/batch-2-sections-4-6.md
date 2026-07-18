# Review sheet — section 4

## q-s04-01 (warmup)

An extraction schema marks `attendee_count` as required, but many source articles never state attendance. What does this schema design cause?

- **A.** Validation errors on every article without a count
- **B.** The extractor skips those articles entirely
- **C.** Structural pressure to fabricate — the model must produce some value, so it invents plausible ones ✅
- **D.** Slower extraction while the model searches for the value

  - A: The output will validate fine — that's the problem. The invented number is schema-legal.
  - B: Extraction still runs; the schema just forces a value into the field.
  - C: A required field the source may not contain converts honest absence into invention. Make it optional or nullable so the model can say `null` truthfully.
  - D: Latency isn't the failure mode; fabricated data is.

  _source: ## 4 > Schema Design / Reducing Fabrication_

## q-s04-02 (core)

An equipment classifier uses a strict enum (`laptop`, `monitor`, `printer`), but new device categories keep appearing and validation failures pile up. What is the standard fix?

- **A.** Add an `other` enum value paired with a detail field capturing the source's actual wording ✅
- **B.** Remove the enum and accept free-text categories
- **C.** Retrain reviewers to map new devices onto the closest existing category
- **D.** Regenerate the schema weekly from observed categories

  - A: The `other` + `*_detail` pattern handles long-tail categories without schema rewrites: stable categories stay machine-usable, novel ones preserve source wording for later normalization.
  - B: Free text loses the machine-usability the enum existed to provide.
  - C: Forcing wrong categories corrupts data to satisfy the schema — the inverse of fixing it.
  - D: Constant schema churn breaks every consumer downstream; the escape hatch avoids the churn entirely.

  _source: ## 4 > Schema Design (enum escape hatch)_

## q-s04-03 (core)

Reviewers find fabricated values in extractions, and the team proposes a second LLM call to verify each extraction against the source. Why is this generally inferior to fixing the schema?

- **A.** Verification calls only work on documents under 10 pages
- **B.** Two calls double the rate limit consumption, which providers prohibit
- **C.** Verification models use different tokenizers, causing mismatches
- **D.** It adds cost and latency, can rationalize the original answer, and leaves the root cause — a schema demanding values the source lacks — untouched; allowing `null` lets the first call signal absence directly ✅

  - A: Document length isn't the issue.
  - B: Nothing prohibits it — it's just an expensive non-fix.
  - C: Tokenizers are irrelevant here.
  - D: The fabrication is caused by the schema's demand. A verifier can hallucinate too, and agrees with plausible inventions. Fix the incentive; keep verification passes as sampling-based audits on already-good pipelines.

  _source: ## 4 > Reducing Fabrication (verification call)_

## q-s04-04 (core)

For a review-summarization schema, when should `pros` be `null` rather than an empty array?

- **A.** Never — empty arrays and null are interchangeable
- **B.** When the document didn't address pros at all — an empty array claims "the reviewer mentioned no pros," which is a different assertion ✅
- **C.** When the array would exceed five items
- **D.** When the review is positive overall

  - A: They encode different claims, and downstream consumers will treat them differently.
  - B: Absence semantics matter: empty array = "explicitly none," null = "not addressed." Choosing deliberately keeps extractions honest for short or partial sources.
  - C: Size has nothing to do with the null/empty distinction.
  - D: Overall sentiment doesn't change what the document did or didn't address.

  _source: ## 4 > Reducing Fabrication (null vs empty array)_

## q-s04-05 (core)

Contracts contain amendments, and different sections state conflicting notice periods. Reviewers must audit every extracted value. What does the schema need?

- **A.** Higher-confidence extraction with `temperature: 0`
- **B.** A post-processing step that picks the most common value
- **C.** Provenance fields — `source_location`, `source_quote`, `effective_date` — and separate capture of original vs amended values rather than one scalar ✅
- **D.** A second extraction pass that only reads amendments

  - A: Temperature affects sampling variability, not conflicting sources or auditability.
  - B: Frequency isn't precedence — an amendment stated once beats an original value stated three times.
  - C: When documents amend and conflict, a single scalar is the wrong shape. Provenance fields make every value traceable and let reviewers audit the model's choice against the exact source text.
  - D: A separate amendments pass still needs provenance to justify which value won, and fragments the extraction.

  _source: ## 4 > Source Grounding and Provenance_

## q-s04-06 (stretch)

A team wants API-level citations attached to every field of a strict JSON structured output. What is the architectural reality?

- **A.** Citations and strict JSON structured outputs may be incompatible — citations need interleaved citation blocks while schemas constrain the JSON — so represent source locations explicitly as fields in your schema ✅
- **B.** Citations attach automatically to any JSON field when enabled
- **C.** Citations work with JSON if you lower the schema's strictness setting
- **D.** Citations replace the need for provenance fields in all extraction designs

  - A: The two features have conflicting output requirements. For structured extraction with provenance, the schema itself should carry `source_location`-style fields.
  - B: There is no automatic per-field citation attachment for constrained JSON.
  - C: Strictness settings don't reconcile interleaved citation blocks with constrained JSON output.
  - D: Citations suit narrative answers over documents; structured extraction still needs explicit provenance fields.

  _source: ## 4 > Source Grounding (citations vs structured outputs)_

## q-s04-07 (core)

Invoice extractions keep showing line items that don't sum to the stated total. What schema addition catches this without asking the model to reconcile values it can't verify?

- **A.** A `verified: true` field the model sets after checking its own math
- **B.** Explicit reconciliation fields — `calculated_total`, `stated_total`, `totals_match` — so mismatches are flagged mechanically ✅
- **C.** A required comment field explaining any discrepancy
- **D.** Rejecting any extraction where totals differ

  - A: Self-certification is the thing being doubted; the model asserting "verified" adds no evidence.
  - B: Reconciliation fields expose both numbers so application code flags mismatches automatically — catching OCR errors and extraction mistakes alike, with no self-reconciliation demanded of the model.
  - C: Free-text explanations aren't machine-checkable and invite rationalization.
  - D: Sometimes the mismatch is real (the invoice itself is wrong) — that's information to surface, not an extraction failure to reject.

  _source: ## 4 > Semantic Validation (reconciliation fields)_

## q-s04-08 (core)

In which failure case are retries with feedback UNPRODUCTIVE, no matter how good the correction prompt is?

- **A.** A locale-formatted number ("1,234") needs to become the integer 1234
- **B.** The source provides a nested object but the schema wants a flat array
- **C.** An ISO datetime needs truncating to a date
- **D.** The required information lives in an external document that was never provided to the model ✅

  - A: Trivially fixed on retry with feedback.
  - B: Restructuring is exactly what feedback-guided retries fix well.
  - C: A formatting fix the model handles immediately once told.
  - D: No retry can extract what isn't in the context — further attempts only produce hallucinated values. Retrieve the missing source or route to human review.

  _source: ## 4 > When Retries Don't Help_

## q-s04-09 (stretch)

A meeting transcript fits in context, but decisions and dollar amounts are scattered across hours of unrelated chatter, and extractions keep missing details. What is the highest-leverage change?

- **A.** Add a pre-extraction pass that surfaces relevant sections — decisions, action items, amounts, dates — into a structured intermediate, then extract from that ✅
- **B.** Add more few-shot examples of complete extractions
- **C.** Chunk the transcript and extract from each chunk independently
- **D.** Switch to a model with a larger context window

  - A: For long-but-in-context sources with buried facts, a model-driven pre-extraction pass keeps attention on what matters and substantially cuts missed or conflated details — better than chunking or more examples.
  - B: Few-shot helps unusual extraction patterns; it doesn't help find needles in a haystack.
  - C: Chunking spreads the haystack across requests and loses cross-chunk relationships (a decision revised an hour later).
  - D: The document already fits — capacity isn't the constraint, attention is.

  _source: ## 4 > Long and Scattered Documents_

## q-s04-10 (core)

A pipeline is 97% accurate overall, and leadership wants to auto-approve high-confidence extractions. What must happen first?

- **A.** Lower the threshold gradually while monitoring complaints
- **B.** Nothing — 97% exceeds the human baseline
- **C.** Break accuracy down by document type, field, and confidence band against a labeled set — aggregates can hide a segment running at 80% — then keep stratified sampling of auto-approved outputs after launch ✅
- **D.** A/B test several thresholds and keep the best F1

  - A: Complaints are lagging, incomplete feedback — systematic errors that look plausible never get reported.
  - B: Beating humans on average says nothing about where the pipeline fails.
  - C: Segment-level analysis is the prerequisite; uncalibrated confidence can't define a safe threshold, and post-launch stratified sampling catches hidden error patterns.
  - D: Threshold optimization before segmentation tunes against a misleading aggregate.

  _source: ## 4 > Confidence and Human Review (Validating Automation Plans)_

## q-s04-11 (core)

Documents arrive with mixed urgency: most tolerate delay, some have tight SLAs. How should batch vs real-time processing be assigned?

- **A.** Batch everything and mark urgent documents as high priority within the batch
- **B.** Route per-document: standard documents to the Batch API for cost savings, urgent ones to the real-time Messages API ✅
- **C.** Process everything real-time to be safe
- **D.** Alternate batches hourly between urgent and standard queues

  - A: Batches can't expedite items inside them — batch latency is precisely why urgent documents don't belong there.
  - B: Routing is per-document, not per-workload: each document goes to the API whose latency profile matches its deadline. Join batch results by `custom_id`, since order isn't guaranteed.
  - C: Paying real-time prices for delay-tolerant volume forfeits the batch discount for nothing.
  - D: Urgent items still wait for a batch window; the SLA problem remains.

  _source: ## 4 > Batch Extraction (mixed urgency)_

## q-s04-12 (core)

Corrections data shows informal measurements ("a handful," "a splash") get invented or omitted in 23% of cases. What is the highest-leverage fix?

- **A.** Fine-tune a custom model on the corrections dataset
- **B.** Add a regex post-processor that detects informal units
- **C.** Create a new schema field for measurement style
- **D.** Add a few-shot example demonstrating the correct handling — extracting the informal phrase verbatim ✅

  - A: Fine-tuning is a heavyweight intervention to try only if focused prompt improvements fail to move the metric.
  - B: Regex can find informal units but can't teach the model what to do with them.
  - C: A new field doesn't change the invent-or-omit behavior.
  - D: For a clear recurring failure mode, one demonstrating example is usually the cheapest, most effective fix — examples teach subtle handling better than narrative rules.

  _source: ## 4 > Feedback Loops_


# Flashcards

- **What can a schema verify — and what can it never verify?**
  → It verifies shape (types, presence, enums). It can never verify that the source actually supports the value. Schema compliance ≠ source truth.

- **Why do required fields cause hallucination in extraction?**
  → If the source may not contain the information but the schema demands a value, the model is structurally pressured to invent one. Make such fields optional/nullable and teach `null`.

- **Strict enum, but new categories keep appearing. Pattern?**
  → Add an `other` enum value paired with a `*_detail` field holding the source's actual wording. Long-tail categories survive without schema rewrites.

- **Is a second LLM "verification call" a good fix for fabricated values?**
  → Generally no — it adds cost/latency, can rationalize the original answer, and ignores the root cause (schema demanding values). Fix the schema; use verification only as a sampling audit.

- **When are provenance fields (source_location, source_quote, effective_date) critical?**
  → Amendments, conflicting sections, reports needing citations, human audit. With amendments, capture original AND amended values — a single scalar is the wrong schema.

- **What goes in a correction request after failed validation?**
  → The source document, the previous (invalid) extraction, and the exact validation errors — with "don't change fields unless needed." Far better than blind retry or temperature: 0.

- **Which extraction failure can NO retry fix?**
  → When the information lives in an external document that was never provided. Retries only hallucinate. Retrieve the source or route to human review.

- **Long transcript fits in context but facts are scattered. Best approach?**
  → A pre-extraction pass: surface decisions, amounts, dates into a structured intermediate, then extract from that. Chunking loses cross-section links; few-shot doesn't find needles.

- **What must happen before auto-approving "97% accurate" extractions?**
  → Segment accuracy by document type, field, and confidence band against a labeled set — aggregates hide 80% segments. Then stratified sampling of auto-approved outputs after launch.

- **How do you match batch results back to their documents?**
  → Join by `custom_id` — batch results may arrive in any order. Resubmit only failures after fixing the cause.

# Review sheet — section 5

## q-s05-01 (warmup)

When is a plain sliding window the RIGHT context strategy?

- **A.** When conversations regularly reference decisions made much earlier
- **B.** When production logs show older messages are rarely referenced and users can easily re-state what's needed ✅
- **C.** When exact numbers must survive the whole session
- **D.** When safety-critical facts like allergies are involved

  - A: Referring back to earlier decisions is exactly where sliding windows fail.
  - B: Simple and cheap wins when the traffic profile supports it — e.g., 94% of messages referencing only the last 3–5 exchanges. The rare reach-back can be handled by asking the user to re-state.
  - C: Exact facts need structured state or retrieval, not truncation.
  - D: Safety-critical facts must survive verbatim in a retained reference section.

  _source: ## 5 > Sliding Window_

## q-s05-02 (core)

A RAG-backed assistant accumulates retrieval results from many earlier queries, crowding out conversational coherence. What is the recommended fix?

- **A.** Summarize all retrievals into one running digest
- **B.** Aggressively deduplicate retrieved passages before injection
- **C.** Move all retrievals to a vector store and re-retrieve per turn
- **D.** Apply a sliding window specifically to RAG results (keep the last 2–3 retrievals) while conversation history keeps its own policy ✅

  - A: A mega-digest is more complicated and rarely better — and it blurs the specific passages the current question needs.
  - B: Deduplication helps at the margin but doesn't stop unbounded accumulation.
  - C: Re-retrieving everything each turn adds infrastructure to solve what a simple windowing policy solves directly.
  - D: Different content types deserve different retention policies. Old retrievals are usually stale; recent ones matter. Windowing RAG separately preserves conversation flow.

  _source: ## 5 > Sliding Window (accumulated RAG results)_

## q-s05-03 (core)

What distinguishes a USEFUL progressive summary from a bad one?

- **A.** Useful summaries are shorter
- **B.** Useful summaries are written by a separate summarization model
- **C.** Useful summaries are structured — decisions, current preferences, open questions, important facts — while bad ones are vague narrative prose that loses the exact details users later ask about ✅
- **D.** Useful summaries include every message verbatim

  - A: Brevity without structure just loses information faster.
  - B: Who writes it matters less than what it captures.
  - C: The failure mode of summarization is blurring specifics. Explicitly extracting decisions, preferences, open questions, and facts preserves what "describe the conversation" prose loses.
  - D: That's not a summary — it defeats the purpose.

  _source: ## 5 > Progressive Summarization_

## q-s05-04 (core)

A cooking assistant must remember "room temperature butter means 68°F in this kitchen" and a shellfish allergy for the entire session, while ordinary chat is summarized freely. Where do those exact facts belong?

- **A.** In the most recent turns, repeated periodically by the assistant
- **B.** In a retained reference section at the start of context, exempt from trimming and summarization ✅
- **C.** In the progressive summary, marked as important
- **D.** In an external database queried when the topic comes up

  - A: Recent turns roll off; repetition depends on the model remembering to repeat.
  - B: Content that must stay exact and stable gets its own protected section — trimming applies only to the surrounding discussion. Mixing them into one summarization pass is how allergies get blurred.
  - C: Summaries are exactly where exact details go to die, "important" label or not.
  - D: Retrieval can miss; safety-critical session facts are small enough to keep permanently in context.

  _source: ## 5 > Persistent Reference Sections_

## q-s05-05 (core)

Users revise preferences mid-session ("actually, make the budget $4,200"), and the assistant sometimes applies outdated ones. What is the most reliable fix?

- **A.** A system prompt instruction: "always prioritize the most recently stated preferences"
- **B.** Few-shot examples of correctly applying preference changes
- **C.** Pruning turns that contain superseded preferences
- **D.** A canonical structured state object updated on every revision and included in each request — a single source of current truth ✅

  - A: The model usually follows it — but not reliably enough, since old and new values still compete in context.
  - B: Examples improve framing but don't give the model one authoritative place to look.
  - C: Pruning can delete context needed for other reasons, and revision turns are easy to miss.
  - D: Don't make the model infer current truth from a history containing both old and new values. Maintain the truth explicitly; send it every turn.

  _source: ## 5 > Structured State_

## q-s05-06 (core)

A user says "I have very low risk tolerance" and later "I want to maximize returns like my friends did with crypto." What should the assistant do?

- **A.** Follow the more recent statement — recency wins
- **B.** Recommend a balanced middle-ground portfolio
- **C.** Surface the contradiction and ask which priority should govern ✅
- **D.** Follow the first statement — safety-related preferences take precedence

  - A: Recency resolves revisions, not contradictions the user hasn't noticed making.
  - B: A balanced compromise risks fitting neither stated preference — the classic hidden-compromise failure.
  - C: Incompatible goals are the user's decision to resolve. Name the tension explicitly; proceed once one priority governs.
  - D: Assuming precedence silently still guesses — and this decision matters.

  _source: ## 5 > Structured State (conflicting preferences)_

## q-s05-07 (core)

A research assistant summarizes paper discussions after 8 turns, but users then ask for precise p-values and sample sizes the summaries blurred. What is the most direct fix?

- **A.** Re-inject the relevant source sections on demand when a question signals the need for precision ✅
- **B.** Build a structured fact store of every numerical detail in every paper
- **C.** Make the summaries higher-fidelity so they preserve all numbers
- **D.** Stop summarizing and keep full transcripts

  - A: On-demand retrieval restores exactness only when needed and scales across unpredictable follow-ups.
  - B: Heavier to build and may not match the variety of questions users actually ask.
  - C: Summaries that preserve every number balloon back toward the original document.
  - D: That reintroduces the context growth the summarization existed to control.

  _source: ## 5 > Retrieval and Fact Stores_

## q-s05-08 (core)

An agent investigating return requests has called `lookup_order` many times; each response has 40+ fields and the raw outputs now dominate context. What is the most reliable approach?

- **A.** Summarize all the order responses into one prose paragraph
- **B.** Move the responses to a vector database and retrieve as needed
- **C.** Compress each prior response to its return-relevant fields (order_id, dates, items, return_window, status) and continue ✅
- **D.** Stop making lookups and work from what's already in context

  - A: Prose summarization blurs the IDs and dates the investigation turns on.
  - B: Retrieval infrastructure to re-find data the agent already has is complexity without benefit.
  - C: Tool result compression: after processing, keep the fields that matter for the task and drop backend noise. Context stays lean without losing decision-relevant facts.
  - D: The investigation may genuinely need more lookups; the fix is compressing results, not starving the task.

  _source: ## 5 > Tool Result Compression_

## q-s05-09 (stretch)

How do API-native compaction and context editing differ, and when is application-level management still required?

- **A.** Compaction deletes old turns; context editing rewrites them — use either when facts must survive verbatim
- **B.** Compaction summarizes earlier history into a compact block; context editing prunes stale content like old tool results — but when specific facts must survive verbatim, application-level structures (state objects, reference sections) are still the right tool ✅
- **C.** They are the same mechanism with different names
- **D.** Both require you to build and tune your own summarization pipeline

  - A: Backwards: compaction summarizes rather than deletes, and neither guarantees verbatim survival of specific facts.
  - B: Summarize vs prune is the distinction. API-native mechanisms excel at "keep a long session alive" with no plumbing; application-level control is for content you must guarantee survives. They compose well.
  - C: They do different work — one condenses, one clears.
  - D: Avoiding that pipeline is precisely their value.

  _source: ## 5 > API-Native Context Management_

## q-s05-10 (core)

A customer returns 6 hours after a support session about a pending billing case. How should the new session begin?

- **A.** Resume the full prior transcript with an instruction to prefer recent tool results
- **B.** Resume the transcript but filter out old tool_result messages
- **C.** Configure the agent to re-call all previously used tools at session start
- **D.** Start with a structured summary of prior interaction (issue, actions taken, known IDs, last known status) and fetch fresh state before making claims about current status ✅

  - A: Agents reference old tool results regardless of instructions — especially when the stale results are more detailed than fresh ones.
  - B: Filtering results while keeping turns that reference them confuses the model about missing data.
  - C: Re-calling everything wastes calls on tools irrelevant to the new question.
  - D: Tool results age. A compact structured summary carries continuity; targeted fresh lookups carry truth. `fresh_lookup_required: true` makes staleness explicit.

  _source: ## 5 > Returning Users and Stale Data_

## q-s05-11 (stretch)

Mid-conversation, an external system learns the user's order has shipped. The user hasn't asked about it. How does this information reach the model?

- **A.** Your application includes the fresh state in the next request — a state block or context section — made clearly more authoritative than any stale tool results ✅
- **B.** Claude notices the change through its connection to your order system
- **C.** Generate an unsolicited assistant message announcing the shipment
- **D.** Wait until the user asks, then have a tool look it up

  - A: The model knows nothing outside the request. External updates enter as application-injected state — and must outrank older tool results that say otherwise.
  - B: No such connection exists; the API is stateless.
  - C: Unsolicited assistant turns are a product decision, not a context mechanism — don't fabricate them unless proactive notification is intentional.
  - D: Viable, but it leaves the model asserting stale status if the user asks indirectly; injecting current state is the principled fix.

  _source: ## 5 > External Updates During a Conversation_

## q-s05-12 (warmup)

A model has a very large context window, so the team stops worrying about what goes into context. What are they confusing?

- **A.** Input pricing with output pricing
- **B.** Latency with throughput
- **C.** Capacity with attention — fitting in the window doesn't make every detail equally salient ✅
- **D.** Context windows with training data size

  - A: Pricing isn't the conceptual error here.
  - B: Neither is the latency/throughput distinction.
  - C: A huge window means content *can* be included, not that it will be *attended to* equally. Curation still matters — competing, stale, and verbose content dilutes what's important.
  - D: Training data is unrelated to per-request context.

  _source: ## 5 > Common Pitfalls (capacity vs attention)_


# Flashcards

- **Match the need to the context strategy: recent flow / preferences / exact facts / creative canon.**
  → Recent flow → verbatim recent turns. Preferences → structured state object. Exact facts → retrieval or fact store. Creative canon → compact reference "bible" section.

- **When does a plain sliding window work — and when does it fail?**
  → Works when logs show older messages are rarely referenced (users can re-state). Fails when users reach back to earlier decisions, preferences, or exact data.

- **RAG results from many old queries are crowding context. Fix?**
  → Apply a sliding window specifically to RAG results (keep last 2–3 retrievals) while conversation history keeps its own policy. Different content, different retention.

- **What makes a progressive summary USEFUL?**
  → Structure: Decisions / Current preferences / Open questions / Important facts. Vague narrative prose loses exactly the details users later ask about.

- **Where do allergies, user-defined terms, and world rules live in a long session?**
  → A retained reference section at the start of context, exempt from trimming/summarization. Only the surrounding discussion gets summarized.

- **Users revise preferences mid-session and the agent applies old ones. Most reliable fix?**
  → A canonical structured state object updated on every revision and sent every request. More reliable than "prioritize recent" instructions, pruning, or few-shot examples.

- **Summaries blurred the exact numbers users now ask about. Most direct fix?**
  → Re-inject the relevant source sections on demand when a question signals precision is needed. Scales better than a full fact store or number-preserving summaries.

- **Verbose tool results are dominating context. What's the pattern?**
  → Tool result compression: after processing, keep only task-relevant fields (IDs, dates, statuses), drop backend noise — better than prose summaries or a vector store.

- **Compaction vs context editing — what does each do?**
  → Compaction summarizes earlier history into a compact block (session keeps going). Context editing prunes stale content like old tool results. App-level structures still own must-survive-verbatim facts.

- **How should a session resume after the user returns hours later?**
  → Structured summary of prior interaction (issue, actions, known IDs, last status) + fresh lookups before claiming current status. Old tool results are stale; agents cite them despite instructions.

# Review sheet — section 6

## q-s06-01 (core)

An application sends the system prompt only on the first turn, assuming Claude remembers it. What actually happens?

- **A.** Behavior diverges from the configured persona immediately on the first request that omits it ✅
- **B.** Behavior degrades gradually as the conversation grows
- **C.** Nothing — the API caches the system prompt per conversation
- **D.** The model asks the user what its instructions were

  - A: No memory between calls means an omitted system prompt simply doesn't exist for that request — the divergence is immediate, not gradual. (Gradual drift with the prompt present is a different phenomenon: attention competition.)
  - B: Gradual degradation is the signature of dilution WITH the prompt present; omission fails instantly.
  - C: There is no per-conversation caching of instructions — every request stands alone.
  - D: The model doesn't know instructions are missing; it just behaves without them.

  _source: ## 6 > What to Know (system prompt every request)_

## q-s06-02 (core)

A system prompt is verifiably sent on every request, yet persona adherence weakens after many turns. Why?

- **A.** The API truncates system prompts in long conversations
- **B.** The model's context window is full
- **C.** Attention competition — the model's own recent outputs and the latest user turns increasingly compete with the system prompt, so behavior drifts even though the prompt is unchanged ✅
- **D.** System prompts expire after a fixed number of turns

  - A: The API doesn't truncate your system prompt.
  - B: Drift happens well before the window fills; capacity isn't the mechanism.
  - C: Dilution is structural: accumulated conversation becomes a behavioral pattern that competes with instructions. Fixes are structural too — reinforce at breakpoints, use examples, move hard rules into code.
  - D: No such expiry exists.

  _source: ## 6 > What to Know / Prompt Dilution_

## q-s06-03 (warmup)

What do XML-style tags (`<role>`, `<safety>`) actually contribute to a system prompt?

- **A.** The API parses them and enforces each section's rules
- **B.** Salience and organization — sections separate concerns, and constraints become referenceable later ("apply the rule from <safety>") ✅
- **C.** They compress the prompt to fewer tokens
- **D.** Nothing — they are purely cosmetic

  - A: No API-level enforcement is attached to tags — they're not magic.
  - B: Structure helps the model keep concerns distinct (persona vs style vs safety) and lets later turns reference specific sections by name.
  - C: Tags add tokens, slightly.
  - D: Not magic, but not cosmetic either — organization measurably improves salience.

  _source: ## 6 > What to Know (XML tags)_

## q-s06-04 (stretch)

A high-traffic agent uses prompt caching. External webhooks frequently update user state (order shipped, plan changed). Where should that fast-changing state go?

- **A.** Rewrite the system prompt on every state change — it's the natural home for current truth
- **B.** Bury it in a synthetic tool result
- **C.** Skip injection and let the agent look state up when asked
- **D.** Keep the system prompt stable and inject the state as a clearly labeled block later in the context, near the latest user turn — preserving the cached prefix ✅

  - A: Normally correct for state updates — but caching matches an exact prefix, and the system prompt heads that prefix. Rewriting it per change invalidates the cache for the whole conversation.
  - B: Tool results imply the agent asked; synthetic ones muddy that contract.
  - C: The agent will confidently assert stale status the moment the user asks indirectly.
  - D: The caching trade-off inverts the default placement: stable prefix up front, volatile state after the last breakpoint. This keeps cache reads high while state stays current.

  _source: ## 6 > What to Know (state updates vs caching)_

## q-s06-05 (core)

An assistant should adapt explanation depth to each user's demonstrated expertise. Which instruction style works better, and why?

- **A.** Conditionals — "if the user mentions X, assume novice; if they use term Y, assume intermediate" — because explicit triggers are testable
- **B.** A general principle — "adapt depth to the user's demonstrated proficiency" — because it lets the model integrate many implicit signals instead of shallow keyword matching ✅
- **C.** Both equally, if written clearly
- **D.** Neither — expertise adaptation requires fine-tuning

  - A: Keyword conditionals misclassify anyone who phrases things atypically — they force judgment into string matching.
  - B: Judgment-heavy behavior needs principles: vocabulary, framing, follow-up specificity, and error patterns all inform the read, and no conditional list captures them.
  - C: The failure mode of conditionals here is structural, not a writing-quality issue.
  - D: Models do this well from a principle; no tuning needed.

  _source: ## 6 > Principles vs Conditionals_

## q-s06-06 (core)

Which behavior belongs in an explicit conditional rather than a general principle — and what belongs in neither?

- **A.** Conditionals for tone adaptation; code for greetings
- **B.** Conditionals for all behaviors; code only for calculations
- **C.** Principles for everything; conditionals are always harmful
- **D.** Conditionals for safety triggers and policy bright lines ("if immediate medical emergency, direct to emergency services"); rules that must hold 100% of the time go into code, not the prompt at all ✅

  - A: Tone is judgment (principle territory); greetings hardly need code.
  - B: Blanket conditionals cause the conditional-explosion failure — shallow triggers replacing judgment.
  - C: Conditionals have a real role: crisp, high-stakes triggers where you want zero interpretation.
  - D: The three-tier rule: principles for judgment, conditionals for bright lines, code for guarantees. Prompts are probabilistic; 100% rules need enforcement.

  _source: ## 6 > Principles vs Conditionals_

## q-s06-07 (core)

A system prompt spends seven sentences describing how to summarize a beginner's question vs an expert's. Compliance is inconsistent. What is the denser alternative?

- **A.** Two or three contrasting few-shot examples showing the exact behavior for each case ✅
- **B.** Reordering the seven sentences by importance
- **C.** Adding "IMPORTANT" before the seven sentences
- **D.** Splitting the prompt into two prompts selected by a classifier

  - A: Examples are denser than prose for behavior the model must learn rather than recite — show both cases and adherence typically recovers.
  - B: Reordering prose doesn't fix prose being the wrong medium for subtle distinctions.
  - C: Salience markers help attention, not comprehension of a nuanced distinction.
  - D: Router complexity for a problem two examples solve.

  _source: ## 6 > Few-Shot Examples_

## q-s06-08 (core)

For a long-running workflow session, which reinforcement pattern fights prompt dilution WITHOUT cluttering every turn?

- **A.** Re-send the entire system prompt as a user message every five turns
- **B.** Append "remember your instructions" to each user message
- **C.** Brief user-role reminders of current operating constraints at natural breakpoints (task transitions, returns from idle, topic switches), plus treating the system prompt as living configuration updated between sessions ✅
- **D.** Raise the temperature so the model re-reads instructions

  - A: Wholesale re-sending bloats context and reads as noise rather than integrating with the conversation.
  - B: A per-turn nag becomes wallpaper — and clutters every exchange.
  - C: Breakpoint reminders integrate with what the model is already attending to; prompt versioning keeps the system prompt stating "what currently holds" for multi-session work.
  - D: Temperature has nothing to do with instruction attention.

  _source: ## 6 > Prompt Dilution (reinforcement patterns)_

## q-s06-09 (core)

When should an assistant ask a clarifying question instead of proceeding with a stated assumption?

- **A.** Whenever any detail is unspecified
- **B.** When interpretations lead to substantially different actions, the action is irreversible or costly, or the user has stated conflicting goals — and then ONE focused question, not a list ✅
- **C.** Never — always proceed and let the user correct
- **D.** Only when the user explicitly invites questions

  - A: Interrogating every ambiguity is friction; low-risk gaps deserve a stated assumption the user can redirect.
  - B: Risk decides. And when you do ask, one focused question beats a list of four — users typically answer only the first anyway. Pick the disambiguation that most changes your next action.
  - C: For irreversible, costly, or regulated actions, proceeding on a guess is the expensive path.
  - D: The trigger is risk and ambiguity, not invitation.

  _source: ## 6 > Clarifying Questions and Assumptions_

## q-s06-10 (core)

A user wants "the cheapest possible flight" and "arriving by 9 AM Friday, nonstop." No flight satisfies all three. What should the assistant do?

- **A.** Pick the cheapest flight and note the compromise in passing
- **B.** Present a middle option balancing price and schedule
- **C.** Ask a series of questions about all travel preferences
- **D.** Name the contradiction explicitly and ask which constraint should bend ✅

  - A: Silently sacrificing the schedule optimizes a constraint the user may care about most.
  - B: Hidden compromises satisfy neither stated goal and usually cause rework.
  - C: A preference interrogation buries the one question that matters.
  - D: Conflicting constraints are the user's call: surface the tension, ask the single governing-priority question, then act.

  _source: ## 6 > Clarifying Questions (conflicting preferences)_

## q-s06-11 (warmup)

Responses keep opening with "Great question! I'd be happy to help." What is the durable fix on current models?

- **A.** An explicit style instruction to respond directly with substance, paired with one or two examples of the desired opening ✅
- **B.** A partial assistant prefill starting the reply mid-sentence
- **C.** A longer list of banned phrases
- **D.** Lowering max_tokens so there's no room for preamble

  - A: Instruction plus example is the pattern that survives — show the opening you want.
  - B: Trailing assistant prefills are rejected on current models; this was the old trick.
  - C: "Never say X" lists play whack-a-mole with infinite phrasings.
  - D: Token limits truncate substance, not preamble specifically.

  _source: ## 6 > Response Format Control_

## q-s06-12 (core)

A team relies on "IMPORTANT:" and "NEVER" prefixes as their compliance mechanism for a billing policy rule. What is the correct assessment?

- **A.** Effective — capitalized markers guarantee attention and compliance
- **B.** Effective for short prompts, unreliable for long ones
- **C.** These markers improve salience but cannot guarantee behavior — a rule that must hold 100% of the time belongs in code, hooks, or tool logic, not prose ✅
- **D.** Ineffective — salience markers do nothing at all

  - A: No prompt text guarantees behavior; emphasis shifts probabilities.
  - B: Length isn't the boundary — probabilistic vs deterministic is.
  - C: The reliability ceiling of prompt language is structural. Salience markers are legitimate tools for emphasis, and the wrong tool for policy enforcement.
  - D: They do help salience — the error is treating help as guarantee.

  _source: ## 6 > Common Pitfalls_


# Flashcards

- **Is the system prompt a one-time initialization message?**
  → No — it must be sent on EVERY request. Omit it on later turns and behavior diverges immediately (not gradually). The model has no memory between calls.

- **The prompt is sent every turn, yet adherence weakens over a long session. What's happening?**
  → Attention competition (dilution): recent outputs and turns compete with the system prompt. Fix structurally — reinforce at breakpoints, use examples, move hard rules into code.

- **What do XML-style tags in system prompts actually do?**
  → Improve salience and organization, separate concerns (role vs style vs safety), and make sections referenceable later. Helpful — not magic, not enforced.

- **Principles vs conditionals vs code — which behavior goes where?**
  → Principles for judgment ("adapt depth to demonstrated expertise"). Conditionals for safety triggers and bright lines. Code for anything that must hold 100% of the time.

- **Why does converting every nuance into if-then conditionals backfire?**
  → It forces shallow keyword matching in place of judgment — atypical phrasings get misclassified, the prompt bloats, and adherence drops. The conditional explosion.

- **Long bulleted rule list, drifting behavior. Denser alternative?**
  → Replace chunks of rules with 2–3 contrasting few-shot examples. Examples teach distinctions the model must learn; prose is for things it can recite.

- **Two reinforcement patterns for long-running sessions?**
  → (1) Brief user-role reminders of current constraints at natural breakpoints. (2) System prompt versioning — treat it as living configuration stating what currently holds.

- **When to ask a clarifying question vs proceed with an assumption?**
  → Ask when interpretations diverge materially, the action is irreversible/costly, or goals conflict — and ask ONE focused question. Otherwise proceed with a stated assumption the user can redirect.

- **User states two incompatible goals. Correct behavior?**
  → Name the tension and ask which priority governs. Never average into a hidden compromise that satisfies neither.

- **Webhook updates user state mid-session on a cached, high-traffic agent. Where does the state go?**
  → Keep the system prompt stable (it heads the cached prefix); inject fast-changing state as a labeled block near the latest turn, after the last cache breakpoint.

