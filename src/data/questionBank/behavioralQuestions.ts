import { QuestionItem } from '../../types';

export const BEHAVIORAL_QUESTIONS: QuestionItem[] = [
  {
    id: 'beh-1',
    slug: 'technical-disagreement-star-method',
    title: 'Navigating Technical Disagreements: Architecture Consensus & Disagree and Commit',
    questionText: 'Describe a situation where you had a strong technical disagreement with a team member or senior engineer regarding an architectural or technical choice. How did you handle it, what was your approach, and what was the outcome?',
    category: 'Behavioral & Leadership',
    categoryId: 'behavioral',
    topicId: 'technical-challenges',
    subtopicId: 'conflict-resolution',
    difficulty: 'Medium',
    questionType: 'Behavioral',
    roleTarget: 'Senior Software Engineer',
    roleIds: ['senior-software-eng', 'technical-lead', 'software-architect', 'software-engineer'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Structure behavioral answers using the STAR method (Situation, Task, Action, Result) focusing on objective data, prototypes, and respectful alignment.',
    shortAnswer: 'Effective technical disagreement resolution removes ego and grounds discussions in objective data, customer impact, and rapid prototyping. Using the STAR framework: 1) **Situation**: Clearly define the competing technical proposals (e.g., GraphQL vs REST, or SQL vs NoSQL) and the core project deadline/constraints; 2) **Task**: Frame the objective as finding the best architectural fit for the business, not "winning" an argument; 3) **Action**: Propose an empirical spike or benchmark with agreed-upon evaluation criteria (latency, developer ergonomics, operational complexity). Seek input from neutral domain experts and document trade-offs in an Architecture Decision Record (ADR); 4) **Result**: Reach consensus based on evidence, or embrace "Disagree and Commit" with full velocity, post-evaluating the choice after launch.',
    detailedAnswer: '1. **The STAR Framework Applied to Tech Disagreements**:\n   - **Situation**: "On our payments re-architecture, a principal engineer advocated for migrating from Postgres to Cassandra for high write throughput, while I believed optimized Postgres partitioning and read replicas satisfied our 5-year growth projections with far lower operational risk."\n   - **Task**: "As tech lead, I needed to ensure we met our 10,000 writes/sec target while avoiding introducing an unmanaged distributed database that our small SRE team had no operational experience running."\n   - **Action**:\n     - Organized a structured discussion with 3 explicit constraints: throughput, operational burden, and query flexibility.\n     - Built a 3-day load test benchmark (k6) comparing partitioned Postgres on AWS Aurora vs Cassandra.\n     - Discovered Aurora handled 14,000 writes/sec at P99 latency of 18ms without requiring Cassandra tombstone tuning or secondary index workarounds.\n     - Authored an Architecture Decision Record (ADR-042) detailing the benchmark results, cost projections, and operational trade-offs.\n   - **Result**:\n     - The team unanimously agreed to proceed with Aurora Postgres.\n     - Shipped the project 3 weeks ahead of schedule with zero production outages.\n     - Established a company-wide template for ADR benchmarks.',
    codeExample: {
      language: 'markdown',
      code: `### Example STAR Answer Outline:
* **Situation**: Migrating core authentication service from legacy session cookies to JWT vs Redis session tokens. Senior peer preferred stateless JWTs; I was concerned about token revocation during account compromise.
* **Task**: Determine a secure authentication architecture that supported instantaneous session invalidation without overloading our caching cluster.
* **Action**:
  1. Invited peer to a 30-minute design whiteboard session to map out edge cases (e.g., user changes password or revokes compromised device).
  2. Proposed a hybrid solution: short-lived 10-minute access JWTs paired with an in-memory Redis token revocation denylist checked only on sensitive actions.
  3. Created an Architecture Decision Record (ADR) documenting both viewpoints and the compromise.
* **Result**: Implemented the hybrid architecture. Later that quarter, a credential stuffing incident was contained within 60 seconds by triggering token revocation without dropping valid user sessions.`,
      exampleInput: "Interviewer asks: 'Tell me about a time you had a technical conflict with a colleague.'",
      exampleOutput: "Clear, structured 3-minute response demonstrating empathy, empirical benchmarking, ADR documentation, and business-focused compromise."
    },
    commonMistakes: [
      'Framing the colleague as foolish or stubborn and oneself as the lone savior of the project.',
      'Failing to mention specific technical trade-offs or tangible data that drove the final decision.',
      'Omitting the Result or neglecting to reflect on what was learned from the other person’s perspective.'
    ],
    realWorldUseCases: [
      'Evaluating whether to adopt a new JavaScript framework or stay with the existing battle-tested stack.',
      'Choosing between microservices and a modular monolith during early-stage product evolution.'
    ],
    tradeOffs: [
      'Prolonging debates can cause analysis paralysis; setting a strict timebox (e.g. 3-day spike) is essential before leadership decides.'
    ],
    followUpQuestions: [
      'What would you have done if the team chose the alternative architecture despite your benchmark objections?',
      'How do you foster a team culture where junior engineers feel safe to challenge senior architectural choices?'
    ],
    relatedQuestionIds: ['beh-2', 'sd-1', 'be-1'],
    relatedTopicIds: ['technical-challenges', 'leadership-ownership', 'architecture-decisions'],
    prerequisiteTopicIds: ['communication-clarity', 'star-method'],
    nextTopicIds: ['engineering-management', 'adr-documentation'],
    tags: ['Behavioral', 'STAR Method', 'Conflict Resolution', 'Leadership', 'Architecture'],
    keywords: ['behavioral', 'conflict', 'star method', 'disagreement', 'architecture', 'leadership', 'consensus']
  },
  {
    id: 'beh-2',
    slug: 'production-outage-post-mortem-blameless',
    title: 'Managing High-Severity Production Incidents & Leading Blameless Post-Mortems',
    questionText: 'Tell me about a time you caused or responded to a major production outage or critical bug. How did you triage the incident, communicate with stakeholders, and prevent recurrence?',
    category: 'Behavioral & Leadership',
    categoryId: 'behavioral',
    topicId: 'technical-challenges',
    subtopicId: 'incident-response',
    difficulty: 'Medium',
    questionType: 'Behavioral',
    roleTarget: 'Senior Software Engineer',
    roleIds: ['senior-software-eng', 'site-reliability-eng', 'devops-eng', 'backend-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Demonstrate incident command under pressure, customer empathy, root cause analysis (5 Whys), and blameless post-mortem culture.',
    shortAnswer: 'Handling a production outage tests emotional composure, systematic troubleshooting, and transparent communication. Using STAR: 1) **Situation**: Describe a high-severity (Sev-1) incident affecting active users; 2) **Task**: Establish incident command: stabilize the system immediately (mitigate first, root-cause second); 3) **Action**: Roll back the suspect deployment or flip the kill-switch feature flag. Establish a dedicated war room, provide status updates every 15 minutes to customer success and leadership, and isolate telemetry logs; 4) **Result**: Restore service within SLA, conduct a blameless post-mortem using the "5 Whys" methodology, and implement preventative guardrails (automated Canary rollbacks, integration tests, or database connection pool limits) so the identical failure mode is structurally impossible in the future.',
    detailedAnswer: '1. **The Four Phases of Incident Response**:\n   - **Triage & Mitigation**: The priority is stopping the bleeding. Never spend 2 hours live-debugging in production while users suffer—roll back to the last known good commit or enable degraded fallback mode immediately.\n   - **Communication**: Designate an Incident Commander and a Communications Lead so engineers are not distracted by answering Slack pings.\n   - **Root Cause Analysis (5 Whys)**: Dig past the surface human error (e.g., "Engineer forgot a semicolon") down to the systemic weakness (e.g., "Why did CI let this pass? Why didn’t linting catch it? Why did the deployment hit 100% of nodes at once?").\n   - **Action Items with Owners**: Post-mortem action items must have assigned owners, Jira tickets, and deadlines (P0 fixes within 48h, P1 within 2 weeks).',
    codeExample: {
      language: 'markdown',
      code: `### Blameless Post-Mortem Template Example:
**Incident Summary**: Sev-1 Outage on Checkout Service (Duration: 23 mins, 8.4% failed checkouts).
**Timeline**:
* 14:02 UTC: Deployment v2.4.1 goes live.
* 14:05 UTC: Datadog alert fires: 504 Gateway Timeouts surge to 12%.
* 14:08 UTC: Incident Commander declared; deployment rolled back to v2.4.0.
* 14:14 UTC: Latency stabilizes; 100% checkouts succeed.

**Root Cause (5 Whys)**:
1. *Why did timeouts occur?* Database connection pool was exhausted.
2. *Why was it exhausted?* An unindexed foreign key query in the new recommendation hook triggered full table scans.
3. *Why wasn't the slow query caught in staging?* Staging database only had 500 rows, masking the lack of an index.
4. *Why did deployment hit 100% immediately?* Automated canary testing was not configured for this service.

**Corrective Action Items**:
- [x] Add composite index to \`recommendations(user_id, created_at)\` (Owner: Dave, PR #412).
- [ ] Add EXPLAIN ANALYZE linter rule in CI to detect unindexed queries (Owner: Alice, Due: Friday).
- [ ] Implement Argo Rollouts canary progressive rollout for checkout service (Owner: SRE team).`,
      exampleInput: "Interviewer asks: 'Have you ever broken production? What happened?'",
      exampleOutput: "Authentic, accountable response highlighting swift customer-first mitigation, systematic root-cause diagnosis, and permanent systemic prevention."
    },
    commonMistakes: [
      'Claiming you have never broken production or had an outage (signals lack of real-world production experience).',
      'Assigning blame to junior engineers or third-party vendors instead of identifying systemic process flaws.',
      'Focusing exclusively on the technical bug while ignoring business impact and stakeholder communication.'
    ],
    realWorldUseCases: [
      'Database connection pool starvation during Black Friday traffic spikes.',
      'Third-party payment gateway timeout causing cascading thread exhaustion in core backend.'
    ],
    tradeOffs: [
      'Immediate rollback preserves customer availability but may destroy ephemeral in-memory state needed to diagnose rare concurrency heisenbugs; capturing memory dumps prior to container termination balances both.'
    ],
    followUpQuestions: [
      'How do you prevent post-mortems from becoming finger-pointing sessions?',
      'What metrics do you track to evaluate overall team reliability (MTTR, MTTD, Change Failure Rate)?'
    ],
    relatedQuestionIds: ['beh-1', 'devops-2', 'sd-1'],
    relatedTopicIds: ['technical-challenges', 'incident-response', 'reliability-engineering'],
    prerequisiteTopicIds: ['monitoring-alerting', 'communication-clarity'],
    nextTopicIds: ['sre-principles', 'chaos-engineering'],
    tags: ['Behavioral', 'Incident Response', 'Post-Mortem', 'Outage', 'SRE', '5 Whys'],
    keywords: ['behavioral', 'production outage', 'incident response', 'post mortem', '5 whys', 'blameless', 'sre']
  },
  {
    id: 'beh-3',
    slug: 'mentoring-junior-engineers-and-code-reviews',
    title: 'Mentoring Engineers & Cultivating Code Review Excellence',
    questionText: 'How do you approach mentoring junior and mid-level engineers? How do you give constructive feedback during code reviews without discouraging team members?',
    category: 'Behavioral & Leadership',
    categoryId: 'behavioral',
    topicId: 'team-collaboration',
    subtopicId: 'mentoring-growth',
    difficulty: 'Easy',
    questionType: 'Behavioral',
    roleTarget: 'Senior Software Engineer',
    roleIds: ['senior-software-eng', 'technical-lead', 'engineering-manager'],
    estimatedTime: '3 mins response',
    estimatedMinutes: 3,
    description: 'Foster psychological safety, effective Socratic guidance, constructive PR reviews, and career acceleration for developing engineers.',
    shortAnswer: 'Effective mentorship blends psychological safety with high engineering standards. Rather than prescribing answers, great mentors use Socratic questioning to guide engineers to discover solutions independently. In code reviews: 1) Differentiate between blocking correctness/security issues and non-blocking nitpicks (using Conventional Comments tags like `[issue]`, `[suggestion]`, `[nit]`); 2) Always explain the "why" behind recommendations (linking to documentation or performance benchmarks); 3) Praise clean patterns publicly and deliver critical feedback constructively or via quick 1-on-1 pairing sessions.',
    detailedAnswer: '1. **Code Review Best Practices (Conventional Comments)**:\n   - **Nitpick (non-blocking)**: `[nit] Consider renaming \'x\' to \'userCount\' for clarity.`\n   - **Suggestion**: `[suggestion] We could use useMemo here if the list exceeds 500 items, but premature optimization might not be necessary.`\n   - **Issue (blocking)**: `[issue (security)] This SQL query interpolates raw input without parameterized bindings, exposing SQL injection.`\n\n2. **The 3 Pillars of Mentorship**:\n   - **Safe Environment**: Normalize failure as an essential learning vector. Share personal stories of early mistakes.\n   - **Incremental Stretch Goals**: Gradually increase autonomy: from bug fixes -> feature implementation -> leading a multi-week RFC architecture.\n   - **Pair Programming**: Sit together during complex debugging sessions, modeling how to read stack traces, isolate hypotheses, and use debuggers.',
    codeExample: {
      language: 'markdown',
      code: `### Code Review Feedback Transformation:
* *Ineffective / Demotivating*: "This function is too long and messy. Rewrite it."
* *Constructive / Educational*: "Great progress getting the payment flow working! The \`processTransaction\` function currently handles validation, API calls, and analytics. What do you think about extracting the analytics tracking into a separate hook so this function stays focused on transaction logic? Here is how we did something similar in the auth module: [link to PR]."`,
      exampleInput: "Interviewer asks: 'How do you mentor junior developers?'",
      exampleOutput: "Inspiring answer demonstrating empathy, actionable code review etiquettes, and structured growth coaching."
    },
    commonMistakes: [
      'Taking over the keyboard and writing the code yourself instead of letting the mentee type and learn through practice.',
      'Flooding PRs with 40 pedantic styling comments instead of automating styling with Prettier/ESLint.',
      'Only pointing out flaws without ever praising good code or elegant solutions.'
    ],
    realWorldUseCases: [
      'Onboarding new bootcamp or college graduates to a 200-engineer codebase.',
      'Helping a mid-level engineer prepare for promotion to Senior by coaching them through their first RFC.'
    ],
    tradeOffs: [
      'Pairing and thoughtful code reviews require upfront time investment from senior engineers, but generate 5x team throughput dividends over the subsequent 6 months.'
    ],
    followUpQuestions: [
      'How do you handle an engineer who repeatedly makes the same mistakes despite feedback?',
      'How do you balance your own individual contributor delivery with mentoring obligations?'
    ],
    relatedQuestionIds: ['beh-1', 'beh-2', 'fe-1'],
    relatedTopicIds: ['team-collaboration', 'mentoring-growth', 'code-review'],
    prerequisiteTopicIds: ['communication-clarity', 'star-method'],
    nextTopicIds: ['engineering-management', 'team-leadership'],
    tags: ['Behavioral', 'Mentorship', 'Code Reviews', 'Leadership', 'Culture'],
    keywords: ['mentoring', 'code review', 'conventional comments', 'coaching', 'junior engineers', 'leadership']
  },
  {
    id: 'beh-4',
    slug: 'prioritizing-technical-debt-vs-product-features',
    title: 'Balancing Technical Debt with Fast Product Delivery',
    questionText: 'How do you make the business case for refactoring and paying down technical debt to non-technical product managers and stakeholders focused on shipping new features?',
    category: 'Behavioral & Leadership',
    categoryId: 'behavioral',
    topicId: 'leadership-ownership',
    subtopicId: 'technical-debt-strategy',
    difficulty: 'Medium',
    questionType: 'Behavioral',
    roleTarget: 'Senior Software Engineer',
    roleIds: ['senior-software-eng', 'technical-lead', 'engineering-manager', 'software-architect'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Frame technical debt in terms of business velocity, reliability risks, and revenue impact. Master the Boy Scout rule and dedicated debt allocations.',
    shortAnswer: 'Product managers and business stakeholders do not care about "clean code" in the abstract; they care about feature velocity, system uptime, and customer churn. Making a compelling case for paying down technical debt requires translating architectural problems into business metrics: 1) Demonstrate how debt is actively slowing down feature delivery (e.g., "Adding a new filter takes 3 weeks instead of 3 days because of tightly coupled state"); 2) Highlight financial and security risk (e.g. cloud infrastructure costs, checkout drop-offs); 3) Propose pragmatic frameworks: the "Boy Scout Rule" (leave code cleaner than you found it on every PR), and negotiating a steady 15–20% allocation of sprint capacity for debt reduction alongside feature roadmaps.',
    detailedAnswer: '1. **Translating Tech Debt into Business Language**:\n   - *Engineers say*: "We need to rewrite this module because the code is spaghetti."\n   - *Product hearing*: "Engineers want to spend 2 months doing fun refactoring while our competitors ship features."\n   - *Executive framing*: "Right now, every new feature in the checkout funnel costs 40% more engineering hours and has caused 3 customer-facing regressions last month. Spending 1 sprint refactoring will cut development time for the next 4 roadmap features in half."\n\n2. **The 3 Debt Paydown Strategies**:\n   - **Opportunistic (Boy Scout Rule)**: Whenever touching a file for a feature, spend 15 minutes cleaning up adjacent functions.\n   - **Sprint Allocation (Tax Model)**: Reserve 20% of engineering points each sprint for stability, technical debt, and observability.\n   - **Debt Sprints / Fix-It Weeks**: Dedicated quarterly sprints for deep architectural upgrades (e.g. database migration or framework major version bumps).',
    codeExample: {
      language: 'markdown',
      code: `### Tech Debt Business Proposal Memo:
* **Current Problem**: Monolithic order processing service is tightly coupled; build times take 38 minutes and test failure rate is 22%.
* **Customer & Cost Impact**:
  - Deployments delayed: Only 1 deploy per day vs 10 per day industry benchmark.
  - Estimated engineer time lost waiting for builds: ~180 hours/month ($18,000/mo cost).
* **Proposed Remediation**: Split service into modular packages over 2 sprint cycles (allocating 30% of engineering capacity).
* **Expected ROI**:
  - CI build times cut to 4 minutes.
  - Feature delivery speed increases by ~35% for Q3 roadmap deliverables.`,
      exampleInput: "Product Manager asks: 'Why can't we just ship the feature now and clean it up later?'",
      exampleOutput: "Professional, data-backed explanation showing how compounding debt acts as interest on future sprint delivery."
    },
    commonMistakes: [
      'Demanding a complete full-system rewrite from scratch (the "Second System Effect"), which historically results in massive budget overruns and abandoned projects.',
      'Whining about code style preferences rather than focusing on real operational bottlenecks.',
      'Secretly refactoring large subsystems without informing product partners, resulting in missed roadmap commitments.'
    ],
    realWorldUseCases: [
      'Migrating from an unmaintained JavaScript codebase to strict TypeScript to eliminate runtime `Cannot read property of undefined` crashes.',
      'Refactoring monolithic Redux state into targeted Zustand stores to improve sluggish UI responsiveness.'
    ],
    tradeOffs: [
      'Early-stage startups must intentionally take on technical debt to validate product-market fit before competitors; knowing WHEN to take debt is as important as knowing when to pay it.'
    ],
    followUpQuestions: [
      'When is it actually the right business decision to ACCEPT technical debt and not refactor?',
      'How do you track and prioritize technical debt in your team’s Jira/backlog?'
    ],
    relatedQuestionIds: ['beh-1', 'beh-3', 'sd-1'],
    relatedTopicIds: ['leadership-ownership', 'technical-challenges', 'architecture-decisions'],
    prerequisiteTopicIds: ['communication-clarity', 'star-method'],
    nextTopicIds: ['engineering-management', 'product-alignment'],
    tags: ['Behavioral', 'Technical Debt', 'Product Management', 'Leadership', 'Refactoring'],
    keywords: ['technical debt', 'product management', 'refactoring', 'leadership', 'prioritization', 'business value']
  }
];
