# Review sheet — section 7

## q-s07-01 (warmup)

In MCP, who controls tools, resources, and prompts respectively?

- **A.** All three are model-controlled
- **B.** Tools are model-controlled (actions to invoke); resources are application-controlled (context to provide); prompts are user/application-controlled (reusable workflows) ✅
- **C.** Tools are user-controlled; resources are model-controlled; prompts are server-controlled
- **D.** Control is negotiated per session between client and server

  - A: Only tools are invoked at the model's discretion.
  - B: The control model is the point: the model decides to act (tools), the application decides what context to supply (resources), users/applications invoke reusable templates (prompts).
  - C: Backwards on the first two.
  - D: The control assignments are part of the protocol design, not per-session negotiation.

  _source: ## 7 > What to Know (feature table)_

## q-s07-02 (core)

An MCP server for an internal API should expose the API's reference documentation and a way to place live orders. What is the right split?

- **A.** Both as tools — everything an agent touches is a tool
- **B.** Both as resources — servers should minimize tool count
- **C.** Documentation as a prompt template; orders as a resource
- **D.** Documentation as a resource (stable reference consulted before acting); order placement as a tool (dynamic action at moment of use) ✅

  - A: Making reference material a tool forces a call just to learn what's true — the schema-fetch tax.
  - B: A resource can't place an order; replacing tools with resources prevents acting at all.
  - C: Prompts are reusable workflows, not documentation storage; and orders are the canonical tool case.
  - D: Resources for what is true and stable; tools for computation and change. Complements, not alternatives — good servers expose both.

  _source: ## 7 > What to Know (resource vs tool decision rule)_

## q-s07-03 (core)

Agents struggle to pick among many similar tools across connected servers. Someone proposes one natural-language entry tool that re-routes requests to the underlying tools. Why is this the wrong fix?

- **A.** The aggregator hides the real tool surface from the model and tends to produce worse selection — improve descriptions and use progressive availability instead ✅
- **B.** Natural-language routing is prohibited by the MCP specification
- **C.** Aggregators cannot pass parameters through to underlying tools
- **D.** It works, but only for read-only tools

  - A: The model selects well when it can see accurate, distinct descriptions of a manageable surface. An opaque router replaces informed selection with a second, hidden selection problem.
  - B: Nothing prohibits it — it's just an anti-pattern.
  - C: Parameter passing is possible; the problem is the hidden decision, not plumbing.
  - D: Read-only vs mutating isn't the issue; visibility of the real surface is.

  _source: ## 7 > What to Know (aggregator anti-pattern)_

## q-s07-04 (core)

When is building an MCP server clearly worth it over a custom in-app tool?

- **A.** Whenever any external system is involved
- **B.** When the integration must be fastest possible — MCP adds no overhead
- **C.** When multiple AI clients or applications need the same integration — expose it once, reuse everywhere ✅
- **D.** When the workflow is deeply specific to a single application

  - A: External access alone doesn't require a protocol layer — a custom tool can call any API.
  - B: MCP's value is reuse and standardization, not raw speed.
  - C: Five AI tools needing the same ticketing data is the MCP sweet spot: one server, many clients.
  - D: That's the case for a custom tool inside the application — simpler than standing up a server.

  _source: ## 7 > Why MCP_

## q-s07-05 (core)

A team adopts MCP and assumes authentication, rate limiting, retries, and caching are now handled. What is the reality?

- **A.** Correct — the protocol includes middleware for all four
- **B.** MCP is a protocol, not a middleware platform — auth, rate limiting, retries, caching, authorization, and performance remain your system design responsibilities ✅
- **C.** The client library handles them if configured
- **D.** Only authentication is included; the rest is yours

  - A: The protocol standardizes how capabilities are exposed, not how they're operated.
  - B: MCP solves the integration-shape problem. Everything operational still has to be designed and built — same as any service.
  - C: Client libraries implement the protocol; they don't run your infrastructure concerns.
  - D: Not even auth comes free — it must be designed into the server.

  _source: ## 7 > Why MCP (limits)_

## q-s07-06 (core)

An agent keeps using generic shell commands instead of a connected server's specialized dependency-analysis tool. What is the most likely fix?

