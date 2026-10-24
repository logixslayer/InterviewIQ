import { RoleCategory, TopicCategory, RoleLearningPath } from '../types';

export const ROLE_CATEGORIES: RoleCategory[] = [
  {
    id: 'frontend-web',
    name: 'Frontend & Web Development',
    description: 'User interfaces, browser runtimes, client state, and responsive web systems',
    roles: [
      { id: 'frontend-dev', title: 'Frontend Developer', description: 'Modern Web Architectures, UI state, rendering and Core Web Vitals', icon: 'web' },
      { id: 'react-dev', title: 'React Developer', description: 'React 18/19, Hooks, Concurrent Rendering, and Component Ecosystems', icon: 'code' },
      { id: 'angular-dev', title: 'Angular Developer', description: 'RxJS, Signals, Dependency Injection, and Enterprise Client Architecture', icon: 'change_history' },
      { id: 'vue-dev', title: 'Vue.js Developer', description: 'Composition API, Pinia, Reactivity System, and Nuxt.js', icon: 'view_quilt' },
      { id: 'javascript-dev', title: 'JavaScript Developer', description: 'ESNext, Event Loop, Closures, Prototypes, and Async Concurrency', icon: 'javascript' },
      { id: 'typescript-dev', title: 'TypeScript Developer', description: 'Advanced Type Systems, Generics, Utility Types, and Compile-time safety', icon: 'data_object' },
      { id: 'web-dev', title: 'Web Developer', description: 'Semantic HTML5, CSS Grid/Flexbox, DOM APIs, and Progressive Web Apps', icon: 'language' },
      { id: 'ui-engineer', title: 'UI Engineer', description: 'Design Systems, Micro-interactions, CSS Architecture, and Visual Fidelity', icon: 'palette' },
      { id: 'accessibility-engineer', title: 'Accessibility Engineer', description: 'WCAG 2.2, WAI-ARIA, Screen Readers, and Keyboard Navigation', icon: 'accessibility_new' },
      { id: 'frontend-perf-engineer', title: 'Frontend Performance Engineer', description: 'LCP, INP, CLS, Bundle Optimization, and Hydration Mechanics', icon: 'speed' }
    ]
  },
  {
    id: 'backend-api',
    name: 'Backend & API Development',
    description: 'Server runtimes, distributed services, databases, and network communication',
    roles: [
      { id: 'backend-dev', title: 'Backend Developer', description: 'Server Architecture, Data Pipelines, API design, and System Reliability', icon: 'dns' },
      { id: 'node-dev', title: 'Node.js Developer', description: 'Event Loop, Streams, Express/Fastify, and Asynchronous IO', icon: 'terminal' },
      { id: 'java-backend-dev', title: 'Java Backend Developer', description: 'JVM Internals, Spring Boot, Concurrency, and Enterprise Microservices', icon: 'coffee' },
      { id: 'python-backend-dev', title: 'Python Backend Developer', description: 'FastAPI, Django, Asyncio, ORM optimizations, and REST APIs', icon: 'integration_instructions' },
      { id: 'dotnet-dev', title: 'C#/.NET Developer', description: '.NET Core, ASP.NET, Entity Framework, LINQ, and Cloud Microservices', icon: 'hub' },
      { id: 'go-dev', title: 'Go Developer', description: 'Goroutines, Channels, Memory Allocation, and Low-Latency Systems', icon: 'bolt' },
      { id: 'php-dev', title: 'PHP Developer', description: 'Modern PHP 8+, Laravel, Symfony, and High-Volume Web Backends', icon: 'code_blocks' },
      { id: 'api-developer', title: 'API Developer', description: 'REST, GraphQL, gRPC, OpenAPI, Rate Limiting, and API Security', icon: 'api' },
      { id: 'distributed-systems-eng', title: 'Distributed Systems Engineer', description: 'Consensus Protocols (Raft/Paxos), Partitioning, and High Availability', icon: 'schema' }
    ]
  },
  {
    id: 'fullstack-software',
    name: 'Full Stack & Software Engineering',
    description: 'End-to-end software delivery, system trade-offs, and engineering leadership',
    roles: [
      { id: 'fullstack-dev', title: 'Full Stack Developer', description: 'End-to-End Delivery, React/Node.js, Databases, and Auth', icon: 'layers' },
      { id: 'software-engineer', title: 'Software Engineer', description: 'Data Structures, Algorithms, Problem Solving, and Object-Oriented Design', icon: 'code' },
      { id: 'junior-dev', title: 'Junior Software Developer', description: 'Core Fundamentals, Code Quality, Debugging, and Collaboration', icon: 'school' },
      { id: 'senior-engineer', title: 'Senior Software Engineer', description: 'System Architecture, Mentorship, High-Impact Refactoring, and Scaling', icon: 'military_tech' },
      { id: 'tech-lead', title: 'Technical Lead', description: 'Technical Roadmaps, System Design, Team Velocity, and Cross-functional Alignment', icon: 'group_work' },
      { id: 'software-architect', title: 'Software Architect', description: 'Enterprise Architecture, Boundary Definition, and Long-term Trade-offs', icon: 'account_tree' },
      { id: 'eng-manager', title: 'Engineering Manager', description: 'Team Growth, Project Execution, Performance Coaching, and Hiring', icon: 'manage_accounts' }
    ]
  },
  {
    id: 'mobile-dev',
    name: 'Mobile Development',
    description: 'Native and cross-platform client applications for iOS and Android',
    roles: [
      { id: 'android-dev', title: 'Android Developer', description: 'Kotlin, Jetpack Compose, Coroutines, Architecture Components, and BLE', icon: 'android' },
      { id: 'ios-dev', title: 'iOS Developer', description: 'Swift, SwiftUI, Combine, Memory Management, and App Store Guidelines', icon: 'phone_iphone' },
      { id: 'flutter-dev', title: 'Flutter Developer', description: 'Dart, Widget Trees, State Management (Bloc/Riverpod), and Multi-platform', icon: 'flutter_dash' },
      { id: 'react-native-dev', title: 'React Native Developer', description: 'Fabric Architecture, TurboModules, JSI, and Cross-Platform React', icon: 'stay_current_portrait' },
      { id: 'mobile-app-dev', title: 'Mobile Application Developer', description: 'Offline Storage, Push Notifications, Battery Efficiency, and Mobile UX', icon: 'devices' }
    ]
  },
  {
    id: 'data-database',
    name: 'Data & Database Roles',
    description: 'Relational & NoSQL databases, data pipelines, warehousing, and analytics',
    roles: [
      { id: 'sql-developer', title: 'SQL Developer', description: 'Complex Queries, Index Tuning, Stored Procedures, and Query Optimization', icon: 'table_chart' },
      { id: 'database-admin', title: 'Database Administrator', description: 'Replication, Backups, High Availability, Disaster Recovery, and Tuning', icon: 'database' },
      { id: 'data-analyst', title: 'Data Analyst', description: 'Exploratory Data Analysis, Cohort Modeling, BI Dashboards, and SQL', icon: 'analytics' },
      { id: 'data-engineer', title: 'Data Engineer', description: 'ETL/ELT Pipelines, Spark, Airflow, Kafka, and Data Lakehouses', icon: 'move_to_inbox' },
      { id: 'analytics-engineer', title: 'Analytics Engineer', description: 'dbt, Snowflake, Dimensional Modeling, and Data Governance', icon: 'insights' },
      { id: 'bi-developer', title: 'Business Intelligence Developer', description: 'PowerBI, Tableau, Looker, Semantic Layers, and Executive Metrics', icon: 'query_stats' },
      { id: 'data-scientist', title: 'Data Scientist', description: 'Statistical Inference, Predictive Modeling, A/B Testing, and Python/R', icon: 'science' }
    ]
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    description: 'Deep learning, LLMs, transformer architectures, computer vision, and MLOps',
    roles: [
      { id: 'ml-engineer', title: 'Machine Learning Engineer', description: 'Scikit-Learn, PyTorch, Model Training, Feature Engineering, and Inference', icon: 'psychology' },
      { id: 'ai-engineer', title: 'AI Engineer', description: 'Agentic Workflows, Tool Calling, Vector Search, and Autonomous AI Systems', icon: 'smart_toy' },
      { id: 'genai-engineer', title: 'Generative AI Engineer', description: 'RAG Pipelines, LoRA Fine-Tuning, Prompt Engineering, and Embeddings', icon: 'auto_awesome' },
      { id: 'nlp-engineer', title: 'NLP Engineer', description: 'Transformers, Tokenization, BERT/GPT, Named Entity Recognition, and Evaluation', icon: 'chat' },
      { id: 'cv-engineer', title: 'Computer Vision Engineer', description: 'CNNs, Vision Transformers, Object Detection, YOLO, and Image Segmentation', icon: 'visibility' },
      { id: 'mlops-engineer', title: 'MLOps Engineer', description: 'Model Registries, Feature Stores, Drift Monitoring, Triton, and vLLM Serving', icon: 'settings_suggest' }
    ]
  },
  {
    id: 'cloud-infrastructure',
    name: 'Cloud & Infrastructure',
    description: 'Containerization, Kubernetes, cloud platforms, and infrastructure as code',
    roles: [
      { id: 'devops-engineer', title: 'DevOps Engineer', description: 'CI/CD Pipelines, Docker, Kubernetes, Linux, and Automation', icon: 'all_inclusive' },
      { id: 'cloud-engineer', title: 'Cloud Engineer', description: 'AWS, Azure, Google Cloud, IAM, VPC Networking, and Serverless', icon: 'cloud' },
      { id: 'sre', title: 'Site Reliability Engineer', description: 'SLAs, SLOs, Error Budgets, Incident Management, and Distributed Tracing', icon: 'health_and_safety' },
      { id: 'platform-engineer', title: 'Platform Engineer', description: 'Internal Developer Platforms, Kubernetes Operators, and Developer Productivity', icon: 'developer_board' },
      { id: 'infrastructure-eng', title: 'Infrastructure Engineer', description: 'Terraform, Ansible, Linux Kernel Tuning, and Bare-metal Systems', icon: 'storage' },
      { id: 'k8s-engineer', title: 'Kubernetes Engineer', description: 'Pod Scheduling, CNI/CSI, Ingress Controllers, Service Mesh, and Helm', icon: 'anchor' },
      { id: 'cloud-sec-eng', title: 'Cloud Security Engineer', description: 'Zero Trust, Cloud Trail Auditing, Container Hardening, and KMS', icon: 'security' }
    ]
  },
  {
    id: 'testing-security',
    name: 'Testing & Security',
    description: 'Test automation, quality engineering, application security, and penetration testing',
    roles: [
      { id: 'qa-engineer', title: 'QA Engineer', description: 'Test Strategy, Bug Lifecycle, Exploratory Testing, and Acceptance Criteria', icon: 'rule' },
      { id: 'test-automation-eng', title: 'Test Automation Engineer', description: 'Playwright, Cypress, Selenium, Framework Design, and Parallel Execution', icon: 'smart_display' },
      { id: 'sdet', title: 'Software Development Engineer in Test', description: 'Test Infrastructure, Mock Servers, API Test Suites, and CI Integration', icon: 'bug_report' },
      { id: 'perf-test-eng', title: 'Performance Test Engineer', description: 'k6, JMeter, Locust, Load Profiling, Bottleneck Isolation, and Concurrency', icon: 'timer' },
      { id: 'appsec-engineer', title: 'Application Security Engineer', description: 'OWASP Top 10, SAST/DAST, Threat Modeling, and Secure Code Review', icon: 'verified_user' },
      { id: 'cybersecurity-eng', title: 'Cybersecurity Engineer', description: 'Penetration Testing, Cryptography, Network Defense, and Incident Response', icon: 'gavel' }
    ]
  },
  {
    id: 'other-specialized',
    name: 'Specialized Engineering',
    description: 'Embedded, systems programming, game development, and emerging tech',
    roles: [
      { id: 'embedded-eng', title: 'Embedded Software Engineer', description: 'C/C++, Microcontrollers, RTOS, Memory Constraints, and Hardware Protocols', icon: 'memory' },
      { id: 'systems-programmer', title: 'Systems Programmer', description: 'Rust, C, POSIX APIs, Memory Safety, File Systems, and Low-Level I/O', icon: 'terminal' },
      { id: 'game-developer', title: 'Game Developer', description: 'Unity, Unreal Engine, Game Loops, Shaders, Physics, and 60fps Optimization', icon: 'sports_esports' },
      { id: 'blockchain-dev', title: 'Blockchain Developer', description: 'Solidity, Smart Contracts, EVM, Consensus, and Web3 Architecture', icon: 'currency_bitcoin' },
      { id: 'firmware-engineer', title: 'Firmware Engineer', description: 'Bootloaders, Device Drivers, SPI/I2C/UART, and Hardware Bring-up', icon: 'precision_manufacturing' }
    ]
  }
];

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    id: 'prog-fundamentals',
    name: 'Programming Fundamentals',
    icon: 'code',
    description: 'Core programming constructs, memory, OOP, and type systems',
    topics: [
      {
        id: 'var-types',
        name: 'Variables & Data Types',
        description: 'Primitive vs reference types, immutability, pass-by-value vs reference',
        subtopics: [
          { id: 'prim-ref', name: 'Primitives vs Reference Types' },
          { id: 'type-coercion', name: 'Implicit vs Explicit Coercion' },
          { id: 'memory-alloc', name: 'Stack vs Heap Memory' }
        ]
      },
      {
        id: 'oop-fp',
        name: 'OOP & Functional Programming',
        description: 'Encapsulation, inheritance, polymorphism, pure functions, and immutability',
        subtopics: [
          { id: 'solid-principles', name: 'SOLID Principles in Practice' },
          { id: 'composition-over-inheritance', name: 'Composition over Inheritance' },
          { id: 'pure-functions', name: 'Pure Functions & Side Effect Isolation' }
        ]
      },
      {
        id: 'concurrency-threads',
        name: 'Concurrency & Multithreading',
        description: 'Threads, processes, locks, deadlocks, and async concurrency models',
        subtopics: [
          { id: 'threads-vs-processes', name: 'Processes vs Threads' },
          { id: 'race-conditions', name: 'Race Conditions & Mutexes' },
          { id: 'async-event-driven', name: 'Event-driven vs Thread-per-request' }
        ]
      }
    ]
  },
  {
    id: 'html-css',
    name: 'HTML & CSS Architecture',
    icon: 'web',
    description: 'Semantic markup, modern layout models, accessibility, and CSS architecture',
    topics: [
      {
        id: 'css-layout',
        name: 'CSS Flexbox & Grid',
        description: '1D vs 2D layout models, alignment, responsive sizing, and subgrid',
        subtopics: [
          { id: 'flex-grid-comparison', name: 'Flexbox vs CSS Grid Decision Matrix' },
          { id: 'auto-fit-fill', name: 'Responsive Grid without Media Queries' }
        ]
      },
      {
        id: 'browser-rendering-pipeline',
        name: 'Browser Rendering & Core Web Vitals',
        description: 'DOM/CSSOM, Layout reflow, paint, composite layers, and LCP/INP/CLS metrics',
        subtopics: [
          { id: 'reflow-repaint', name: 'Reflow vs Repaint Triggers' },
          { id: 'gpu-layers', name: 'GPU Acceleration & Composite Layers' },
          { id: 'cwv-opt', name: 'Optimizing LCP, INP & CLS' }
        ]
      },
      {
        id: 'accessibility-a11y',
        name: 'Web Accessibility & WAI-ARIA',
        description: 'Semantic HTML, focus management, screen readers, and WCAG standards',
        subtopics: [
          { id: 'semantic-html', name: 'Semantic Elements vs Div Soup' },
          { id: 'aria-roles', name: 'WAI-ARIA Roles, States, and Attributes' },
          { id: 'focus-trap', name: 'Accessible Modal Focus Trapping' }
        ]
      }
    ]
  },
  {
    id: 'javascript-typescript',
    name: 'JavaScript & TypeScript',
    icon: 'javascript',
    description: 'Event loop, closures, prototypes, async patterns, and advanced type systems',
    topics: [
      {
        id: 'event-loop',
        name: 'Event Loop & Task Queues',
        description: 'Call stack, microtasks (Promises), macrotasks (setTimeout/I/O), and rendering turns',
        subtopics: [
          { id: 'micro-vs-macro', name: 'Microtasks vs Macrotasks Scheduling' },
          { id: 'request-animation-frame', name: 'rAF vs Microtask Queue Execution' }
        ]
      },
      {
        id: 'closures-scope',
        name: 'Closures & Execution Context',
        description: 'Lexical scoping, memory retention, module patterns, and stale closures',
        subtopics: [
          { id: 'stale-closures', name: 'Identifying & Remediating Stale Closures' },
          { id: 'memory-leaks', name: 'Closure-related Memory Leak Detection' }
        ]
      },
      {
        id: 'ts-advanced-types',
        name: 'Advanced TypeScript Systems',
        description: 'Generics, conditional types, mapped types, template literals, and narrowing',
        subtopics: [
          { id: 'conditional-types', name: 'infer keyword & Conditional Types' },
          { id: 'type-guards', name: 'Discriminated Unions & Custom Type Guards' }
        ]
      }
    ]
  },
  {
    id: 'react-ecosystem',
    name: 'React & Modern Frontend',
    icon: 'layers',
    description: 'Hooks, Concurrent Mode, Reconciliation, State Machines, and Hydration',
    topics: [
      {
        id: 'react-hooks-internals',
        name: 'Hooks Internals & Rules',
        description: 'useEffect vs useLayoutEffect, dependency arrays, and custom hook design',
        subtopics: [
          { id: 'effect-timing', name: 'Browser Paint Synchronization' },
          { id: 'cleanup-lifecycle', name: 'Effect Cleanup & Race Condition Mitigation' }
        ]
      },
      {
        id: 'react-reconciliation',
        name: 'Reconciliation & Concurrent Mode',
        description: 'Fiber architecture, virtual DOM diffing, useTransition, and Suspense',
        subtopics: [
          { id: 'fiber-tree', name: 'Fiber WorkLoop & Priority Schedulers' },
          { id: 'use-transition', name: 'Non-blocking UI Updates with useTransition' }
        ]
      },
      {
        id: 'state-architecture',
        name: 'Client State Architecture',
        description: 'Server cache (TanStack Query) vs client UI state (Zustand/Redux) vs URL state',
        subtopics: [
          { id: 'server-vs-client-state', name: 'Separation of Server Cache vs UI State' },
          { id: 'optimistic-updates', name: 'Optimistic UI Updates with Rollback' }
        ]
      }
    ]
  },
  {
    id: 'backend-architecture',
    name: 'Backend & API Architecture',
    icon: 'dns',
    description: 'REST, GraphQL, gRPC, authentication, caching, and microservice patterns',
    topics: [
      {
        id: 'api-design',
        name: 'RESTful API & GraphQL Design',
        description: 'Idempotency, HTTP status contracts, GraphQL resolvers, and N+1 query problem',
        subtopics: [
          { id: 'rest-idempotency', name: 'Idempotent Mutation Design with Unique Keys' },
          { id: 'graphql-dataloader', name: 'Batching Resolvers with DataLoader' }
        ]
      },
      {
        id: 'auth-security',
        name: 'Authentication & Session Architecture',
        description: 'JWT with Refresh Token Rotation, HttpOnly cookies, OAuth2/OIDC, and CSRF',
        subtopics: [
          { id: 'token-rotation', name: 'Refresh Token Rotation & Reuse Detection' },
          { id: 'csrf-protection', name: 'SameSite Cookies & Double-Submit CSRF Defense' }
        ]
      },
      {
        id: 'microservices-patterns',
        name: 'Microservice Communication Patterns',
        description: 'Synchronous REST/gRPC vs Event-driven Message Brokers (Kafka, RabbitMQ)',
        subtopics: [
          { id: 'outbox-pattern', name: 'Transactional Outbox Pattern for Distributed Consistency' },
          { id: 'saga-pattern', name: 'Choreographed vs Orchestrated Sagas' }
        ]
      }
    ]
  },
  {
    id: 'databases-storage',
    name: 'Databases & Storage Engines',
    icon: 'database',
    description: 'B-Trees vs LSM, SQL query plans, ACID isolation, indexing, and NoSQL',
    topics: [
      {
        id: 'sql-query-tuning',
        name: 'SQL Indexing & Query Plans',
        description: 'B+Tree composite indexes, covering indexes, EXPLAIN ANALYZE, and sequential scans',
        subtopics: [
          { id: 'composite-indexes', name: 'Leftmost Prefix Rule & Multi-column Indexes' },
          { id: 'query-plan-analysis', name: 'Reading EXPLAIN ANALYZE Cost & Filter Nodes' }
        ]
      },
      {
        id: 'acid-transactions',
        name: 'ACID & Isolation Levels',
        description: 'Read Committed vs Repeatable Read vs Serializable, dirty reads, and MVCC',
        subtopics: [
          { id: 'mvcc-internals', name: 'Multi-Version Concurrency Control (MVCC) Mechanics' },
          { id: 'deadlock-mitigation', name: 'Deadlock Detection & Consistent Lock Ordering' }
        ]
      },
      {
        id: 'storage-engines',
        name: 'Storage Engines: B-Tree vs LSM-Tree',
        description: 'Write amplification, SSTables, write-ahead logs (WAL), and compaction algorithms',
        subtopics: [
          { id: 'lsm-architecture', name: 'MemTable, WAL & Leveled Compaction' },
          { id: 'write-amplification', name: 'Read vs Write Trade-offs across Storage Engines' }
        ]
      }
    ]
  },
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    icon: 'timeline',
    description: 'Algorithmic problem solving, complexity analysis, and pattern recognition',
    topics: [
      {
        id: 'array-string-patterns',
        name: 'Two Pointers & Sliding Window',
        description: 'Subarray bounds, fast/slow pointers, and dynamic window expansions',
        subtopics: [
          { id: 'sliding-window-dynamic', name: 'Dynamic Size Sliding Window for Substrings' },
          { id: 'two-pointers-in-place', name: 'In-place Array Transformation Techniques' }
        ]
      },
      {
        id: 'trees-graphs',
        name: 'Trees & Graph Traversals',
        description: 'DFS/BFS, Dijkstra, Topological Sort, and Tree Serialization',
        subtopics: [
          { id: 'topological-sort', name: 'Kahn Algorithm & Cycle Detection in DAGs' },
          { id: 'lowest-common-ancestor', name: 'LCA in Binary Search Trees vs Generic Trees' }
        ]
      },
      {
        id: 'dynamic-programming',
        name: 'Dynamic Programming & Memoization',
        description: 'Overlapping subproblems, optimal substructure, top-down vs bottom-up',
        subtopics: [
          { id: 'state-transition', name: 'Formulating DP State Transitions & Base Cases' },
          { id: 'space-optimization', name: 'Rolling Array Space Optimization' }
        ]
      }
    ]
  },
  {
    id: 'system-design',
    name: 'System Design & High Scale',
    icon: 'schema',
    description: 'Architecting distributed systems handling millions of users and high throughput',
    topics: [
      {
        id: 'distributed-caching',
        name: 'Distributed Caching Strategies',
        description: 'Cache-Aside, Write-Through, Write-Behind, Cache Invalidation, and Stampede',
        subtopics: [
          { id: 'cache-stampede', name: 'Thundering Herd Mitigation (Mutexes, Probabilistic Early Expiration)' },
          { id: 'consistent-hashing', name: 'Consistent Hashing with Virtual Nodes' }
        ]
      },
      {
        id: 'rate-limiting',
        name: 'Rate Limiting & Traffic Shaping',
        description: 'Token Bucket, Leaky Bucket, Sliding Window Counter, and Redis Lua scripts',
        subtopics: [
          { id: 'token-bucket-algo', name: 'Token Bucket vs Leaky Bucket Mechanics' },
          { id: 'distributed-rate-limiter', name: 'Distributed Rate Limiting with Redis & Fallback' }
        ]
      },
      {
        id: 'event-driven-streaming',
        name: 'Event-Driven Architecture & Message Queues',
        description: 'At-least-once vs Exactly-once semantics, Kafka consumer groups, and dead-letter queues',
        subtopics: [
          { id: 'kafka-partitioning', name: 'Partition Keys, Ordering Guarantees & Rebalancing' },
          { id: 'idempotent-consumers', name: 'Designing Idempotent Event Consumers' }
        ]
      }
    ]
  },
  {
    id: 'devops-cloud',
    name: 'DevOps, Containers & Cloud',
    icon: 'cloud',
    description: 'Docker, Kubernetes, CI/CD, Terraform, and cloud infrastructure patterns',
    topics: [
      {
        id: 'container-internals',
        name: 'Docker & Containerization',
        description: 'Linux namespaces, cgroups, multi-stage builds, and non-root security',
        subtopics: [
          { id: 'multi-stage-dockerfile', name: 'Optimizing Image Size with Multi-stage Builds' },
          { id: 'container-isolation', name: 'Namespaces & Control Groups (cgroups) Deep Dive' }
        ]
      },
      {
        id: 'k8s-architecture',
        name: 'Kubernetes Orchestration',
        description: 'Control plane, Kubelet, Pod lifecycles, Services (ClusterIP/NodePort), and Ingress',
        subtopics: [
          { id: 'k8s-networking', name: 'Pod-to-Pod CNI & Service Mesh Basics' },
          { id: 'rolling-updates', name: 'Rolling Updates, Readiness vs Liveness Probes' }
        ]
      },
      {
        id: 'ci-cd-iac',
        name: 'CI/CD Pipelines & Infrastructure as Code',
        description: 'GitOps, Canary vs Blue/Green deployments, Terraform state management',
        subtopics: [
          { id: 'blue-green-deploy', name: 'Blue/Green vs Canary Traffic Shifting' },
          { id: 'terraform-drift', name: 'Managing Remote State, Locks & Drift Detection' }
        ]
      }
    ]
  },
  {
    id: 'ai-mlops',
    name: 'AI Engineering & MLOps',
    icon: 'smart_toy',
    description: 'LLM applications, RAG pipelines, fine-tuning, vector search, and model serving',
    topics: [
      {
        id: 'rag-architecture',
        name: 'RAG (Retrieval-Augmented Generation)',
        description: 'Dense vs sparse retrieval, chunking strategies, hybrid search, and re-ranking',
        subtopics: [
          { id: 'chunking-strategies', name: 'Semantic vs Recursive Chunking Trade-offs' },
          { id: 'hybrid-search-reranking', name: 'Reciprocal Rank Fusion (RRF) & Cross-encoders' }
        ]
      },
      {
        id: 'llm-fine-tuning',
        name: 'Parameter-Efficient Fine-Tuning (PEFT)',
        description: 'LoRA, QLoRA, rank decomposition, 4-bit NormalFloat (NF4), and RLHF/DPO',
        subtopics: [
          { id: 'lora-mechanics', name: 'Low-Rank Adaptation Matrix Decomposition' },
          { id: 'quantization-precision', name: 'FP16 vs INT8 vs NF4 Precision Trade-offs' }
        ]
      },
      {
        id: 'llm-serving-inference',
        name: 'High-Throughput Model Serving',
        description: 'PagedAttention (vLLM), continuous dynamic batching, KV caching, and speculative decoding',
        subtopics: [
          { id: 'paged-attention', name: 'Virtual Memory Paging for KV Cache' },
          { id: 'continuous-batching', name: 'Iteration-level Dynamic Batching' }
        ]
      }
    ]
  },
  {
    id: 'security-quality',
    name: 'Security & Quality Engineering',
    icon: 'security',
    description: 'OWASP vulnerabilities, cryptographic fundamentals, and test automation strategy',
    topics: [
      {
        id: 'owasp-top-10',
        name: 'OWASP Web Security',
        description: 'Stored vs Reflected XSS, SQL Injection prevention, IDOR, and SSRF attacks',
        subtopics: [
          { id: 'xss-mitigation', name: 'Context-Aware Output Encoding & Content Security Policy (CSP)' },
          { id: 'idor-prevention', name: 'Object-Level Authorization & Access Control Checks' }
        ]
      },
      {
        id: 'test-pyramids',
        name: 'Testing Strategies & Test Doubles',
        description: 'Unit vs Integration vs E2E, Mocks vs Stubs vs Spies, and Test-Driven Development',
        subtopics: [
          { id: 'mocking-guidelines', name: 'When to Mock vs Test against Real Dependencies' },
          { id: 'contract-testing', name: 'Consumer-Driven Contract Testing with Pact' }
        ]
      }
    ]
  },
  {
    id: 'behavioral-leadership',
    name: 'Behavioral & Engineering Leadership',
    icon: 'psychology_alt',
    description: 'STAR methodology, technical conflict resolution, trade-offs, and mentoring',
    topics: [
      {
        id: 'star-framework',
        name: 'STAR Response Delivery',
        description: 'Situation, Task, Action (what YOU did), and quantifiable Result metrics',
        subtopics: [
          { id: 'quantifying-impact', name: 'Framing Engineering Metrics (Latency, Throughput, Cost)' },
          { id: 'ownership-delivery', name: 'Demonstrating Accountability in Ambiguous Scenarios' }
        ]
      },
      {
        id: 'technical-conflict',
        name: 'Technical Disagreement & Trade-offs',
        description: 'Navigating conflicting architectural opinions, consensus building, and Disagree & Commit',
        subtopics: [
          { id: 'disagree-and-commit', name: 'Balancing Principled Debates with Engineering Velocity' },
          { id: 'post-mortem-culture', name: 'Blameless Post-Mortems & Incident Learnings' }
        ]
      }
    ]
  }
];

