# Review sheet — section 10

## q-s10-01 (warmup)

In Claude Code, you need to find every file that CONTAINS the string `processRefund`. Which tool?

- **A.** Glob — it searches file patterns
- **B.** Grep — it searches file contents; Glob is for finding files by name/path pattern ✅
- **C.** Read — open likely files and scan them
- **D.** Bash with `find`

  - A: Glob matches filenames and paths, not what's inside files.
  - B: Grep for text inside files, Glob for names and paths — using filename search to find code references is the classic mixup.
  - C: Reading files one by one is exploration by brute force.
  - D: `find` locates files by name; it doesn't search contents (that's what Grep wraps).

  _source: ## 10 > Built-in Tool Selection_

## q-s10-02 (core)

Which task calls for plan mode rather than direct execution?

- **A.** Fixing a typo in one README line
- **B.** Renaming a local variable in one function
- **C.** Adding a log statement to debug one code path
- **D.** A migration spanning many files with architectural choices that stakeholders must approve before edits ✅

  - A: Tiny, low-risk, obvious target — plan mode is pure overhead here.
  - B: Same: small, localized, clear target.
  - C: Low-risk and easily reversed.
  - D: Multi-file scope, architecture decisions, approval gates, and read-only exploration first — every plan mode trigger at once. Plan mode gates the transition from thinking to doing.

  _source: ## 10 > Plan Mode vs Direct Execution_

## q-s10-03 (core)

The agent keeps jumping straight to edits without surfacing trade-offs. Separately, its analyses of a gnarly concurrency bug feel shallow. Which mechanism addresses each?

- **A.** Plan mode for the edit-gating problem (workflow control); extended thinking / higher effort for the shallow analysis (reasoning quality) — they solve different problems and can combine ✅
- **B.** Extended thinking for both — more reasoning fixes everything
- **C.** Plan mode for both — planning forces deeper analysis
- **D.** Neither; both require a larger model

  - A: Plan mode gates when actions happen and inserts human review; effort scales how hard the model reasons. One is workflow, one is cognition.
  - B: Thinking harder doesn't add an approval gate before edits.
  - C: Plan mode doesn't deepen reasoning on a hard problem — it sequences the workflow.
  - D: Both problems have dedicated mechanisms on the current model.

  _source: ## 10 > Plan Mode vs Extended Thinking_

## q-s10-04 (core)

You want to evaluate two alternative implementations of a feature, starting from the same session state, without the attempts contaminating each other. What is the right setup?

- **A.** Resume the original session twice in two terminals
- **B.** Copy-paste the context into two fresh sessions
- **C.** `--fork-session` for each approach so transcripts diverge independently, AND separate git worktrees so the file changes don't collide — sessions persist conversation, not filesystem state ✅
- **D.** One session, alternating between the approaches

  - A: Concurrent resumes of one session append to the same history and confuse later resumes.
  - B: Pasting loses tool-call history the fork preserves.
  - C: Fork isolates the conversations; worktrees isolate the files. Forking without file isolation leaves both editing one checkout; file isolation without forking tangles the transcripts.
  - D: Interleaved attempts in one transcript is exactly the contamination to avoid.

  _source: ## 10 > Sessions (fork + worktree)_

## q-s10-05 (core)

You've worked on several unrelated tasks in this directory. You want to return to a specific investigation from last week. Which flag?

- **A.** `--continue` — it resumes your work
- **B.** `--resume` — it lets you pick the specific session; `--continue` blindly grabs the most recent conversation, which may be the wrong one ✅
- **C.** `--session-id` with a new UUID
- **D.** No flag — Claude Code auto-detects the intended session

  - A: `--continue` takes the latest session without prompting — in a multi-task directory, "latest" is often not "the one you meant."
  - B: `--resume` opens a picker (or takes an identifier) for exactly this case: returning to a known, specific session.
  - C: A new UUID creates a fresh session — the opposite of resuming.
  - D: There is no intent detection; you choose.

  _source: ## 10 > Sessions (flags table)_

## q-s10-06 (core)

Why is the session that wrote the code often the wrong place to review it, and what is the alternative?