- **A.** Improve the MCP tool's description — when it beats generic alternatives, inputs/outputs, examples, key capabilities like transitive analysis ✅
- **B.** Remove the shell tool so the agent has no alternative
- **C.** Rename the MCP tool to sort first alphabetically
- **D.** Increase the server's connection priority

  - A: MCP tools compete with built-ins in one registry — the description is the tool's case for being chosen. "Analyzes code" loses to a familiar generic; a description explaining its edge wins.
  - B: The agent often legitimately needs generic tools too; removal breaks other work.
  - C: Alphabetical position isn't a selection signal.
  - D: No such priority mechanism drives model tool choice.

  _source: ## 7 > Tool Discovery and Selection_

## q-s07-07 (core)

A host auto-allows any MCP tool advertising `readOnlyHint: true`, skipping its confirmation flow. What is wrong with this policy?

- **A.** Nothing — that is exactly what annotations are for
- **B.** readOnlyHint doesn't exist; the standard hints are different
- **C.** Read-only tools still consume rate limits, so confirmation is always required
- **D.** Annotations are untrusted self-reports — a malicious or buggy server can label a destructive tool read-only; use annotations to pick which prompt to show, never to skip a security check policy requires ✅

  - A: Annotations inform UI affordances; they are not a security boundary.
  - B: `readOnlyHint` is a standard hint, alongside destructive, idempotent, and open-world hints.
  - C: Rate limits aren't the issue — trust is.
  - D: Base real permission decisions on server trust level, user policy, tool identity, and actual operation risk. The server grading its own homework doesn't count.

  _source: ## 7 > Tool Annotations and Trust_

## q-s07-08 (core)

What is the practical rule for choosing between a JSON-RPC protocol error and a tool result with `isError: true` — and what goes wrong with each misuse?

- **A.** Always prefer protocol errors; they're more visible to operators
- **B.** Use whichever produces the shorter message
- **C.** Failure before the tool's business logic could execute → protocol error; the tool reached its target and the operation failed → `isError: true`. Misusing `isError` for missing parameters makes the agent retry the same bad call; putting a 503 in a protocol error stops the agent from retrying later ✅
- **D.** Protocol errors for reads, isError for writes

  - A: Protocol errors don't reach the model as adaptable results — overusing them blinds the agent.
  - B: Message length is irrelevant to the semantics.
  - C: The boundary is where the failure occurred, and each misclassification causes a specific agent misbehavior — pointless identical retries, or abandoned retries that would have succeeded.
  - D: Read/write isn't the distinction; execution stage is.

  _source: ## 7 > MCP Error Handling_

## q-s07-09 (stretch)

A host connects dozens of MCP servers. Which two mechanisms keep the tool surface manageable without a session restart when capabilities change?

- **A.** Tool aliasing and schema compression
- **B.** Tool search / progressive availability (pull tool definitions on demand per task), and `list_changed` notifications (servers announce changed tool sets so clients refresh) ✅
- **C.** Connection pooling and lazy handshakes
- **D.** A master server that proxies all the others

  - A: Neither is an MCP surface-management mechanism.
  - B: Progressive availability spends context only on tools about to be used; `list_changed` lets a new capability appear mid-session. Design consequence: write descriptions that read well in isolation, since tools may be discovered via search.
  - C: Transport-level concerns; they don't shrink the model's tool surface.
  - D: That's the aggregator anti-pattern wearing a trench coat.

  _source: ## 7 > Tool Search and Progressive Availability_

## q-s07-10 (core)

In Claude Code, where should (a) a documentation server the whole team needs and (b) a server needing your personal API credentials be configured?

- **A.** Both in `.mcp.json` so configuration stays in one place
- **B.** Both in user scope for maximum availability
- **C.** (a) user scope; (b) project scope
- **D.** (a) project scope — `.mcp.json` at the repo root, checked in; (b) local or user scope inside `~/.claude.json`, where credentials stay on your machine ✅

  - A: `.mcp.json` is checked into version control — personal credentials in it leak to everyone who clones.
  - B: User scope hides the team server from teammates, who each must configure it manually.
  - C: Backwards: the shared server belongs in the shared file; the credentialed one must stay private.
  - D: Scope = visibility: project scope is shared via the repo; local and user scopes live in `~/.claude.json` and never leave the developer's machine.

  _source: ## 7 > MCP in Claude Code (scopes)_

## q-s07-11 (stretch)

The same MCP server name exists at local, project, and user scope with different configurations. What does Claude Code do?

