export interface TopicDefinition {
  id: string;
  name: string;
  category: string;
  roles: string[];
  description: string;
  essentialForJunior: boolean;
  essentialForSenior: boolean;
  prerequisites: string[];
  subtopics: string[];
}

export interface RoleDefinition {
  id: string;
  title: string;
  category: string;
  shortCode: string;
  description: string;
  primaryTopics: string[];
  icon: string;
}

export const ALL_SUPPORTED_ROLES: RoleDefinition[] = [
  {
    id: 'frontend',
    title: 'Frontend Developer',
    category: 'Engineering',
    shortCode: 'FE',
    description: 'Modern Web Architectures, React, TypeScript, State Management, Accessibility & Core Web Vitals',
    primaryTopics: [
      'HTML & Semantic Web',
      'CSS, Flexbox & Responsive Layouts',
      'JavaScript Fundamentals & Async',
      'TypeScript Typing & Generics',
      'React Components, Hooks & Lifecycle',
      'State Management & Store Patterns',
      'Browser Internals, DOM & Rendering',
      'Web Accessibility (WCAG & ARIA)',
      'Frontend Testing (Jest, Vitest, Playwright)',
      'Web Performance & Core Web Vitals',
      'Frontend Architecture & Micro-Frontends'
    ],
    icon: 'devices'
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    category: 'Engineering',
    shortCode: 'BE',
    description: 'Server Runtimes, Distributed APIs, Database Modeling, Caching, Auth & High-Throughput Pipelines',
    primaryTopics: [
      'Node.js & Server Runtimes',
      'HTTP, Networking & TCP/IP',
      'REST & GraphQL API Design',
      'Authentication & OAuth2 / JWT Security',
      'Relational & NoSQL Database Integration',
      'Caching (Redis, Memcached) & Message Queues',
      'Backend Testing & Contract Validation',
      'API Security & OWASP Defense',
      'Logging, Telemetry & Observability',
      'Distributed Systems & Resilient Architecture'
    ],
    icon: 'dns'
  },
  {
    id: 'fullstack',
    title: 'Full Stack Developer',
    category: 'Engineering',
    shortCode: 'FS',
    description: 'End-to-End System Delivery, Client-Server Contracts, Database Architecture & Scalable Cloud Deployments',
    primaryTopics: [
      'Full Stack Architecture & Data Contracts',
      'TypeScript Across Client & Server',
      'Next.js, SSR & Server Actions',
      'Database Modeling & Migrations',
      'End-to-End Authentication Flows',
      'Integration & Contract Testing',
      'Containerization & Cloud CI/CD',
      'Full Stack Security & Input Validation',
      'System Design for Web Scale'
    ],
    icon: 'layers'
  },
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    category: 'Core Computer Science',
    shortCode: 'SWE',
    description: 'Algorithmic Complexity, Data Structures, Object-Oriented Design & Generalist Engineering Foundations',
    primaryTopics: [
      'Data Structures (Trees, Graphs, Heaps)',
      'Algorithms & Dynamic Programming',
      'Time & Space Complexity Analysis',
      'Object-Oriented Design & Clean Architecture',
      'Recursion & Backtracking',
      'Memory Management & Concurrency',
      'Debugging & Root-Cause Troubleshooting'
    ],
    icon: 'code'
  },
  {
    id: 'databases',
    title: 'Database & Data Engineer',
    category: 'Data & Storage',
    shortCode: 'DB',
    description: 'Relational Schemas, Index Tuning, Query Execution Plans, Partitioning & Modern Data Pipelines',
    primaryTopics: [
      'SQL & Complex Query Formulations',
      'PostgreSQL & MySQL Query Optimization',
      'Indexing Strategies (B-Tree, Hash, GIN)',
      'ACID Transactions & Isolation Levels',
      'MongoDB & Document Stores',
      'Distributed Caching with Redis',
      'Data Modeling & Normalization Trade-offs',
      'Data Pipelines & ETL Architecture'
    ],
    icon: 'database'
  },
  {
    id: 'devops',
    title: 'DevOps & Cloud Engineer',
    category: 'Infrastructure & Cloud',
    shortCode: 'OPS',
    description: 'Infrastructure as Code, Docker Containers, Kubernetes Orchestration, Cloud Platforms & Zero-Downtime CI/CD',
    primaryTopics: [
      'Git & Version Control Workflows',
      'Linux Fundamentals & Shell Scripting',
      'Docker & Containerization Best Practices',
      'Kubernetes Cluster Architecture & Pods',
      'CI/CD Pipelines (GitHub Actions)',
      'Infrastructure as Code (Terraform)',
      'AWS / Cloud Architectures',
      'Observability, Prometheus & Grafana',
      'Cloud Security & Secret Management'
    ],
    icon: 'cloud'
  },
  {
    id: 'ai-ml',
    title: 'Machine Learning & AI Engineer',
    category: 'AI & Data Science',
    shortCode: 'AI',
    description: 'Statistical Foundations, Model Evaluation, LLM Applications, Prompt Engineering & Production Inference',
    primaryTopics: [
      'Python for Machine Learning (NumPy, Pandas)',
      'Model Evaluation (Precision, Recall, F1, ROC)',
      'Feature Engineering & Data Preprocessing',
      'Natural Language Processing (NLP)',
      'Vector Embeddings & Semantic Search',
      'LLM Architectures & Prompt Engineering',
      'Retrieval-Augmented Generation (RAG)',
      'Model Serving & Deployment',
      'AI Safety, Security & Red Teaming'
    ],
    icon: 'psychology'
  },
  {
    id: 'system-design',
    title: 'System Design & Behavioral',
    category: 'Leadership & Architecture',
    shortCode: 'ARCH',
    description: 'Large-Scale Distributed Systems, Trade-off Justification, Scalability & STAR Executive Communication',
    primaryTopics: [
      'Distributed Systems Principles',
      'High-Scale Caching Strategies',
      'Load Balancing & Horizontal Scaling',
      'Data Partitioning & Sharding',
      'Rate Limiting & Resiliency Patterns',
      'STAR Behavioral Storytelling',
      'Technical Leadership & Conflict Resolution',
      'Quantifying Business Impact in Interviews'
    ],
    icon: 'account_tree'
  }
];

