import { QuestionItem, SessionOutlineItem } from '../types';

export const INITIAL_QUESTIONS: QuestionItem[] = [
  // --- FULL STACK DEVELOPER ---
  {
    id: 'fs-1',
    title: 'Explain the fundamental differences between RESTful APIs and GraphQL for data fetching in client applications.',
    category: 'Technical Architecture',
    difficulty: 'Easy',
    roleTarget: 'Full Stack Developer',
    estimatedTime: '3 mins response',
    description: 'Compare over-fetching vs under-fetching, network payloads, schema typing contracts, and HTTP caching implications.',
    companies: ['Shopify', 'GitHub', 'Meta'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 88%',
    isBookmarked: true
  },
  {
    id: 'fs-2',
    title: 'How do you design a secure token authentication flow using refresh token rotation and HttpOnly cookies to prevent XSS and CSRF?',
    category: 'System Architecture',
    difficulty: 'Medium',
    roleTarget: 'Full Stack Developer',
    estimatedTime: '4 mins response',
    description: 'Address cookie SameSite attributes, CSRF double-submit tokens, silent refresh logic, and handling compromised refresh families.',
    companies: ['Auth0', 'Stripe', 'Airbnb'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: true
  },
  {
    id: 'fs-3',
    title: 'Compare B-Tree and LSM-tree (Log-Structured Merge) architectures under heavy write-amplification versus point-lookup constraints.',
    category: 'Database Internals',
    difficulty: 'Medium',
    roleTarget: 'Full Stack Developer',
    estimatedTime: '3 mins response',
    description: 'Explain why modern write-heavy data stores (Cassandra, RocksDB) favor SSTables and compaction while standard OLTP engines (PostgreSQL, MySQL InnoDB) rely on B+Trees.',
    companies: ['Amazon AWS', 'Datadog', 'Snowflake'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 85%',
    isBookmarked: false
  },
  {
    id: 'fs-4',
    title: 'Architect an end-to-end optimistic mutation sync engine that caches edits in IndexedDB and reconciles conflicts when coming back online.',
    category: 'System Architecture',
    difficulty: 'Hard',
    roleTarget: 'Full Stack Developer',
    estimatedTime: '5 mins response',
    description: 'Cover vector clocks or Last-Write-Wins timestamps, idempotent mutation endpoints, rollback handling on 4xx/5xx responses, and background sync workers.',
    companies: ['Linear', 'Figma', 'Notion'],
    status: 'review',
    statusLabel: 'Needs Review • Last Score: 64%',
    isBookmarked: true
  },
  {
    id: 'fs-5',
    title: 'Design a distributed Server-Side Rendering (SSR) pipeline with edge caching and Incremental Static Regeneration (ISR) at 50,000 req/sec.',
    category: 'Technical Architecture',
    difficulty: 'Hard',
    roleTarget: 'Full Stack Developer',
    estimatedTime: '5 mins response',
    description: 'Focus on stale-while-revalidate headers, CDN cache purging invalidation tags, serverless cold starts, and streaming hydration chunking.',
    companies: ['Vercel', 'Netlify', 'Amazon'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: false
  },

  // --- FRONTEND DEVELOPER ---
  {
    id: 'fe-1',
    title: 'Explain the difference between useEffect, useLayoutEffect, and useInsertionEffect with practical use cases.',
    category: 'React Internals',
    difficulty: 'Easy',
    roleTarget: 'Frontend Developer',
    estimatedTime: '2–3 mins response',
    description: 'Focus on render timing, browser paint synchronization, DOM mutation flicker prevention, and CSS-in-JS style injection overhead.',
    companies: ['Meta', 'Vercel', 'Shopify'],
    status: 'passed',
    statusLabel: 'Practiced 3x • High Score: 92%',
    isBookmarked: true
  },
  {
    id: 'fe-2',
    title: 'Walk through how the CSS box model, layout recalculation, and composite layers impact 60fps browser rendering.',
    category: 'Technical Architecture',
    difficulty: 'Easy',
    roleTarget: 'Frontend Developer',
    estimatedTime: '3 mins response',
    description: 'Explain triggers for reflow vs repaint, GPU acceleration with transform/opacity, and will-change memory trade-offs.',
    companies: ['Google', 'Apple', 'Canva'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: false
  },
  {
    id: 'fe-3',
    title: 'Explain the architectural trade-offs between CSR, SSR, and SSG in high-traffic consumer web applications.',
    category: 'Technical Architecture',
    difficulty: 'Medium',
    roleTarget: 'Frontend Developer',
    estimatedTime: '3–4 mins response',
    description: 'Focus on Time-To-Interactive (TTI), Largest Contentful Paint (LCP), server load variance, CDN caching invalidation strategies, and SEO implications for dynamic user state.',
    companies: ['Meta', 'Stripe', 'Vercel'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 84%',
    isBookmarked: true
  },
  {
    id: 'fe-4',
    title: 'How do you identify, profile, and remediate memory leaks caused by lingering event listeners or closures in React 18 Concurrent Mode?',
    category: 'React Internals',
    difficulty: 'Hard',
    roleTarget: 'Frontend Developer',
    estimatedTime: '4 mins response',
    description: 'Explain Chrome DevTools memory allocation snapshots, retained object trees, cleanup contracts in useEffect, and handling unsubscribed RxJS or WebSocket connections.',
    companies: ['Netflix', 'Uber', 'Airbnb'],
    status: 'review',
    statusLabel: 'Needs Review • Last Score: 59% (Structure weak)',
    isBookmarked: false
  },
  {
    id: 'fe-5',
    title: 'Design a high-performance virtualized list capable of rendering 100,000 variable-height rows with dynamic DOM recycling.',
    category: 'Technical Architecture',
    difficulty: 'Hard',
    roleTarget: 'Frontend Developer',
    estimatedTime: '5 mins response',
    description: 'Detail scroll viewport measurement, dynamic element height caching, binary search offset indexing, and scroll velocity estimation.',
    companies: ['Meta', 'Twitter/X', 'Slack'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: true
  },

  // --- BACKEND DEVELOPER ---
  {
    id: 'be-1',
    title: 'What are the key trade-offs between relational database transactions (ACID) and eventual consistency in NoSQL stores?',
    category: 'Database Internals',
    difficulty: 'Easy',
    roleTarget: 'Backend Developer',
    estimatedTime: '3 mins response',
    description: 'Define isolation levels, dirty reads, non-repeatable reads, phantom reads, and compare with BASE consistency models under high write volume.',
    companies: ['AWS', 'Microsoft', 'Oracle'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 86%',
    isBookmarked: false
  },
  {
    id: 'be-2',
    title: 'Explain how connection pooling works and how misconfigured pool exhaustion causes cascade failures across microservices.',
    category: 'Technical Architecture',
    difficulty: 'Easy',
    roleTarget: 'Backend Developer',
    estimatedTime: '3 mins response',
    description: 'Cover max connection bounds, timeout queues, TCP handshake overhead, and circuit breaker protection against downstream database saturation.',
    companies: ['Stripe', 'DoorDash', 'Uber'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: false
  },
  {
    id: 'be-3',
    title: 'How would you architect rate-limiting across 10 distributed edge API gateways with sub-millisecond overhead?',
    category: 'System Design',
    difficulty: 'Medium',
    roleTarget: 'Backend Developer',
    estimatedTime: '4 mins response',
    description: 'Discuss Token Bucket vs Leaky Bucket algorithms, Redis sliding window counters, and local in-memory token batch leases.',
    companies: ['Cloudflare', 'GitHub', 'Twilio'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 89%',
    isBookmarked: true
  },
  {
    id: 'be-4',
    title: 'Design an exactly-once message processing scheme for incoming payment webhooks under network partition and timeout retries.',
    category: 'System Architecture',
    difficulty: 'Hard',
    roleTarget: 'Backend Developer',
    estimatedTime: '5 mins response',
    description: 'Address distributed locking strategies (Redis Redlock vs Postgres advisory locks), state machine transitions, exponential backoff with jitter, and dead letter queues (DLQ).',
    companies: ['Stripe', 'Adyen', 'Coinbase'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 91%',
    isBookmarked: false
  },
  {
    id: 'be-5',
    title: 'Design a real-time behavioral analytics ingestion pipeline capable of sustaining 100,000 events/second with sub-minute dashboard freshness.',
    category: 'System Design',
    difficulty: 'Hard',
    roleTarget: 'Backend Developer',
    estimatedTime: '6 mins response',
    description: 'Detail your choice of message broker (Apache Kafka vs AWS Kinesis), stream processing engine (Flink vs Spark Streaming), aggregate storage (ClickHouse vs Druid), and partition key strategy.',
    companies: ['Segment', 'Amplitude', 'ByteDance'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: false
  },

  // --- JAVA DEVELOPER ---
  {
    id: 'jv-1',
    title: 'Explain the Java Memory Model (JMM), the volatile keyword, and memory visibility guarantees between threads.',
    category: 'Technical Architecture',
    difficulty: 'Easy',
    roleTarget: 'Java Developer',
    estimatedTime: '3 mins response',
    description: 'Focus on happens-before relationships, instruction reordering, CPU cache coherence protocols, and atomicity vs visibility.',
    companies: ['Goldman Sachs', 'Oracle', 'Morgan Stanley'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 81%',
    isBookmarked: false
  },
  {
    id: 'jv-2',
    title: 'How do modern garbage collectors like G1 and ZGC achieve low-latency stop-the-world pauses in multi-gigabyte heaps?',
    category: 'Technical Architecture',
    difficulty: 'Medium',
    roleTarget: 'Java Developer',
    estimatedTime: '4 mins response',
    description: 'Explain generational regions, concurrent marking phases, colored pointers, load barriers, and compaction algorithms.',
    companies: ['Netflix', 'Uber', 'Amazon'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: true
  },
  {
    id: 'jv-3',
    title: 'Architect a high-concurrency Spring Boot payment ledger handling 25,000 requests/sec utilizing Project Loom virtual threads.',
    category: 'System Architecture',
    difficulty: 'Hard',
    roleTarget: 'Java Developer',
    estimatedTime: '5 mins response',
    description: 'Address carrier thread pinning during synchronized blocks, database connection pooling constraints with non-blocking I/O, and optimistic concurrency locking.',
    companies: ['Stripe', 'JPMorgan', 'Square'],
    status: 'review',
    statusLabel: 'Needs Review • Last Score: 68%',
    isBookmarked: false
  },

  // --- DATA ANALYST ---
  {
    id: 'da-1',
    title: 'What is the operational difference between WHERE and HAVING in SQL, and when would you use Window Functions over GROUP BY?',
    category: 'Database Internals',
    difficulty: 'Easy',
    roleTarget: 'Data Analyst',
    estimatedTime: '3 mins response',
    description: 'Explain logical query processing order, row-level filtering vs aggregate filtering, and window framing partition clauses.',
    companies: ['Airbnb', 'Spotify', 'Meta'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 94%',
    isBookmarked: true
  },
  {
    id: 'da-2',
    title: 'How do you design a cohort retention analysis matrix in SQL and identify early indicators of customer churn?',
    category: 'Technical Architecture',
    difficulty: 'Medium',
    roleTarget: 'Data Analyst',
    estimatedTime: '4 mins response',
    description: 'Cover date truncation, user activity attribution windows, cohort retention curves, and calculating LTV/CAC ratios.',
    companies: ['DoorDash', 'Netflix', 'Lyft'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: false
  },
  {
    id: 'da-3',
    title: 'How would you diagnose data skew in a distributed Spark or BigQuery job where 99% of tasks finish in seconds but one takes 2 hours?',
    category: 'System Architecture',
    difficulty: 'Hard',
    roleTarget: 'Data Analyst',
    estimatedTime: '5 mins response',
    description: 'Address uneven partition key distribution, salt keys, broadcast joins for skewed dimensions, and spilling to disk.',
    companies: ['Google', 'Databricks', 'Snowflake'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: true
  },

  // --- SOFTWARE ENGINEER ---
  {
    id: 'se-1',
    title: 'Analyze the algorithmic trade-offs between QuickSort, MergeSort, and TimSort regarding time complexity and auxiliary space.',
    category: 'Algorithms & Data Structures',
    difficulty: 'Easy',
    roleTarget: 'Software Engineer',
    estimatedTime: '3 mins response',
    description: 'Explain best, average, and worst-case performance, cache locality benefits, stability in object sorting, and recursion depth stack bounds.',
    companies: ['Google', 'Meta', 'Amazon'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 90%',
    isBookmarked: false
  },
  {
    id: 'se-2',
    title: 'Implement an O(1) Least Recently Used (LRU) Cache data structure supporting get(key) and put(key, value) operations.',
    category: 'Algorithms & Data Structures',
    difficulty: 'Medium',
    roleTarget: 'Software Engineer',
    estimatedTime: '4 mins response',
    description: 'Design the combination of a Hash Map with a Doubly Linked List, eviction policy on capacity overflow, and concurrency-safe mutex guards.',
    companies: ['Bloomberg', 'Apple', 'Microsoft'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: true
  },
  {
    id: 'se-3',
    title: 'Design a distributed rate limiter supporting token bucket and sliding window counter algorithms across a global server cluster.',
    category: 'System Architecture',
    difficulty: 'Hard',
    roleTarget: 'Software Engineer',
    estimatedTime: '5 mins response',
    description: 'Address race conditions with Redis Lua scripts, memory footprint per IP/user token, clock drift across edge locations, and fallback degraded behavior.',
    companies: ['Stripe', 'Netflix', 'Uber'],
    status: 'review',
    statusLabel: 'Needs Review • Last Score: 67%',
    isBookmarked: false
  },

  // --- BEHAVIORAL & LEADERSHIP (ALL ROLES) ---
  {
    id: 'bh-1',
    title: 'Walk through a time you inadvertently introduced a Sev-1 regression into production. How did you triage, communicate, and lead the post-mortem?',
    category: 'STAR Behavioral',
    difficulty: 'Easy',
    roleTarget: 'All Engineering Roles',
    estimatedTime: '3 mins response',
    description: 'Focus on communication during incident command, rapid rollback decision-making, root cause analysis (5 Whys), and preventative CI/CD gate installations.',
    companies: ['Meta', 'Cloudflare', 'Twilio'],
    status: 'passed',
    statusLabel: 'Practiced 3x • High Score: 89%',
    isBookmarked: true
  },
  {
    id: 'bh-2',
    title: 'Describe a situation where a Product Manager insisted on shipping a critical feature with known technical debt and security vulnerabilities.',
    category: 'STAR Behavioral',
    difficulty: 'Medium',
    roleTarget: 'All Engineering Roles',
    estimatedTime: '3–5 mins response',
    description: 'Assess alignment around business risk, how you formulated quantitative risk assessments, reached executive compromise, and documented technical remediation SLAs.',
    companies: ['Amazon', 'Google', 'Apple'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: true
  },
  {
    id: 'bh-3',
    title: 'Describe a high-stakes disagreement with leadership over shipping a technical debt refactor versus product velocity. How did you resolve it?',
    category: 'STAR Behavioral',
    difficulty: 'Hard',
    roleTarget: 'All Engineering Roles',
    estimatedTime: '4 mins response',
    description: 'Use the STAR framework. Quantify business trade-offs, define service SLAs, and present executive compromise strategy.',
    companies: ['Amazon', 'Uber', 'Microsoft'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 87%',
    isBookmarked: false
  }
];

export const SESSION_OUTLINE_ITEMS: SessionOutlineItem[] = [
  {
    id: 1,
    title: '1. React Architecture & Foundations',
    subtitle: 'Component modularity principles',
    duration: '4:10',
    status: 'completed'
  },
  {
    id: 2,
    title: '2. Lifecycle & Server Hydration',
    subtitle: 'SSR reconciliation overhead',
    duration: '3:45',
    status: 'completed'
  },
  {
    id: 3,
    title: '3. Virtual DOM & Optimization',
    subtitle: 'Telemetry streaming feed',
    duration: 'Active',
    status: 'active'
  },
  {
    id: 4,
    title: '4. State Management: Zustand vs Context',
    subtitle: 'Atomic subscriptions',
    duration: '~3m',
    status: 'upcoming'
  },
  {
    id: 5,
    title: '5. Web Workers & Offscreen Compute',
    subtitle: 'Heavy parsing isolation',
    duration: '~4m',
    status: 'upcoming'
  },
  {
    id: 6,
    title: '6. Network Resilience & Caching',
    subtitle: 'Offline optimistic mutations',
    duration: '~3m',
    status: 'upcoming'
  },
  {
    id: 7,
    title: '7. Core Web Vitals (INP & LCP)',
    subtitle: 'Production profiling',
    duration: '~3m',
    status: 'upcoming'
  },
  {
    id: 8,
    title: '8. Candidate Q&A & Wrap-up',
    subtitle: 'Reflections & score overview',
    duration: '~2m',
    status: 'upcoming'
  }
];

export const RECENT_INTERVIEWS_DATA = [
  {
    id: 'iv-1',
    role: 'Frontend Developer',
    roleShort: 'FE',
    roleBadgeColor: 'bg-primary-fixed text-primary',
    track: 'Meta mock series',
    scope: 'Technical (React & System)',
    completed: 'Oct 4, 2:30 PM',
    score: 82,
    status: 'Passed',
    statusClass: 'bg-secondary-container text-on-secondary-container',
    scoreClass: 'text-secondary'
  },
  {
    id: 'iv-2',
    role: 'Java Developer',
    roleShort: 'JV',
    roleBadgeColor: 'bg-surface-container-high text-on-surface-variant',
    track: 'Fintech core track',
    scope: 'Technical (OOP & Concurrency)',
    completed: 'Oct 2, 10:00 AM',
    score: 74,
    status: 'Needs Practice',
    statusClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    scoreClass: 'text-tertiary'
  },
  {
    id: 'iv-3',
    role: 'Data Analyst',
    roleShort: 'DA',
    roleBadgeColor: 'bg-secondary-container text-secondary',
    track: 'Product Analytics',
    scope: 'Behavioral & Problem Solving',
    completed: 'Sep 29, 4:15 PM',
    score: 85,
    status: 'Strong',
    statusClass: 'bg-secondary-container text-on-secondary-container',
    scoreClass: 'text-secondary'
  },
  {
    id: 'iv-4',
    role: 'Software Engineer',
    roleShort: 'SE',
    roleBadgeColor: 'bg-error-container text-on-error-container',
    track: 'Generalist L4',
    scope: 'System Design & Algorithms',
    completed: 'Sep 25, 11:00 AM',
    score: 71,
    status: 'Needs Review',
    statusClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    scoreClass: 'text-tertiary'
  }
];