- **A.** Connects once using the local definition — precedence is local > project > user, and the entire winning entry is used with no field merging ✅
- **B.** Connects three times, once per scope
- **C.** Merges the three configurations field by field
- **D.** Refuses to start until the collision is resolved

  - A: The precedence is deliberate: your local definition can point at a staging endpoint without touching the team's `.mcp.json`. One connection, whole-entry wins.
  - B: Name collisions resolve to a single connection, not three.
  - C: Fields are never merged across scopes — partial-override setups silently don't work.
  - D: Collisions are resolved by precedence, not treated as errors.

  _source: ## 7 > MCP in Claude Code (scope precedence)_

## q-s07-12 (warmup)

How do MCP prompts appear to users in Claude Code?

- **A.** As automatic behaviors the model applies silently
- **B.** As entries in the settings menu
- **C.** As slash commands, typically named `mcp__<server>__<prompt>` to disambiguate across servers ✅
- **D.** They are not accessible in Claude Code

  - A: Prompts are user/application-invoked, not silent model behavior.
  - B: They surface in the command interface, not settings.
  - C: The naming pattern tells you which server a prompt came from when several are connected.
  - D: They are fully supported — as slash commands.

  _source: ## 7 > MCP in Claude Code (prompts as slash commands)_


# Flashcards

- **MCP's three building blocks — and who controls each?**
  → Tools (model-controlled actions), resources (application-controlled context), prompts (user/application-controlled reusable workflows).

- **Resource or tool: database schemas, API specs, file catalogs?**
  → Resources — stable reference material the agent consults before acting. Tools are for dynamic computation at moment of use (live queries, orders, updates).

- **Agent overwhelmed by similar tools across servers. Is one natural-language router tool the fix?**
  → No — an aggregator hides the real tool surface and worsens selection. Improve descriptions and use progressive availability.

- **When is MCP worth it over a custom in-app tool?**
  → When the integration should be reusable across multiple clients/apps. One app, one bespoke workflow → a custom tool is simpler. MCP doesn't solve auth, retries, rate limits, or caching.

- **Agent ignores your specialized MCP tool and uses generic search. Fix?**
  → Improve the tool description: when it beats generics, inputs/outputs, examples, key capabilities. Don't remove the generic tools — the agent needs them too.

- **Are MCP tool annotations (readOnlyHint, destructiveHint) a security boundary?**
  → No — they're untrusted self-reports for UI affordances. A malicious server can lie. Base permissions on server trust, user policy, and real operation risk.

- **MCP error tiers: when protocol error vs isError: true?**
  → Failure BEFORE business logic could run (missing param, unknown method) → JSON-RPC protocol error. Tool reached its target and the operation failed (404, 503, permission) → isError: true.

- **Claude Code MCP scopes — where does each live and who sees it?**
  → Project: .mcp.json in repo, everyone. Local: ~/.claude.json keyed to project path, just you, this project. User: ~/.claude.json global, just you, everywhere. Credentials never go in project scope.

- **Same server name at multiple Claude Code scopes — what wins?**
  → local > project > user. One connection; the entire winning entry is used — fields are NOT merged across scopes.

# Review sheet — section 8

## q-s08-01 (warmup)

A code review always runs the same three stages in order: style, security, documentation. Which agentic pattern fits?

- **A.** Prompt chaining — the steps are fixed and known ✅
- **B.** Dynamic decomposition — reviews are investigations
- **C.** Parallel subagents — run all three at once
- **D.** Orchestrator-workers — a coordinator should choose the stages

  - A: Fixed workflows with known steps are chaining's home turf — the constraint buys reliability.
  - B: Nothing here depends on findings; the path never changes.
  - C: Plausible if stages are truly independent — but the canonical fit for a fixed known sequence is chaining, and later stages often build on earlier ones.
  - D: A coordinator choosing steps adds cost when the steps never vary.

  _source: ## 8 > Core Patterns_

## q-s08-02 (core)

Compare: (1) billing-dispute resolution that always runs verify identity → fetch invoice → check policy → propose adjustment; (2) security incident triage where the alert determines whether to pull logs, query a SIEM, page on-call, or all three. Which patterns match?

