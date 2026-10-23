import { QuestionItem, SessionOutlineItem } from '../types';

export const INITIAL_QUESTIONS: QuestionItem[] = [
  {
    id: 'q1',
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
    id: 'q2',
    title: 'How do you identify, profile, and remediate memory leaks caused by lingering event listeners or closures in React 18 Concurrent Mode?',
    category: 'React Internals',
    difficulty: 'Hard',
    roleTarget: 'Senior Frontend',
    estimatedTime: '4 mins response',
    description: 'Explain Chrome DevTools memory allocation snapshots, retained object trees, cleanup contracts in useEffect, and handling unsubscribed RxJS or WebSocket connections.',
    companies: ['Netflix', 'Uber', 'Airbnb'],
    status: 'review',
    statusLabel: 'Needs Review • Last Score: 59% (Structure weak)',
    isBookmarked: false
  },
  {
    id: 'q3',
    title: 'Describe a situation where a Product Manager insisted on shipping a critical feature with known technical debt and security vulnerabilities.',
    category: 'STAR Behavioral',
    difficulty: 'Medium',
    roleTarget: 'Leadership & Cross-functional',
    estimatedTime: '3–5 mins response',
    description: 'Assess alignment around business risk, how you formulated quantitative risk assessments, reached executive compromise, and documented technical remediation SLAs.',
    companies: ['Amazon', 'Google', 'Apple'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: true
  },
  {
    id: 'q4',
    title: 'Design an exactly-once message processing scheme for incoming payment webhooks under network partition and timeout retries.',
    category: 'System Architecture',
    difficulty: 'Hard',
    roleTarget: 'Backend / Distributed Systems',
    estimatedTime: '5 mins response',
    description: 'Address distributed locking strategies (Redis Redlock vs Postgres advisory locks), state machine transitions, exponential backoff with jitter, and dead letter queues (DLQ).',
    companies: ['Stripe', 'Adyen', 'Coinbase'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 91%',
    isBookmarked: false
  },
  {
    id: 'q5',
    title: 'Compare B-Tree and LSM-tree (Log-Structured Merge) architectures under heavy write-amplification versus point-lookup constraints.',
    category: 'Database Internals',
    difficulty: 'Medium',
    roleTarget: 'Full Stack / Data',
    estimatedTime: '3 mins response',
    description: 'Explain why modern write-heavy data stores (Cassandra, RocksDB) favor SSTables and compaction while standard OLTP engines (PostgreSQL, MySQL InnoDB) rely on B+Trees.',
    companies: ['Amazon AWS', 'Datadog', 'Snowflake'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: false
  },
  {
    id: 'q6',
    title: 'Walk through a time you inadvertently introduced a Sev-1 regression into production. How did you triage, communicate, and lead the blameless post-mortem?',
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
    id: 'q7',
    title: 'Design a real-time behavioral analytics ingestion pipeline capable of sustaining 100,000 events/second with sub-minute dashboard freshness.',
    category: 'System Design',
    difficulty: 'Hard',
    roleTarget: 'Staff / Principal Architect',
    estimatedTime: '6 mins response',
    description: 'Detail your choice of message broker (Apache Kafka vs AWS Kinesis), stream processing engine (Flink vs Spark Streaming), aggregate storage (ClickHouse vs Druid), and partition key strategy.',
    companies: ['Segment', 'Amplitude', 'ByteDance'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
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