export const ROLE_LEARNING_PATHS: Record<string, RoleLearningPath> = {
  'frontend-dev': {
    roleId: 'frontend-dev',
    roleTitle: 'Frontend Developer',
    description: 'Structured roadmap from browser rendering and JavaScript internals to high-scale React architecture and Web Vitals.',
    stages: [
      {
        stage: 1,
        title: 'Core Fundamentals & Browser Mechanics',
        description: 'Master semantic layout, CSS Box Model, DOM rendering pipeline, and modern JavaScript semantics.',
        topics: [
          { id: 'lp-fe-1', title: 'CSS Box Model & Reflow Mechanics', category: 'HTML & CSS Architecture', description: 'Understand how layout recalculation, paint, and GPU composite layers affect 60fps rendering.', difficulty: 'Beginner', estimatedHours: 4, prerequisites: [], questionIds: ['fe-2', 'fe-10'] },
          { id: 'lp-fe-2', title: 'JavaScript Event Loop & Microtasks', category: 'JavaScript & TypeScript', description: 'Deconstruct call stack, microtask queue (Promises), and macrotask scheduling in V8.', difficulty: 'Intermediate', estimatedHours: 5, prerequisites: ['lp-fe-1'], questionIds: ['fe-6', 'js-1'] },
          { id: 'lp-fe-3', title: 'Closures & Execution Context', category: 'JavaScript & TypeScript', description: 'Master lexical scope, memory retention, and avoiding stale closures in event listeners.', difficulty: 'Intermediate', estimatedHours: 4, prerequisites: ['lp-fe-2'], questionIds: ['fe-7', 'js-2'] }
        ]
      },
      {
        stage: 2,
        title: 'React Architecture & State Patterns',
        description: 'Deep dive into React 18/19 Hooks lifecycle, concurrent rendering, and server cache management.',
        topics: [
          { id: 'lp-fe-4', title: 'useEffect vs useLayoutEffect', category: 'React & Modern Frontend', description: 'Learn render timing, paint synchronization, and preventing DOM mutation flicker.', difficulty: 'Intermediate', estimatedHours: 6, prerequisites: ['lp-fe-3'], questionIds: ['fe-1', 'fe-11'] },
          { id: 'lp-fe-5', title: 'Fiber Architecture & Reconciliation', category: 'React & Modern Frontend', description: 'How virtual DOM diffing, keys, and Fiber work loops execute concurrent tasks.', difficulty: 'Advanced', estimatedHours: 8, prerequisites: ['lp-fe-4'], questionIds: ['fe-8', 'fe-12'] },
          { id: 'lp-fe-6', title: 'Server Cache vs Client State', category: 'React & Modern Frontend', description: 'Architect clean boundaries between TanStack Query server caches and client UI state.', difficulty: 'Intermediate', estimatedHours: 5, prerequisites: ['lp-fe-4'], questionIds: ['fe-9', 'fs-4'] }
        ]
      },
      {
        stage: 3,
        title: 'High Scale, Web Vitals & Production Delivery',
        description: 'Master Core Web Vitals (LCP, INP, CLS), SSR/SSG trade-offs, and client-side memory profiling.',
        topics: [
          { id: 'lp-fe-7', title: 'CSR vs SSR vs SSG Architecture', category: 'HTML & CSS Architecture', description: 'Evaluate TTI, LCP, hydration overhead, and caching strategies across rendering modes.', difficulty: 'Advanced', estimatedHours: 6, prerequisites: ['lp-fe-5'], questionIds: ['fe-3', 'fs-5'] },
          { id: 'lp-fe-8', title: 'Profiling Memory Leaks in Single-Page Apps', category: 'JavaScript & TypeScript', description: 'Use Chrome DevTools heap snapshots to identify detached DOM nodes and listener leaks.', difficulty: 'Advanced', estimatedHours: 7, prerequisites: ['lp-fe-3', 'lp-fe-5'], questionIds: ['fe-4', 'fe-14'] },
          { id: 'lp-fe-9', title: 'Core Web Vitals Optimization (INP & LCP)', category: 'HTML & CSS Architecture', description: 'Optimize Interaction to Next Paint and Largest Contentful Paint for enterprise applications.', difficulty: 'Advanced', estimatedHours: 6, prerequisites: ['lp-fe-7'], questionIds: ['fe-5', 'fe-15'] }
        ]
      }
    ]
  },
  'backend-dev': {
    roleId: 'backend-dev',
    roleTitle: 'Backend Developer',
    description: 'Roadmap from API contract design and SQL query optimization to distributed systems and asynchronous message streaming.',
    stages: [
      {
        stage: 1,
        title: 'API Fundamentals, Network & Data Contracts',
        description: 'Design robust RESTful APIs, master HTTP status semantics, and implement secure token authentication.',
        topics: [
          { id: 'lp-be-1', title: 'RESTful API Contracts & Idempotency', category: 'Backend & API Architecture', description: 'Design clean REST endpoints with unique mutation idempotency keys and error contracts.', difficulty: 'Beginner', estimatedHours: 4, prerequisites: [], questionIds: ['fs-1', 'be-1'] },
          { id: 'lp-be-2', title: 'JWT Authentication & Refresh Token Rotation', category: 'Backend & API Architecture', description: 'Implement HttpOnly cookies, refresh token families, and automatic reuse detection.', difficulty: 'Intermediate', estimatedHours: 6, prerequisites: ['lp-be-1'], questionIds: ['fs-2', 'be-2'] },
          { id: 'lp-be-3', title: 'SQL Indexing & Execution Plans', category: 'Databases & Storage Engines', description: 'Master B+Tree composite index rules and interpret EXPLAIN ANALYZE queries.', difficulty: 'Intermediate', estimatedHours: 6, prerequisites: [], questionIds: ['db-1', 'db-2'] }
        ]
      },
      {
        stage: 2,
        title: 'Database Concurrency, ACID & Caching',
        description: 'Understand transactional isolation levels, MVCC mechanics, and distributed caching patterns.',
        topics: [
          { id: 'lp-be-4', title: 'ACID Isolation Levels & Deadlocks', category: 'Databases & Storage Engines', description: 'Deep dive into Read Committed, Repeatable Read, Serializable, and MVCC.', difficulty: 'Advanced', estimatedHours: 7, prerequisites: ['lp-be-3'], questionIds: ['db-3', 'db-4'] },
          { id: 'lp-be-5', title: 'B-Tree vs LSM Storage Engines', category: 'Databases & Storage Engines', description: 'Understand write amplification, WAL, and compaction in RocksDB vs Postgres.', difficulty: 'Advanced', estimatedHours: 6, prerequisites: ['lp-be-3'], questionIds: ['fs-3', 'db-5'] },
          { id: 'lp-be-6', title: 'Distributed Caching & Stampede Mitigation', category: 'System Design & High Scale', description: 'Implement Cache-Aside with Redis, probabilistic early expiration, and mutexes.', difficulty: 'Intermediate', estimatedHours: 5, prerequisites: ['lp-be-1'], questionIds: ['sd-1', 'be-4'] }
        ]
      },
      {
        stage: 3,
        title: 'Distributed Systems & Event-Driven Streaming',
        description: 'Design resilient microservice architectures using Kafka, Outbox patterns, and distributed rate limiting.',
        topics: [
          { id: 'lp-be-7', title: 'Transactional Outbox & Sagas', category: 'Backend & API Architecture', description: 'Ensure dual-write consistency between databases and message brokers without 2PC.', difficulty: 'Advanced', estimatedHours: 8, prerequisites: ['lp-be-4', 'lp-be-6'], questionIds: ['be-3', 'sd-3'] },
          { id: 'lp-be-8', title: 'Distributed Rate Limiting with Token Bucket', category: 'System Design & High Scale', description: 'Architect high-throughput rate limiters using Redis sliding window counters and Lua.', difficulty: 'Advanced', estimatedHours: 6, prerequisites: ['lp-be-6'], questionIds: ['sd-2', 'be-5'] },
          { id: 'lp-be-9', title: 'Kafka Partitioning & Ordering Guarantees', category: 'System Design & High Scale', description: 'Design event streaming pipelines with consumer groups and idempotent processing.', difficulty: 'Advanced', estimatedHours: 7, prerequisites: ['lp-be-7'], questionIds: ['sd-4', 'be-6'] }
        ]
      }
    ]
  },
  'ai-ml-engineer': {
    roleId: 'ai-ml-engineer',
    roleTitle: 'AI / ML Engineer',
    description: 'Roadmap from Transformer attention mechanics and RAG pipelines to LoRA fine-tuning and high-scale inference serving.',
    stages: [
      {
        stage: 1,
        title: 'Foundations of Modern Deep Learning & Attention',
        description: 'Deconstruct multi-head self-attention, embedding vector spaces, and feature pipeline engineering.',
        topics: [
          { id: 'lp-ai-1', title: 'Multi-Head Attention & FlashAttention', category: 'AI Engineering & MLOps', description: 'Analyze memory-bound IO complexity in standard attention and how FlashAttention tiles SRAM.', difficulty: 'Intermediate', estimatedHours: 6, prerequisites: [], questionIds: ['ai-1', 'ai-2'] },
          { id: 'lp-ai-2', title: 'Embeddings & Vector Indexing', category: 'AI Engineering & MLOps', description: 'Compare HNSW vs IVF-PQ vector index trade-offs and cosine similarity scaling.', difficulty: 'Intermediate', estimatedHours: 5, prerequisites: ['lp-ai-1'], questionIds: ['ai-3', 'ai-7'] },
          { id: 'lp-ai-3', title: 'Feature Store Skew & Covariate Drift', category: 'AI Engineering & MLOps', description: 'Detect and mitigate training-serving skew and distribution drift in production ML.', difficulty: 'Intermediate', estimatedHours: 4, prerequisites: [], questionIds: ['ai-4', 'ai-8'] }
        ]
      },
      {
        stage: 2,
        title: 'Production RAG & Model Fine-Tuning',
        description: 'Architect resilient retrieval pipelines, hybrid search, and parameter-efficient fine-tuning (PEFT/LoRA).',
        topics: [
          { id: 'lp-ai-4', title: 'Hybrid RAG Search & Re-ranking', category: 'AI Engineering & MLOps', description: 'Combine dense vector retrieval with BM25 lexical search using Reciprocal Rank Fusion.', difficulty: 'Advanced', estimatedHours: 7, prerequisites: ['lp-ai-2'], questionIds: ['ai-5', 'ai-9'] },
          { id: 'lp-ai-5', title: 'LoRA & QLoRA Parameter-Efficient Fine-Tuning', category: 'AI Engineering & MLOps', description: 'Rank decomposition, freezing base weights, and 4-bit NormalFloat quantization.', difficulty: 'Advanced', estimatedHours: 8, prerequisites: ['lp-ai-1'], questionIds: ['ai-6', 'ai-10'] },
          { id: 'lp-ai-6', title: 'LLM Evaluation & Alignment (RLHF / DPO)', category: 'AI Engineering & MLOps', description: 'Evaluate hallucinations, benchmark RAG systems, and align models with Direct Preference Optimization.', difficulty: 'Advanced', estimatedHours: 6, prerequisites: ['lp-ai-5'], questionIds: ['ai-11', 'ai-12'] }
        ]
      },
      {
        stage: 3,
        title: 'Inference Serving & High-Throughput Systems',
        description: 'Scale LLM inference with PagedAttention, continuous batching, and KV cache optimizations.',
        topics: [
          { id: 'lp-ai-7', title: 'PagedAttention & Virtual KV Memory', category: 'AI Engineering & MLOps', description: 'How vLLM eliminates internal KV cache memory fragmentation using OS paging concepts.', difficulty: 'Advanced', estimatedHours: 8, prerequisites: ['lp-ai-1'], questionIds: ['ai-13', 'ai-14'] },
          { id: 'lp-ai-8', title: 'Continuous Dynamic Batching & Speculative Decoding', category: 'AI Engineering & MLOps', description: 'Maximize GPU tensor core utilization with iteration-level dynamic batching.', difficulty: 'Advanced', estimatedHours: 7, prerequisites: ['lp-ai-7'], questionIds: ['ai-15', 'ai-16'] }
        ]
      }
    ]
  }
};