- **A.** Both dynamic decomposition — flexibility never hurts
- **B.** Both prompt chaining — consistency matters in production
- **C.** (1) prompt chaining; (2) dynamic decomposition — forcing chaining onto triage produces shallow analyses; forcing decomposition onto the fixed flow invites waste and inconsistency ✅
- **D.** (1) routing; (2) parallel subagents

  - A: Dynamic plans on mechanical work waste coordinator effort and produce inconsistent outputs.
  - B: A pre-written checklist for triage runs every step regardless and misses the actual cause.
  - C: Match the pattern to the shape of the work: fixed sequence → chain it; findings-dependent investigation → let the coordinator decide the next move from evidence.
  - D: Neither problem is a categorization problem, and triage steps aren't independent.

  _source: ## 8 > Core Patterns (chaining vs dynamic contrast)_

## q-s08-03 (core)

Dynamic decomposition fits an investigation, but what is its cost, and what mitigates it?

- **A.** Higher token prices per call — mitigated by caching
- **B.** Unpredictability — dynamic plans are harder to budget than fixed chains, so set explicit termination criteria and step caps ✅
- **C.** It requires a fine-tuned coordinator model
- **D.** It cannot use tools — mitigated by resource injection

  - A: Token pricing doesn't change by pattern.
  - B: The coordinator decides each next step from evidence, so cost and duration are open-ended by design. Bounds — termination criteria, step caps — keep the exploration budgetable.
  - C: No special model is needed.
  - D: Dynamic decomposition is tool-heavy by nature.

  _source: ## 8 > Core Patterns (dynamic decomposition trade-off)_

## q-s08-04 (core)

A coordinator has just retrieved three sentences and needs them summarized. Should it delegate to a subagent?

- **A.** Yes — delegation keeps the coordinator's context clean
- **B.** Yes — specialized subagents summarize better
- **C.** Only if a summarization subagent is already defined
- **D.** No — each delegation costs a tool call, fresh context, separate invocation, and result passing; for small work already in context, the coordinator should just do it ✅

  - A: Three sentences don't threaten anyone's context.
  - B: No specialist advantage exists at this scale.
  - C: Existence of the subagent doesn't change the economics.
  - D: Delegation earns its overhead when the task would flood the coordinator's context, needs a different prompt/toolset, or can run in parallel. None applies here.

  _source: ## 8 > When the Coordinator Should Not Delegate_

## q-s08-05 (core)

A coordinator splits 50 repository audits across parallel subagents. Some repos are 100× larger than others. How should the partition be built?

- **A.** Equal counts — 10 repos per subagent, simple and fair
- **B.** Balance partitions by expected effort, not raw count — total elapsed time is max(subagent durations), so one overloaded partition wastes all the parallelism ✅
- **C.** Give each subagent one repo and run 50 in parallel
- **D.** Sort by size and process largest-first sequentially

  - A: Equal counts with wildly unequal sizes means one subagent carries most of the work while others idle.
  - B: The slowest partition dictates the finish line. Balancing by size keeps every lane busy to the end.
  - C: Sometimes viable, but with shared rate limits and coordination overhead, effort-balanced chunks are the stated principle.
  - D: Sequential processing surrenders the parallelism entirely.

  _source: ## 8 > Parallel Subagents Across a Partition_

## q-s08-06 (core)

What does a freshly spawned subagent see of its parent's conversation?

- **A.** Only what the parent explicitly passes in the prompt, plus its own definition (system prompt, allowed tools) — no parent turns, no prior tool results, and no memory of earlier subagent runs ✅
- **B.** The full parent transcript up to the spawn point
- **C.** The parent's system prompt and the last five turns
- **D.** Everything except tool results

  - A: Subagents start fresh conversations. Everything they need — goal, findings, constraints, output shape — must be in the constructed prompt. "Resume the previous subagent" doesn't exist by default; continuity requires passing prior summaries or identifiers explicitly.
  - B: No automatic transcript sharing occurs.
  - C: No partial window is inherited either.
  - D: The exclusion isn't selective — nothing is inherited.

  _source: ## 8 > Multi-Agent Context Passing_

## q-s08-07 (core)

A report-writing subagent must produce an executive summary with citations. What should the coordinator hand it?