export const TOPIC_TAXONOMY: TopicDefinition[] = [
  // --- FRONTEND TOPICS ---
  {
    id: 'react-hooks',
    name: 'React Components, Hooks & Lifecycle',
    category: 'Frontend Development',
    roles: ['Frontend Developer', 'Full Stack Developer', 'Software Engineer'],
    description: 'Master useEffect dependency arrays, cleanup functions, useMemo, useCallback, custom hooks, and concurrent React rendering.',
    essentialForJunior: true,
    essentialForSenior: true,
    prerequisites: ['JavaScript Fundamentals & Async', 'TypeScript Typing & Generics'],
    subtopics: ['useEffect Dependencies', 'Effect Cleanup', 'Custom Hooks', 'React 19 Hooks', 'Re-rendering Optimization']
  },
  {
    id: 'ts-generics',
    name: 'TypeScript Typing & Generics',
    category: 'Frontend Development',
    roles: ['Frontend Developer', 'Full Stack Developer', 'Backend Developer'],
    description: 'Advanced types, conditional types, mapped types, utility types, generics, and strict TypeScript configurations.',
    essentialForJunior: true,
    essentialForSenior: true,
    prerequisites: ['JavaScript Fundamentals & Async'],
    subtopics: ['Generics', 'Utility Types', 'Union / Discriminated Unions', 'Type Narrowing', 'Declaration Files']
  },
  {
    id: 'web-perf',
    name: 'Web Performance & Core Web Vitals',
    category: 'Frontend Development',
    roles: ['Frontend Developer', 'Full Stack Developer'],
    description: 'Interaction to Next Paint (INP), Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), bundle splitting, and resource prioritization.',
    essentialForJunior: false,
    essentialForSenior: true,
    prerequisites: ['Browser Internals, DOM & Rendering'],
    subtopics: ['INP Optimization', 'LCP Tuning', 'Code Splitting', 'Image Optimization', 'Service Workers']
  },
  {
    id: 'accessibility',
    name: 'Web Accessibility (WCAG & ARIA)',
    category: 'Frontend Development',
    roles: ['Frontend Developer', 'Full Stack Developer'],
    description: 'WCAG 2.1 AA standards, keyboard navigation, screen reader testing, semantic elements, and accessible color contrast.',
    essentialForJunior: true,
    essentialForSenior: true,
    prerequisites: ['HTML & Semantic Web'],
    subtopics: ['ARIA Roles & Attributes', 'Keyboard Traps', 'Color Contrast', 'Screen Reader Testing', 'Focus Management']
  },
  {
    id: 'browser-internals',
    name: 'Browser Internals, DOM & Rendering',
    category: 'Frontend Development',
    roles: ['Frontend Developer', 'Full Stack Developer'],
    description: 'Critical rendering path, reflows, repaints, composite layers, Event Loop (microtasks vs macrotasks), and memory leaks.',
    essentialForJunior: false,
    essentialForSenior: true,
    prerequisites: ['HTML & Semantic Web', 'JavaScript Fundamentals & Async'],
    subtopics: ['Reflow vs Repaint', 'Event Loop', 'Garbage Collection', 'GPU Acceleration', 'DOM Reconciliation']
  },

  // --- BACKEND & FULL STACK TOPICS ---
  {
    id: 'api-security',
    name: 'Authentication & OAuth2 / JWT Security',
    category: 'Backend Development',
    roles: ['Backend Developer', 'Full Stack Developer', 'DevOps & Cloud Engineer'],
    description: 'Secure token storage, refresh token rotation, OAuth2 authorization code grant with PKCE, RBAC, and CSRF/XSS defenses.',
    essentialForJunior: true,
    essentialForSenior: true,
    prerequisites: ['HTTP, Networking & TCP/IP'],
    subtopics: ['JWT Vulnerabilities', 'HttpOnly Cookies', 'OAuth 2.1 & PKCE', 'Rate Limiting', 'RBAC & ABAC']
  },
  {
    id: 'sql-optimization',
    name: 'SQL & Database Query Optimization',
    category: 'Databases & Data',
    roles: ['Backend Developer', 'Full Stack Developer', 'Database & Data Engineer', 'Software Engineer'],
    description: 'EXPLAIN ANALYZE, composite indexes, join algorithms (Nested Loop, Hash, Merge Join), connection pooling, and transaction locks.',
    essentialForJunior: true,
    essentialForSenior: true,
    prerequisites: ['Relational & NoSQL Database Integration'],
    subtopics: ['EXPLAIN ANALYZE', 'Composite Indexes', 'Join Optimization', 'Deadlocks & Isolation Levels', 'Connection Pooling']
  },
  {
    id: 'caching-queues',
    name: 'Caching (Redis) & Message Queues',
    category: 'Backend Development',
    roles: ['Backend Developer', 'Full Stack Developer', 'System Design & Behavioral'],
    description: 'Cache eviction strategies (LRU/LFU), Cache Aside, Write-Through, message queues (RabbitMQ, Kafka, BullMQ), and idempotency.',
    essentialForJunior: false,
    essentialForSenior: true,
    prerequisites: ['HTTP, Networking & TCP/IP'],
    subtopics: ['Redis Data Structures', 'Cache Stampede Prevention', 'Pub/Sub vs Queues', 'Idempotent Consumer', 'Dead Letter Queues']
  },

  // --- DEVOPS TOPICS ---
  {
    id: 'docker-containers',
    name: 'Docker & Containerization Best Practices',
    category: 'DevOps & Cloud',
    roles: ['DevOps & Cloud Engineer', 'Backend Developer', 'Full Stack Developer'],
    description: 'Multi-stage builds, non-root users, layer caching, Docker Compose networking, and container image vulnerability scanning.',
    essentialForJunior: true,
    essentialForSenior: true,
    prerequisites: ['Linux Fundamentals & Shell Scripting'],
    subtopics: ['Multi-Stage Dockerfiles', 'Image Size Reduction', 'Security Hardening', 'Compose Networking', 'Volume Management']
  },
  {
    id: 'kubernetes-cloud',
    name: 'Kubernetes Cluster Architecture & Pods',
    category: 'DevOps & Cloud',
    roles: ['DevOps & Cloud Engineer', 'Backend Developer'],
    description: 'Deployments, Services, Ingress, ConfigMaps, Secrets, Horizontal Pod Autoscalers, and rolling zero-downtime updates.',
    essentialForJunior: false,
    essentialForSenior: true,
    prerequisites: ['Docker & Containerization Best Practices'],
    subtopics: ['Pods & ReplicaSets', 'Service Discovery & Ingress', 'HPA & Cluster Autoscaler', 'Rolling Deployments', 'Helm Charts']
  },

  // --- AI & ML TOPICS ---
  {
    id: 'model-evaluation',
    name: 'Model Evaluation (Precision, Recall, F1, ROC)',
    category: 'AI & Data Science',
    roles: ['Machine Learning & AI Engineer', 'Database & Data Engineer'],
    description: 'Confusion matrix metrics, precision-recall trade-offs, ROC-AUC, cross-validation, data leakage detection, and bias auditing.',
    essentialForJunior: true,
    essentialForSenior: true,
    prerequisites: ['Python for Machine Learning (NumPy, Pandas)'],
    subtopics: ['Precision vs Recall', 'ROC-AUC Curve', 'K-Fold Cross Validation', 'Data Leakage', 'Class Imbalance Strategies']
  },
  {
    id: 'rag-llm',
    name: 'Retrieval-Augmented Generation (RAG) & Embeddings',
    category: 'AI & Data Science',
    roles: ['Machine Learning & AI Engineer', 'Full Stack Developer', 'Software Engineer'],
    description: 'Chunking strategies, embedding models, vector databases (Pinecone, pgvector), re-ranking, and hallucination reduction.',
    essentialForJunior: false,
    essentialForSenior: true,
    prerequisites: ['Python for Machine Learning (NumPy, Pandas)'],
    subtopics: ['Chunking Strategies', 'Vector Similarity Search', 'HyDE & Re-Ranking', 'Context Window Packing', 'RAG Triad Evaluation']
  },

  // --- SYSTEM DESIGN & BEHAVIORAL ---
  {
    id: 'system-design-basics',
    name: 'Distributed Systems & Scalability Principles',
    category: 'System Design & Behavioral',
    roles: ['Full Stack Developer', 'Backend Developer', 'Software Engineer', 'System Design & Behavioral'],
    description: 'CAP theorem, consistent hashing, load balancing, database sharding, asynchronous processing, and fault tolerance.',
    essentialForJunior: false,
    essentialForSenior: true,
    prerequisites: ['HTTP, Networking & TCP/IP', 'Relational & NoSQL Database Integration'],
    subtopics: ['Consistent Hashing', 'Database Sharding', 'CAP & PACELC Theorems', 'Circuit Breakers', 'Backpressure']
  },
  {
    id: 'star-behavioral',
    name: 'STAR Behavioral Storytelling & Leadership',
    category: 'System Design & Behavioral',
    roles: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Software Engineer', 'Machine Learning & AI Engineer', 'DevOps & Cloud Engineer', 'System Design & Behavioral'],
    description: 'Structuring answers using Situation, Task, Action, Result. Quantifying business metrics, demonstrating ownership, and executive presence.',
    essentialForJunior: true,
    essentialForSenior: true,
    prerequisites: [],
    subtopics: ['STAR Framework Structure', 'Quantifying Business Impact', 'Cross-Functional Conflict', 'Technical Debt Trade-offs', 'Ownership Stories']
  }
];