- **A.** Long sessions run out of tokens for review
- **B.** Reviews require different API permissions
- **C.** The writing session has no access to the diff
- **D.** Its context includes the earlier reasoning, biasing it toward its own choices — use a fresh review context, a dedicated review subagent, CI review, or a separate session given the diff and criteria ✅

  - A: Token budget isn't the mechanism — bias is.
  - B: No permission difference exists.
  - C: It has full access — that's part of the problem.
  - D: Context isolation is the point: a reviewer that didn't watch the code being justified judges it on its merits.

  _source: ## 10 > Context Isolation and Self-Review_

## q-s10-07 (core)

A team writes "NEVER run destructive Bash commands without approval" in CLAUDE.md and considers the risk handled. What is the correct assessment?

- **A.** CLAUDE.md is context, not enforcement — the model tries to follow it with no compliance guarantee; a `PreToolUse` hook or `permissions.deny` is the mechanism for must-always-hold rules ✅
- **B.** Handled — CLAUDE.md instructions are binding configuration
- **C.** Handled if the same rule also appears in auto memory
- **D.** Handled if the rule is written in all caps

  - A: Memory shapes behavior; hooks enforce it. Hooks run as code in your environment and cannot be talked around — which is exactly why hard rules belong there.
  - B: Nothing in CLAUDE.md is enforced; it's soft guidance the model reads.
  - C: Auto memory is also context — duplicating guidance doesn't create enforcement.
  - D: Capitalization aids salience, not compliance.

  _source: ## 10 > CLAUDE.md and Memory (memory vs hooks)_

## q-s10-08 (stretch)

Which statement about CLAUDE.md loading is TRUE?

- **A.** All CLAUDE.md files in the entire repository load at launch
- **B.** Only the single closest CLAUDE.md loads
- **C.** Working-directory and ancestor CLAUDE.md files load fully at launch; subdirectory ones load on demand when files in those subtrees are read; `@imports` expand at launch, so they organize content but don't save tokens ✅
- **D.** Imports load lazily, so splitting CLAUDE.md via @imports reduces context cost

  - A: Subtree files below the working directory wait until relevant files are read.
  - B: The whole ancestor chain loads, broader scopes first.
  - C: Three loading behaviors, one system: eager ancestors, lazy subdirectories, eagerly-expanded imports. The token-saving mechanism is path-scoped rules, not imports.
  - D: That's the trap — imports expand into context at launch.

  _source: ## 10 > CLAUDE.md hierarchy_

## q-s10-09 (core)

In `.claude/rules/`, what is the difference between a rule file WITH `paths:` frontmatter and one without?

- **A.** Without paths the rule is disabled
- **B.** Without `paths:` the rule loads unconditionally every session (like `.claude/CLAUDE.md`); with `paths:` it enters context only when Claude reads files matching the globs ✅
- **C.** `paths:` controls which users receive the rule
- **D.** `paths:` rules override CLAUDE.md; unscoped rules don't

  - A: No-paths rules are fully active — just always-on.
  - B: That's the scoping mechanism: area-specific conventions cost zero context until the area is actually touched.
  - C: Paths scope by file location, not by person.
  - D: Priority isn't the axis; loading condition is.

  _source: ## 10 > Claude rules for scoped instructions_

## q-s10-10 (core)

Which statement about Claude Code's auto memory is TRUE?

- **A.** It syncs across all your machines via your account
- **B.** The entire memory directory loads at every session start
- **C.** It is enforced configuration, unlike CLAUDE.md
- **D.** The first 200 lines or 25KB of MEMORY.md load at session start; topic files load on demand; it is machine-local and shared across worktrees of the same repo ✅

  - A: Auto memory does not sync across machines or cloud environments.
  - B: Only the MEMORY.md head loads eagerly — topic files wait until read.
  - C: It's context Claude maintains for itself — soft guidance like all memory.
  - D: Those are the operative limits and behaviors — including that all worktrees of one repository share a single memory directory.

  _source: ## 10 > Auto memory_

## q-s10-11 (core)

When is a SKILL the right mechanism instead of a slash command?

- **A.** When the workflow should trigger from the nature of the task — Claude recognizes from the description that it applies (e.g., "this is a database migration") — while slash commands stay deliberate human acts ✅
- **B.** When the workflow needs more than ten steps
- **C.** When the workflow must be enforced deterministically
- **D.** Never — skills are deprecated in favor of slash commands

  - A: The dividing line is who initiates: skills can self-trigger from task recognition (and load their full body on demand — a 400-line checklist costs one description line until needed); slash commands run only when a human types them.
  - B: Length doesn't choose the mechanism.
  - C: Neither skills nor commands enforce — that's hooks.
  - D: Both are current, complementary mechanisms.

  _source: ## 10 > Skills / Slash Commands_