- **A.** The instruction "synthesize the findings" — subagents work best with autonomy
- **B.** The raw transcripts of every research subagent
- **C.** A structured source index mapping claims to source IDs, URLs, excerpts, dates, and uncertainty notes — not just a prose summary ✅
- **D.** The three most important findings, to keep the prompt short

  - A: A bare instruction with no materials produces a confident summary with invented structure.
  - B: Raw 100K-token outputs between agents is the anti-pattern — pass structured summaries plus indexes.
  - C: Citations require the claim→source mapping to physically exist in the handoff. Prose summaries destroy it; structure preserves it, along with dates and uncertainty.
  - D: Arbitrary truncation trades completeness for brevity at exactly the wrong stage.

  _source: ## 8 > Multi-Agent Context Passing (handoffs)_

## q-s08-08 (core)

Which tool assignment is right for a synthesis subagent that should work only from supplied findings?

- **A.** All tools — flexibility prevents dead ends
- **B.** The same tools as the research subagents, for consistency
- **C.** Search tools only, in case it needs to verify claims
- **D.** Possibly no external search tools at all — restricting tools keeps agents in role; more tools raise selection complexity and invite off-role behavior ✅

  - A: Every added tool is added selection complexity and a new way to wander off-task.
  - B: Its role differs from research; its toolset should too.
  - C: Fresh searching mid-synthesis undermines working from the vetted findings it was given.
  - D: Tool distribution follows role: web researcher gets search/fetch; document analyst gets read/extract; synthesizer may need nothing external at all.

  _source: ## 8 > Tool Distribution Across Agents_

## q-s08-09 (core)

In the Claude Agent SDK, subagent definitions exist but the orchestrator never delegates — it just answers directly. What is the classic cause?

- **A.** The subagents' system prompts are too long
- **B.** The Task/Agent tool is missing from the parent's `allowedTools` — delegation is itself a tool call, and without it the parent has no way to launch subagents ✅
- **C.** The parent's temperature is set too low for delegation
- **D.** Subagent definitions must be registered in `.mcp.json`

  - A: Definition length doesn't gate delegation.
  - B: The mechanism is easy to miss: spawning a subagent happens through a tool (typically `Task` or `Agent`), which must be allowed on the parent. The subagent's own `allowedTools` is separate and constrains it after spawn.
  - C: Temperature doesn't control tool availability.
  - D: Subagents aren't MCP servers; `.mcp.json` is unrelated.

  _source: ## 8 > Tool Distribution (Task tool in allowedTools)_

## q-s08-10 (stretch)

What is the common three-phase pattern for parallelizable work, and where does the latency win come from?

- **A.** Serial decomposition → parallel execution → serial synthesis; the win is largest for I/O-bound subtasks, where elapsed time becomes max(durations) instead of sum(durations) ✅
- **B.** Parallel decomposition → serial execution → parallel synthesis
- **C.** Everything parallel from the first call — planning included
- **D.** Serial throughout, with caching between phases

  - A: Plan once (serial), fan out the independent units (parallel), assemble once (serial). Fetches, searches, and document reads overlap beautifully; CPU/token-bound work gains less. Balance the fan-out — the slowest subtask sets total time.
  - B: Decomposition before execution is inherently first, and synthesis needs all results — the phases can't invert.
  - C: You can't parallelize identifying what the parallel units are.
  - D: Serial throughout is what the pattern exists to beat.

  _source: ## 8 > Parallel Execution (phasing)_

## q-s08-11 (core)

A multi-day research workflow must resume after interruptions. What should be persisted and reloaded?

- **A.** Full transcripts of every agent, replayed on resume
- **B.** Nothing — subagents should re-derive state from scratch
- **C.** A structured manifest — workflow ID, completed steps, per-document status, claim IDs, open gaps — with only relevant state injected into each agent's prompt on resume ✅
- **D.** A screen recording of the prior session

  - A: Replaying every transcript burns tokens on noise and still leaves state implicit.
  - B: Re-deriving repeats all the work the persistence was meant to save.
  - C: Durable state means structured exports. The coordinator loads the manifest and gives each agent only the slice it needs.
  - D: Not machine-usable state.

  _source: ## 8 > State Persistence_

## q-s08-12 (stretch)

A synthesis agent reports two studies as "contradictory" — one says 45% adoption, the other 62%. The studies are three years apart. What was missing from the subagents' outputs?

- **A.** Longer excerpts from each study
- **B.** Higher confidence scores
- **C.** Consistent units
- **D.** Publication/data-collection dates — without temporal provenance, a trend reads as a contradiction; subagents should output claim, source ID, date, methodology, and whether findings are established or contested ✅

  - A: Longer excerpts without dates still collide as contradictions.
  - B: Confidence doesn't resolve the time dimension.
  - C: The units matched; the years didn't.
  - D: Provenance structure exists precisely for this: dated claims let synthesis see 45% → 62% as growth. Undated claims force a false conflict.

  _source: ## 8 > Provenance, Time, and Uncertainty_


# Flashcards

- **Five core agentic patterns — match each to its shape of work.**
  → Prompt chaining: fixed known steps. Routing: distinct input categories. Orchestrator-workers: coordinator delegates subtasks. Dynamic decomposition: each finding changes the plan. Parallel subagents: independent workstreams.

- **When is dynamic decomposition right — and what's its cost?**
  → Investigations where the next move depends on the last finding (debugging, triage). Cost: unpredictability — set explicit termination criteria and step caps.

- **When should a coordinator NOT delegate?**
  → Small work already in its context. Delegation costs a tool call, fresh context, separate invocation, and result passing. Delegate for context-flooding tasks, different prompt/toolsets, or parallelism.

- **Partition-then-parallel: how do you split the work?**
  → Balance partitions by expected effort, not count — elapsed time is max(subagent durations), so the heaviest partition dictates everything. Avoid when units depend on each other or a split would cut a logical unit.

- **What does a freshly spawned subagent know?**
  → Only what the parent passes in the prompt + its own definition. No parent transcript, no prior tool results, no memory of earlier runs. "Resume the previous subagent" doesn't exist by default.

- **What goes in a handoff to a report-writing subagent needing citations?**
  → A structured source index: claims mapped to source IDs, URLs, excerpts, dates, uncertainty notes. Prose summaries destroy the claim→source mapping.

- **Why did the orchestrator never delegate despite defined subagents?**
  → The Task/Agent tool isn't in the parent's allowedTools. Delegation is itself a tool call. The subagent's own allowedTools is configured separately.

- **The serial-parallel-serial pattern?**
  → Serial decomposition (plan the independent units) → parallel execution (each unit concurrent) → serial synthesis. Biggest win on I/O-bound subtasks: max(durations) instead of sum.

- **What must research subagents output so synthesis doesn't misread the evidence?**
  → Claim, source ID + location, publication/collection date, methodology notes, source's uncertainty language, and established/contested status. Missing dates turn trends into false contradictions.

# Review sheet — section 9

## q-s09-01 (core)

A team configures their support agent to "escalate after three failed tool calls." What is wrong with this rule?

- **A.** Three is too few — five is the industry standard
- **B.** Escalation should never be automatic
- **C.** The category and impact of the failure matter more than the count — one uncertain-state write may demand immediate escalation while five transient read timeouts demand none ✅
- **D.** Failed tool calls cannot be counted reliably

  - A: No count is the right count — the dimension itself is wrong.
  - B: Escalation should absolutely be systematic; it just needs the right triggers.
  - C: Escalate on the nature of the situation: user asks for a human, authority is lacking, policy exceptions arise, progress stalls, or tool results show unsafe/uncertain state. A counter is blind to all of that.
  - D: Counting is easy; it just measures the wrong thing.

  _source: ## 9 > Escalation_

## q-s09-02 (core)

What should an escalation handoff to a human agent contain?

- **A.** Structured context: customer ID, issue type, root cause, relevant record IDs, amounts, actions already taken, and a recommended next action ✅
- **B.** The user's first complaint message, verbatim
- **C.** The complete conversation transcript
- **D.** Just the case number — humans prefer to start fresh

  - A: The human should start where the agent stopped, not where the customer started. Structure makes the context actionable in seconds.
  - B: The first complaint omits everything learned since.
  - C: Transcript dumps work only when the receiving system can actually use them — usually they bury the signal.
  - D: Starting fresh forces the customer to repeat everything — the exact failure users hate most.

  _source: ## 9 > Escalation (structured handoff)_

## q-s09-03 (core)

A frustrated user demands a human, but the agent can resolve the issue immediately. What is the right behavior?

- **A.** Transfer immediately — the user's request overrides everything
- **B.** Resolve it silently, then tell them it's fixed
- **C.** Ask a series of intake questions to document frustration before transfer
- **D.** Acknowledge the frustration and offer both: "I can resolve this now, and I can also transfer you if you prefer" — preserving their choice ✅

  - A: Transferring away from an instant fix serves the process, not the person — offer the fix while honoring the preference.
  - B: Silently acting after someone asked for a human overrides their stated choice.
  - C: An intake questionnaire is friction stacked on frustration.
  - D: Acknowledge, then present the immediate resolution alongside the transfer option. The user stays in control either way.

  _source: ## 9 > Frustrated Users_