## q-s10-12 (core)

Claude keeps ignoring a project convention you're sure you wrote down. What is the FIRST diagnostic step?

- **A.** Rewrite the rule more forcefully with IMPORTANT markers
- **B.** Duplicate the rule into every CLAUDE.md scope
- **C.** Run `/memory` to confirm the file containing the rule is actually loaded for this working directory — if it isn't loading, no wording change will help; for lazy-loading rules, the `InstructionsLoaded` hook shows exactly what loaded and why ✅
- **D.** Disable auto memory in case it conflicts

  - A: Rewording a rule that never loads accomplishes nothing.
  - B: Duplication bloats every session and still doesn't diagnose the actual failure.
  - C: Check loading before wording: `/memory` lists every loaded CLAUDE.md, local file, and rule. Most "Claude ignores my rules" cases are loading-scope problems.
  - D: Auto memory rarely conflicts, and disabling it is a shot in the dark.

  _source: ## 10 > Inspecting and debugging memory_

## q-s10-13 (warmup)

Before enabling a hook configuration from a third-party source, what should you do?

- **A.** Nothing — hooks run in a sandbox
- **B.** Review it like any code with security implications — hooks execute in your environment and a malicious or buggy hook can damage your system or exfiltrate data ✅
- **C.** Test it with a read-only API key first
- **D.** Enable it only for PostToolUse events, which are safe

  - A: Hooks are NOT sandboxed — they run as shell commands (or SDK callbacks) in your environment.
  - B: The power that makes hooks the right enforcement layer also makes them a supply-chain risk. Review before enabling; keep secrets out of arguments hooks might log.
  - C: API keys don't limit what a shell command can do to your filesystem.
  - D: PostToolUse hooks are just as much arbitrary code as any other.

  _source: ## 10 > Hooks and Permissions (hook security)_


# Flashcards

- **Grep vs Glob — which finds what?**
  → Grep searches file CONTENTS; Glob finds files by NAME/PATH pattern. Never use filename search to find code references inside files.

- **When does plan mode earn its overhead?**
  → Multi-file changes, architectural choices, migrations/breaking changes, stakeholder approval needed, or read-only exploration first. Tiny clear edits → direct execution.

- **Plan mode vs extended thinking — what problem does each solve?**
  → Plan mode = workflow control (gate thinking→doing behind human review). Extended thinking/effort = reasoning quality on hard problems. Different mechanisms; combinable.

- **Session flags: --continue vs --resume vs --session-id vs --fork-session?**
  → --continue: latest conversation here, no prompt. --resume: pick a specific session. --session-id: stable UUID for programmatic use. --fork-session: branch a new transcript from an existing one.