## q-s09-04 (core)

Which enforcement mechanism is appropriate for "refunds above $500 require manager approval"?

- **A.** A prominent system prompt rule with IMPORTANT markers
- **B.** Tool-level enforcement, middleware, permissions, or hooks — prompt instructions guide behavior but are not tamper-proof ✅
- **C.** Few-shot examples of correctly refusing large refunds
- **D.** Post-hoc anomaly detection on refund logs

  - A: Prompt language biases the agent; adversarial users and injected content can push past it.
  - B: Hard rules — regulated workflows, thresholds, destructive operations — are enforced in code. The prompt can explain the policy; the tool must enforce it.
  - C: Examples improve typical behavior, not worst-case behavior — and policy is about the worst case.
  - D: Detection finds violations after the money moved.

  _source: ## 9 > Compliance and Authorization_

## q-s09-05 (core)

In the threshold-enforcement pattern, where does the refund limit VALUE come from, and what happens when a call exceeds it?

- **A.** From the system prompt; excess calls fail silently
- **B.** From a model-passed parameter; excess calls are logged
- **C.** From a server-controlled source — feature flag, policy service, account record — and excess calls return a structured `requires_approval` result that routes to a manager ✅
- **D.** From the tool description; excess calls throw exceptions

  - A: Prompts state policy; they can't be the source of truth for enforcement values.
  - B: Anything the model passes, the model controls — the threshold must live where the model can't touch it.
  - C: No override parameter exists on the public interface, the limit lives server-side, and over-limit requests become pending approvals rather than silent failures. Every property is load-bearing.
  - D: Descriptions inform selection; they're not configuration. And silent exceptions strand the workflow.

  _source: ## 9 > Compliance (threshold enforcement inside the tool)_

## q-s09-06 (core)

In preview-then-execute for high-impact actions, what makes the one-time token actually safe?

- **A.** It is encrypted with the server's private key
- **B.** It is short-lived and bound to the previewed payload — the model cannot construct one from scratch or reuse one with different parameters, so execution can only follow a real preview the user confirmed ✅
- **C.** It is logged for audit purposes
- **D.** It is generated by the model so the model stays accountable

  - A: The cryptography matters less than the binding: token ↔ exact previewed action.
  - B: The token's constraints ARE the mechanism: no token without a preview, no reuse, no parameter swapping. Execution is structurally downstream of user confirmation.
  - C: Logging observes; it doesn't prevent.
  - D: A model-generated token defeats the entire point — the model could then skip the preview.

  _source: ## 9 > Compliance (preview-then-execute tokens)_

## q-s09-07 (core)

"The model already checked the policy before calling the tool, so the tool skips authorization." What is the correct assessment?

- **A.** Acceptable if the policy check is in the system prompt
- **B.** Acceptable for read-only tools
- **C.** Efficient — double-checking wastes latency
- **D.** Wrong — tools live inside the trust boundary and must re-verify the caller's authority on every invocation; "the model already checked" is not a defense ✅

  - A: Prompt-level checks are advisory; they can't stand in for server-side authorization.
  - B: Even reads can leak data the caller isn't authorized to see.
  - C: An authorization check is microseconds; an unauthorized state change is an incident.
  - D: The model is outside the trust boundary — well-behaved or not. Server-side validation on every state change is non-negotiable.

  _source: ## 9 > Compliance (server-side authorization)_

## q-s09-08 (stretch)

What does defense-in-depth look like for a customer service agent's policy rules?

- **A.** Prompt rules to bias the agent toward policy, tool implementations to enforce it, and audit logs to detect what slipped through — each layer doing the job the others can't ✅
- **B.** Three increasingly strict system prompts checked in sequence
- **C.** One perfectly written enforcement layer, tested exhaustively
- **D.** Human review of every agent action

  - A: Bias, enforce, detect. Prompts make compliance the agent's default; tools make violations impossible; audits catch the unforeseen. Removing any layer leaves a specific gap.
  - B: Three prompts are one layer repeated — injection that beats one beats all three.
  - C: Perfection isn't available; detection exists because enforcement has bugs.
  - D: Reviewing everything doesn't scale and still doesn't prevent — it detects with maximal cost.

  _source: ## 9 > Compliance (defense-in-depth)_