- **Comparing two implementation approaches from the same starting state — what's the full setup?**
  → Fork the session (transcripts diverge independently) AND use separate git worktrees (file changes don't collide). Sessions persist conversation, not filesystem state.

- **Is CLAUDE.md enforced?**
  → No — CLAUDE.md, rules, and auto memory are context (soft guidance). Behavior that must always hold — blocked paths, destructive-command approval, formatters — needs PreToolUse hooks or permissions.deny.

- **How do CLAUDE.md files load across the directory tree?**
  → Working dir + ancestors: fully at launch (broader scopes first). Subdirectories: on demand when files there are read. @imports: expanded at launch — they organize, they don't save tokens.

- **CLAUDE.md vs .claude/rules/ vs skills vs hooks — the rule of thumb?**
  → Every-session fact → CLAUDE.md. Area-specific → rules with paths: globs. Deliberate multi-step procedure → skill (or slash command if human-invoked only). Must-run-deterministically → hook.

- **Auto memory: what loads at session start, and where does it live?**
  → First 200 lines or 25KB of MEMORY.md; topic files load on demand. Stored per project at ~/.claude/projects/<project>/memory/ — machine-local, shared across the repo's worktrees, never synced.

- **Claude ignores a rule you wrote. First diagnostic?**
  → /memory — confirm the file is actually loaded for this working directory. If it isn't loading, wording changes can't help. Deeper: the InstructionsLoaded hook logs what loaded, when, why.

- **Task-scoped vs path-scoped instructions — why aren't they interchangeable?**
  → Task-scoped (reviews, releases) → slash command/skill/subagent, invoked deliberately. Path-scoped (API dir, tests) → rules with paths:, triggered by file reads. A review checklist in paths-rules fires on every touch of those files, review or not.

# Review sheet — section 11

## q-s11-01 (core)

Which feedback actually helps Claude fix an extraction defect?

- **A.** "It's not handling edge cases well — be more careful"
- **B.** "The output quality has been declining lately"
- **C.** "For input X, the expected key `service_visits` is missing because the source says 'maintenance entries' instead — here's the excerpt and the rule violated" ✅
- **D.** "Try again, but better"

  - A: Nothing to locate, nothing to act on.
  - B: A trend report without a single failing example.
  - C: Concrete and executable: specific input, expected vs actual, the trigger, the rule. The model can fix exactly that — and the fix generalizes to the pattern.
  - D: A retry request, not feedback.

  _source: ## 11 > Effective Iteration_

## q-s11-02 (core)

Requirements for a caching layer are genuinely uncertain — consistency needs, invalidation, TTLs are all fuzzy. What should Claude do before implementing?

- **A.** Interview the user — surface the decisions and trade-offs that must be resolved before code is written ✅
- **B.** Implement the most common caching pattern and iterate
- **C.** Implement all plausible variants behind feature flags
- **D.** Wait for a complete written specification

  - A: For caching, real-time architecture, auth, and data consistency, wrong assumptions are expensive to unwind. Asking Claude to surface decisions first turns hidden assumptions into explicit choices.
  - B: Common patterns encode assumptions the user hasn't agreed to — precisely the risk.
  - C: Speculative variants multiply cost and complexity before understanding exists.
  - D: Passive waiting wastes the model's ability to elicit the requirements.

  _source: ## 11 > Effective Iteration (interview for uncertain requirements)_

## q-s11-03 (core)

The same defect keeps recurring across many runs of the same prompt. What does this signal?

- **A.** The model needs more retries with slight temperature variation
- **B.** The task exceeds the model's capability
- **C.** Random noise — occasional defects are expected
- **D.** The prompt or schema needs a structural change — a few-shot example, a split tool, a new field. Prompt-level fixes generalize; per-instance retries do not ✅

  - A: Retries re-sample the same flawed setup.
  - B: Recurrence under one prompt indicts the prompt before the model.
  - C: Recurring is the opposite of random — a stable pattern is a signal.
  - D: Repetition means the failure is structural. Change the structure once and every future run benefits.

  _source: ## 11 > Effective Iteration (recurring defects)_

## q-s11-04 (core)

Generated tests keep asserting only that functions don't throw, duplicating coverage, and ignoring project fixtures. What is the fix?

- **A.** Generate more tests so the good ones outnumber the bad
- **B.** Document test standards in project memory or a testing guide — examples of valuable behavioral tests vs trivial ones, fixture names and intended use ✅
- **C.** Have a second model filter the weak tests
- **D.** Stop generating tests; write them manually

  - A: Volume multiplies the pattern, not the quality.
  - B: The model produces low-value tests because it doesn't know what this project values. Standards with contrasting examples and fixture documentation teach it — durably, for every future session.
  - C: A filter model needs the same standards defined anyway; define them once where generation can use them.
  - D: Abandoning generation forfeits the value that better guidance would recover.

  _source: ## 11 > Test Generation Quality_

## q-s11-05 (core)

A code review agent is noisy and inconsistent. What does it need most?

- **A.** A larger model tier
- **B.** Permission to auto-fix what it finds
- **C.** Longer context so it can read the whole codebase
- **D.** Explicit report criteria: which findings matter (bugs, security, data loss, missing tests, breaking API changes) and what to skip (style nits, accepted conventions, speculative performance advice) ✅

  - A: Capability without criteria produces confident noise.
  - B: Auto-fixing amplifies the noise problem into a change-control problem.
  - C: More visibility without a definition of "reportable" means more findings, not better ones.
  - D: A review agent is only as good as its definition of signal. Explicit include/skip criteria is the foundation everything else builds on.

  _source: ## 11 > Code Review Agents_

## q-s11-06 (core)

To reduce a review agent's false positives, which intervention works best?

- **A.** Few-shot examples showing acceptable code patterns side-by-side with genuinely problematic ones ✅
- **B.** Adding "be conservative and only report real issues" to the prompt
- **C.** Lowering the maximum findings count per review
- **D.** Running the review twice and reporting only overlapping findings

  - A: The agent's problem is a fuzzy boundary between acceptable and problematic. Contrasting examples draw the line concretely — the reliably effective fix.
  - B: "Be conservative" is vague instruction against a boundary problem; the model doesn't know where your line is.
  - C: A cap truncates output without improving judgment — real issues may be what gets cut.
  - D: Consensus filters random noise, not systematic misjudgment — both runs share the same fuzzy boundary.

  _source: ## 11 > Code Review Agents (false positive reduction)_

## q-s11-07 (core)

Developers dismiss 35% of a review agent's findings, but the team can't tell what to fix. What fields make the dismissals actionable?

- **A.** Reviewer name and timestamp
- **B.** The full diff for each dismissed finding
- **C.** `detected_pattern`, `rule_id`, and `evidence` — so dismiss rates can be aggregated by pattern and the over-reporting patterns can be suppressed in the prompt criteria ✅
- **D.** A severity score from 1 to 10

  - A: Who dismissed when doesn't reveal what construct triggered the noise.
  - B: Raw diffs require manual re-analysis of every dismissal.
  - C: Without pattern-level fields you can only see "35% dismissed," not which kinds of findings to suppress. With them, dismissals become a targeted improvement loop.
  - D: Severity doesn't explain why findings were judged wrong.

  _source: ## 11 > Code Review Agents (dismissed findings)_

## q-s11-08 (core)

Along which dimensions should an extraction pipeline's evaluation results be segmented?

- **A.** By model version only — everything else is noise
- **B.** Document type, field, prompt version, model, source quality, confidence band, and reviewer correction category ✅
- **C.** By calendar week
- **D.** By reviewer, to identify strict graders

  - A: Model version is one axis of many — failures cluster along the others too.
  - B: Aggregate accuracy misleads; segmentation reveals that "97% overall" hides a failing field or document type. These axes localize where quality actually breaks.
  - C: Time matters only when something changed — the listed dimensions explain why.
  - D: Reviewer variance is worth knowing but doesn't localize pipeline failures.

  _source: ## 11 > Evaluation Loops_

## q-s11-09 (warmup)

One test fails after a change. What should you ask Claude for?

- **A.** A targeted fix, providing the failing test name and its assertion message ✅
- **B.** A full rewrite of the module — a clean slate avoids compounding errors
- **C.** An explanation of the module's design first
- **D.** Deletion of the failing test if the code looks right

  - A: Narrow failure, narrow fix. The exact failing test with its assertion is executable feedback pointing at the defect.
  - B: Rewrites after narrow failures introduce new regressions across everything that worked.
  - C: Sometimes useful context — but the direct path is the failing test.
  - D: Deleting the signal because the code "looks right" is how bugs ship.

  _source: ## 11 > Common Pitfalls (full rewrite after narrow failure)_

## q-s11-10 (stretch)

A team sees repeated extraction failures and immediately starts building a custom validation microservice with a human-review dashboard. What pitfall is this?

- **A.** Under-investing — they should also build a retraining pipeline
- **B.** Choosing the wrong cloud provider for the dashboard
- **C.** Nothing — infrastructure is always the right response to quality issues
- **D.** Adding infrastructure before improving examples and criteria — repeated failure patterns are usually solved by prompt/schema changes (few-shot examples, better absence semantics), which are cheaper and generalize ✅

  - A: More infrastructure on top of unexamined failure patterns compounds the mistake.
  - B: The provider isn't the problem; the sequencing is.
  - C: Infrastructure has its place — after the cheap, high-leverage fixes are exhausted.
  - D: The guide's ordering: prompt and schema improvements first; heavier interventions only if the metric doesn't move. Most recurring patterns die at step one.

  _source: ## 11 > Common Pitfalls (infrastructure before examples)_


# Flashcards

- **What makes feedback to Claude actually effective?**
  → Concrete and executable: the failing input, expected vs actual output, the validation error or failing test + assertion, and the source excerpt that triggered it. "Handle edge cases better" gives nothing to act on.

- **The effective coding iteration loop?**
  → Define behavior with tests/examples → ask for the smallest useful implementation → run tests → feed back exact failures → iterate one failure class at a time.

- **Same defect recurs across runs of the same prompt. What does it mean?**
  → The prompt or schema needs a structural change (few-shot example, split tool, new field) — not another retry. Prompt-level fixes generalize; retries don't.

- **Five signs of low-value generated tests?**
  → Only assert no-throw; duplicate existing coverage; ignore project fixtures; test implementation details over behavior; miss important branches and error paths. Fix: documented test standards with contrasting examples.

- **What does a code review agent need to be useful?**
  → Explicit criteria: report bugs, security, correctness, data loss, missing tests, breaking API changes; skip style nits, accepted conventions, speculative perf advice.

- **Best way to cut a review agent's false positives?**
  → Few-shot examples showing acceptable patterns NEXT TO genuinely problematic ones. Beats "be conservative" — the model needs to see where your line is.

- **Why record detected_pattern / rule_id / evidence on review findings?**
  → So dismissals become analyzable: aggregate dismiss rates by pattern, then suppress the over-reporting patterns in the prompt. Without it you know "35% dismissed" but not what to fix.

- **Why segment evaluation results instead of tracking one accuracy number?**
  → Aggregates hide localized failure — 97% overall can mask a critical field at 80%. Segment by document type, field, prompt version, model, source quality, confidence band, correction category.

# Review sheet — section 12

## q-s12-01 (warmup)

Match the model tiers to their typical architecture roles.

- **A.** Haiku: classification, routing, high-volume simple steps · Sonnet: default production workhorse · Opus: complex agentic work and hard analysis ✅
- **B.** Haiku: hard analysis · Sonnet: routing · Opus: classification
- **C.** All tiers are interchangeable; pick by price alone
- **D.** Haiku: development · Sonnet: staging · Opus: production

  - A: The capability/cost/latency spectrum maps to workload steps: cheap-fast for mechanical volume, balanced for most pipelines, top tier for the genuinely hard parts.
  - B: Inverted — the smallest tier doesn't lead on hard analysis.
  - C: Price tracks capability; treating tiers as interchangeable ignores the spectrum's purpose.
  - D: Tiers map to task difficulty, not deployment environments.

  _source: ## 12 > What to Know (tier table)_

## q-s12-02 (core)

"We default everything to the largest model to be safe." What is the correct assessment of this policy?

- **A.** Sound — quality risk always outweighs cost
- **B.** Sound for customer-facing workloads, wasteful otherwise
- **C.** It's a budget decision dressed up as a safety decision — try the cheaper model and escalate on measurable signals: low calibrated confidence, failed validation, an explicit needs-deeper-analysis classification ✅
- **D.** Sound as long as prompt caching is enabled

  - A: "Always" is doing unexamined work in that sentence — most steps show no quality gain from the top tier.
  - B: Customer-facing intent classification is still classification; the audience doesn't change the task's difficulty.
  - C: Escalate on signal, not by default. Defined triggers give you top-tier quality where it matters at a fraction of blanket cost.
  - D: Caching discounts repeated prefixes; it doesn't fix a 9× tier mismatch.

  _source: ## 12 > What to Know (escalate on signal)_

## q-s12-03 (core)

Why can a coordinator on a capable model safely delegate subtasks to cheaper-model subagents?

- **A.** Subagents automatically inherit the coordinator's capability
- **B.** Because the subtask prompts are focused — exploring files, summarizing one document, checking one repo — the capability gap matters less than it would on the open-ended task ✅
- **C.** It can't — mixed tiers produce inconsistent outputs
- **D.** Cheaper models are faster, which compensates for lower quality

  - A: No capability transfers — each agent runs its own model.
  - B: Task scoping is the trick: a narrow, well-specified job needs less general capability. The expensive model does the open-ended orchestration; the cheap ones do the bounded legwork.
  - C: Mixing tiers across agents is a recommended cost pattern, validated with evals.
  - D: Speed doesn't offset capability — scope does.

  _source: ## 12 > What to Know (mix tiers across agents)_

## q-s12-04 (core)

How does reasoning ('thinking') work on current Claude models?

- **A.** You set a fixed thinking-token budget per request
- **B.** Thinking is always on at maximum depth
- **C.** Thinking must be re-enabled every turn
- **D.** Adaptively — the model decides when and how much to think, scaled by a request-level effort setting; the old manually-configured thinking budget is deprecated as a legacy control ✅

  - A: Fixed budgets are the legacy mechanism, replaced by adaptive thinking.
  - B: Depth scales with the task and the effort setting — that's the point of 'adaptive.'
  - C: No per-turn re-enabling exists.
  - D: Effort is a graded, per-request dial over reasoning, tool use, and output — another allocation lever beside tier, caching, and batching.

  _source: ## 12 > Thinking and Effort_

## q-s12-05 (core)

Which task genuinely benefits from higher reasoning effort?

- **A.** Classifying support tickets as billing / technical / other
- **B.** Planning a database migration with ambiguous requirements to reconcile and indirect evidence to debug from ✅
- **C.** Extracting invoice numbers from a standard template
- **D.** Converting dates to ISO format

  - A: Mechanical classification — buy accuracy with schemas and few-shot examples, not reasoning tokens.
  - B: Reasoning-shaped work: multi-step planning, ambiguity reconciliation, inference from indirect evidence. This is where deeper thinking converts into better answers.
  - C: Template extraction is pattern application, not reasoning.
  - D: Deterministic transformation — no reasoning to deepen.

  _source: ## 12 > Thinking and Effort (where to spend reasoning)_

## q-s12-06 (core)

When is streaming the right choice — and when is it pointless?

- **A.** Right when a human is watching (time-to-first-token dominates perceived latency) or outputs are long (blocking requests risk timeouts); pointless when nothing consumes partial output, like batch jobs and short machine-to-machine calls ✅
- **B.** Always right — streaming improves response quality
- **C.** Right only for code generation
- **D.** Pointless always — it costs extra tokens

  - A: Streaming changes delivery, not quality or cost. Its value is perceived speed for humans and connection survival for long outputs — absent a consumer of partial output, it buys nothing.
  - B: Quality is unchanged; only delivery timing differs.
  - C: Content type is irrelevant; consumption pattern decides.
  - D: It costs nothing extra — and for long outputs it's practically required.

  _source: ## 12 > Streaming_

## q-s12-07 (core)

Two responses come back incomplete: one with `stop_reason: max_tokens`, one with `model_context_window_exceeded`. What's the difference?

- **A.** They're synonyms for the same limit
- **B.** The first is a model defect; the second is an API bug
- **C.** Both are fixed by retrying with backoff
- **D.** `max_tokens` means the OUTPUT hit the cap you set — raise it, stream, or split; `model_context_window_exceeded` means the INPUT no longer fits the window — compact, trim, or summarize; retrying unchanged cannot succeed. Log which occurred or you'll fix the wrong limit ✅

  - A: Different limits: your output budget vs the model's input window.
  - B: Neither is a defect — both are limits with defined remedies.
  - C: Retry helps neither: same request, same overflow.
  - D: The two look identical from the outside (incomplete work), which is exactly why production code must branch on the stop reason.

  _source: ## 12 > Stop Reasons_

## q-s12-08 (core)

A response returns `stop_reason: pause_turn`. What does production code do?

- **A.** Treat it as an error and alert on-call
- **B.** Restart the conversation from the beginning
- **C.** Re-send the conversation as-is — a long-running server-side operation paused the turn and it will resume ✅
- **D.** Switch to a larger model

  - A: Not an error — a defined pause in a long-running operation.
  - B: Restarting discards the paused work.
  - C: The handling is deliberately boring: send the conversation back unchanged and the turn resumes.
  - D: Model size is unrelated to a paused server-side operation.

  _source: ## 12 > Stop Reasons (pause_turn)_

## q-s12-09 (core)

A response ends with `stop_reason: refusal`. What is the correct handling?

- **A.** Surface it to the user or route to review — do NOT blind-retry the same prompt ✅
- **B.** Retry immediately; refusals are stochastic
- **C.** Retry with higher temperature
- **D.** Downgrade to a smaller model, which refuses less

  - A: A safety-based decline won't flip on resubmission of the identical request; handle it as a workflow branch, not a transient fault.
  - B: Blind-retrying refusals wastes spend and can look like circumvention attempts.
  - C: Temperature doesn't change safety assessments.
  - D: Tier-shopping for compliance is not a handling strategy.

  _source: ## 12 > Stop Reasons (refusal)_

## q-s12-10 (core)

Your service gets occasional 429s at traffic spikes. What is the right handling stack?

- **A.** Catch 429s and immediately resend until they pass
- **B.** Honor `retry-after`, use exponential backoff with jitter, smooth bursts client-side — and remember the official SDKs already retry rate limits and transient server errors automatically ✅
- **C.** Treat 429s like 400s: fix the request
- **D.** Open a support ticket per occurrence

  - A: Tight-loop resending amplifies the very burst being throttled.
  - B: The layered answer: respect the server's signal, back off with jitter, shape traffic — and don't hand-roll retry loops the SDK already provides.
  - C: 400s are malformed requests; 429s are capacity timing. Different families, different fixes.
  - D: Occasional spike throttling is normal operation, not an incident.

  _source: ## 12 > API-Level Errors and Rate Limits_

## q-s12-11 (stretch)

A document pipeline hits sustained token-per-minute throttling while its request count stays modest. What is the correct interpretation and response?

- **A.** The SDK's retry logic is broken — replace it
- **B.** The API is misconfigured — request counts were fine
- **C.** Sustained 429s are a capacity-planning signal, not an error-handling bug: rate limits are per model and measured in tokens as well as requests, so spread load, move deferrable volume to the Batch API, request higher limits, or split across models with separate pools ✅
- **D.** Shorten prompts until the throttling stops

  - A: Retries are working — they're retrying into an exhausted budget.
  - B: Token-heavy workloads legitimately hit token-per-minute limits with low request counts; nothing is misconfigured.
  - C: When throttling is sustained, the fix is architectural: reshape when, where, and through which pools the volume flows.
  - D: Trimming helps marginally but doesn't address a structurally over-budget workload.

  _source: ## 12 > API-Level Errors (sustained 429s)_

## q-s12-12 (warmup)

How should you get exact input token counts for budgeting a long-document workload?

- **A.** Estimate at 4 characters per token
- **B.** Use a popular third-party tokenizer library
- **C.** Submit the request and read the usage from the error
- **D.** The API's token-counting endpoint — model-specific, exact, and free; third-party tokenizers are calibrated to other vocabularies and miscount, especially on code and non-English text ✅

  - A: Heuristics drift badly on code, JSON, and non-English content — exactly the long-document cases that matter.
  - B: Other providers' tokenizers count other providers' tokens.
  - C: Paying for a failed request to learn its size is the expensive version of a free endpoint.
  - D: Count first, then chunk, batch, and budget with real numbers.

  _source: ## 12 > Token Counting_


# Flashcards

- **The three model tiers and their architecture roles?**
  → Haiku: fastest/cheapest — classification, routing, high-volume simple steps. Sonnet: balanced — the default production workhorse. Opus: most capable — complex agentic work, hard analysis. Match tier to STEP, not product.

- **When should the expensive model be used?**
  → On measurable signal: low calibrated confidence, failed validation, explicit needs-deeper-analysis classification. "Everything on the largest model to be safe" is a budget decision dressed as a safety decision.

- **How does thinking work on current models?**
  → Adaptive — the model decides when and how much to reason, scaled by a request-level effort setting. Fixed thinking-token budgets are legacy/deprecated. Effort is a per-request dial.

- **Which tasks benefit from higher reasoning effort?**
  → Reasoning-shaped ones: migration planning, ambiguous requirements, debugging from indirect evidence. Mechanical extraction/classification rarely benefits — use schemas and few-shot examples there.

- **When to stream — and when not?**
  → Stream when a human is watching (TTFT = perceived speed) or outputs are long (timeout risk). Skip for batch jobs and machine-to-machine calls. Streaming changes delivery, not quality or cost.

- **max_tokens vs model_context_window_exceeded?**
  → max_tokens: OUTPUT hit your cap → raise it, stream, or split. context_window_exceeded: INPUT doesn't fit → compact, trim, summarize. Both look like truncation; log which one occurred.

- **Correct handling for pause_turn and refusal stop reasons?**
  → pause_turn: re-send the conversation as-is; a long-running server-side operation resumes. refusal: surface to the user or route to review — never blind-retry the identical prompt.

- **429 vs 500/529 vs 400 — handling?**
  → 429: honor retry-after, backoff + jitter (SDKs retry automatically). 500/529: transient, retry with backoff. 400: malformed — fix the request; retry can't succeed.

- **What do sustained 429s actually signal?**
  → A capacity-planning problem, not an error-handling bug: spread load, move deferrable volume to the Batch API, request higher limits, or split across models with separate pools. Limits are per model, in requests AND tokens/min.

- **How do you count tokens before submitting a big workload?**
  → The API's token-counting endpoint — exact, model-specific, free. Never third-party tokenizers built for other providers; they miscount, especially code and non-English text.