## q-s09-09 (core)

Midway through resolving a shipping claim, the refund tool goes down, though the agent has verified eligibility. What should the agent tell the user?

- **A.** "We hit an error. Please try again later."
- **B.** Nothing yet — wait for the tool to recover
- **C.** "Your refund is being processed" — it will likely succeed on retry
- **D.** What's done, what's pending, and how to finish: eligibility is verified, the refund submission is temporarily unavailable, and here are the options — retry shortly, escalate, or get notified ✅

  - A: A generic error discards the real progress made and tells the user nothing actionable.
  - B: Silence reads as abandonment mid-issue.
  - C: Claiming a side effect that hasn't happened is the cardinal sin — users tolerate visible incompleteness, not discovering a "completed" action silently never ran.
  - D: Partial completion done right: verified facts stated, the gap named honestly, concrete next steps offered.

  _source: ## 9 > Graceful Degradation_

## q-s09-10 (core)

The same tool keeps failing on the same input, attempt after attempt. What should the agent do?

- **A.** Keep retrying — persistence eventually wins
- **B.** Treat repeated same-input failure as a signal to switch strategies: try a different tool, ask a clarifying question, or escalate ✅
- **C.** Report the tool as permanently broken
- **D.** Silently skip that part of the task

  - A: Identical input, identical failure — more attempts buy nothing.
  - B: Repetition is information: this path doesn't work. Strategy changes — different tool, more information from the user, or a human — are what progress looks like now.
  - C: One input failing doesn't condemn the tool for other inputs.
  - D: Silent gaps surface later as broken promises.

  _source: ## 9 > Graceful Degradation (repeated failure)_

## q-s09-11 (warmup)

The notification service hasn't confirmed sending the customer's confirmation email. What may the agent say?

- **A.** Only what is true: the request was submitted but delivery isn't confirmed — never claim a side effect happened when the system hasn't completed it ✅
- **B.** "Your confirmation email has been sent" — it almost certainly will be
- **C.** "Check your inbox in a few minutes"
- **D.** Nothing about the email at all

  - A: Honest uncertainty preserves trust and prevents the user from acting on a false premise.
  - B: "Almost certainly" is exactly the gap where trust dies.
  - C: Implies the send is a done deal — same claim, softer wording.
  - D: Omission leaves the user wondering whether to expect anything; the honest partial answer is better.

  _source: ## 9 > Graceful Degradation (don't claim uncompleted side effects)_


# Flashcards

- **When should a support agent escalate?**
  → User asks for a human (and it can't be resolved without overriding them), authority is lacking, policy exception / regulated approval / high-value transaction, no meaningful progress, or tool results show uncertain/unsafe state. NOT a failure counter.

- **What does a good escalation handoff contain?**
  → Structured context: customer ID, issue type, root cause, relevant record IDs, amounts, actions taken, recommended next action. Not the first complaint; not a transcript dump.

- **Frustrated user demands a human but the fix is instant. Response?**
  → Acknowledge the frustration, then offer both: "I can resolve this now, and I can transfer you if you prefer." Preserve their choice — never silently act after they asked for a person.

- **Where do hard policy rules (refund thresholds, regulated approvals) get enforced?**
  → In code: tool-level enforcement, middleware, permissions, hooks. The threshold value lives server-side (policy service, feature flag) — never in a model-passed parameter. Prompts guide; they don't enforce.

- **What makes preview-then-execute tokens safe?**
  → Short-lived, single-use, and bound to the previewed payload. The model can't construct one or reuse one with different parameters — execution structurally requires a confirmed preview.

- **"The model already checked policy, so the tool can skip authorization." True?**
  → Never. Tools live inside the trust boundary and must re-verify authority on every invocation. Defense-in-depth: prompts bias, tools enforce, audit logs detect.

- **A tool fails mid-workflow. What does graceful degradation sound like?**
  → "Here's what's done, here's what's pending, here's how we finish" — verified facts, the honest gap, concrete next steps. Never claim an incomplete side effect happened.

- **Same tool, same input, failing repeatedly. Next move?**
  → Switch strategies — different tool, clarifying question, or escalation. Repeated identical failure is a signal, not an invitation to retry harder.

