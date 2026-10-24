import { QuestionItem } from '../../types';

export const DATABASE_QUESTIONS: QuestionItem[] = [
  {
    id: 'db-1',
    slug: 'sql-b-tree-composite-indexing-rules',
    title: 'How do composite B+Tree indexes work, and why does the Leftmost Prefix Rule dictate query performance?',
    questionText: 'Given an index on (tenant_id, status, created_at), analyze which WHERE clauses use the index, which trigger partial range scans, and how covering indexes eliminate heap lookups.',
    category: 'Databases & Storage Engines',
    categoryId: 'databases-storage',
    topicId: 'sql-query-tuning',
    subtopicId: 'composite-indexes',
    difficulty: 'Medium',
    questionType: 'Database Query',
    roleTarget: 'Database Administrator',
    roleIds: ['sql-developer', 'database-admin', 'backend-dev', 'fullstack-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Explain multi-column index lexicographical ordering, index range scans, covering index Index-Only Scans, and index selectivity.',
    shortAnswer: 'Composite B+Tree indexes sort keys lexicographically in order: column A first, then column B within identical values of A, then column C within identical values of A and B. The Leftmost Prefix Rule states that an index query must utilize the leading column (A) to traverse the tree. Range operators (<, >, BETWEEN) on column B prevent the index from using subsequent columns (C) for direct lookups. A Covering Index includes all query columns, enabling an Index-Only Scan that skips table heap lookups entirely.',
    detailedAnswer: '1. **Physical Layout of a B+Tree Index**:\n   All data pointers reside exclusively on leaf nodes connected via a doubly linked list. In a composite index `(tenant_id, status, created_at)`, keys are sorted sequentially:\n   `[101, \'ACTIVE\', \'2026-01-01\'] -> [101, \'ACTIVE\', \'2026-01-02\'] -> [101, \'PENDING\', \'2026-01-01\'] -> [102, \'ACTIVE\', \'2026-01-01\']`.\n\n2. **The Leftmost Prefix Rule in Action**:\n   - `WHERE tenant_id = 101 AND status = \'ACTIVE\'`: Uses columns 1 and 2 directly to jump to the leaf node via tree traversal (Index Seek).\n   - `WHERE status = \'ACTIVE\'`: CANNOT traverse the tree directly because values are grouped primarily by `tenant_id`. It must either do an Index Full Scan or a Table Sequential Scan.\n   - `WHERE tenant_id = 101 AND status LIKE \'ACT%\' AND created_at > \'2026-01-01\'`: Columns 1 and 2 use the index. However, because column 2 is an open range, column 3 (`created_at`) cannot be used for direct tree navigation—it can only filter rows after the range.\n\n3. **Covering Indexes & Index-Only Scans**:\n   When a query performs `SELECT tenant_id, status, created_at FROM orders WHERE tenant_id = 101`, the database engine finds every requested column directly inside the index leaf nodes. It completely avoids accessing the table heap pages (Index-Only Scan), reducing random disk I/O by orders of magnitude.',
    codeExample: {
      language: 'sql',
      code: `-- 1. Create optimal composite index with Leftmost Prefix ordering
CREATE INDEX idx_orders_tenant_status_created 
ON orders (tenant_id, status, created_at) 
INCLUDE (total_amount); -- PostgreSQL Covering Index with INCLUDE

-- 2. Fully optimized query: Index-Only Scan (Zero Table Heap Lookups)
EXPLAIN ANALYZE
SELECT tenant_id, status, created_at, total_amount
FROM orders
WHERE tenant_id = 42 AND status = 'COMPLETED'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Query that violates Leftmost Prefix (triggers slow Seq Scan or full index scan)
EXPLAIN ANALYZE
SELECT * FROM orders WHERE status = 'COMPLETED';`,
      explanation: 'Using INCLUDE adds total_amount to leaf nodes for covering queries without increasing the composite B+Tree branch index size.'
    },
    commonMistakes: [
      'Creating separate single-column indexes on `tenant_id`, `status`, and `created_at`, forcing the query planner to either choose one or perform expensive Bitmap Index Scans.',
      'Putting a low-selectivity column with range queries at the front of a composite index (e.g. `(created_at, tenant_id)`).',
      'Using SQL functions on indexed columns (`WHERE YEAR(created_at) = 2026`), which disables B+Tree index lookups and forces a full table scan.'
    ],
    realWorldUseCases: [
      'Multi-tenant SaaS databases (Shopify, Slack) where almost every single query is scoped by `tenant_id` or `workspace_id`.',
      'Pagination queries (`ORDER BY created_at LIMIT 50`) avoiding costly in-memory sorts.'
    ],
    tradeOffs: [
      'Every additional composite index speeds up reads but incurs write amplification overhead on INSERT, UPDATE, and DELETE queries.'
    ],
    followUpQuestions: [
      'How does PostgreSQL Bitmap Heap Scan work when combining two independent indexes?',
      'What are Partial Indexes (WHERE clause on index definition), and when should you use them?'
    ],
    relatedQuestionIds: ['db-2', 'fs-3'],
    tags: ['Databases', 'SQL', 'PostgreSQL', 'Indexing', 'B+Tree'],
    keywords: ['composite index', 'leftmost prefix', 'B-Tree', 'Index-Only Scan', 'covering index', 'EXPLAIN ANALYZE'],
    companies: ['Amazon AWS', 'Datadog', 'Snowflake', 'Stripe'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 85%',
    isBookmarked: false
  },
  {
    id: 'db-2',
    slug: 'acid-isolation-levels-mvcc-deadlocks',
    title: 'Explain ACID transaction isolation levels, Multi-Version Concurrency Control (MVCC), and deadlock resolution in relational engines.',
    questionText: 'Compare Read Committed, Repeatable Read, and Serializable. How does Postgres prevent dirty reads without table locks, and how are deadlocks resolved?',
    category: 'Databases & Storage Engines',
    categoryId: 'databases-storage',
    topicId: 'acid-transactions',
    subtopicId: 'acid-isolation-levels',
    difficulty: 'Hard',
    questionType: 'Conceptual',
    roleTarget: 'Database Administrator',
    roleIds: ['database-admin', 'backend-dev', 'sql-developer'],
    estimatedTime: '5 mins response',
    estimatedMinutes: 5,
    description: 'Deconstruct dirty reads, non-repeatable reads, phantom reads, write skew, MVCC snapshot visibility, and lock order deadlock prevention.',
    shortAnswer: 'The 4 standard SQL isolation levels are Read Uncommitted, Read Committed, Repeatable Read, and Serializable. Modern engines like PostgreSQL achieve high concurrency via MVCC (Multi-Version Concurrency Control) instead of read locks: readers never block writers, and writers never block readers. Rows store transaction IDs (`xmin`/`xmax`); a snapshot determines visibility. Deadlocks occur when two transactions hold locks each other needs; engines detect them with wait-for cycle graphs and abort the cheaper transaction.',
    detailedAnswer: '1. **Read Phenomena & Isolation Levels**:\n   - *Read Committed* (Default in Postgres): Reads see only data committed before the individual statement began. Prevents Dirty Reads. Subject to Non-Repeatable Reads (reading the same row twice in one transaction yields different values if another commits midway).\n   - *Repeatable Read*: The entire transaction reads from a single static snapshot established at the start of the transaction. Prevents Dirty and Non-Repeatable Reads.\n   - *Serializable*: Eliminates Phantom Reads and Write Skew anomalies using Serializable Snapshot Isolation (SSI) by tracking predicate lock dependencies (SIREAD locks).\n\n2. **MVCC Internal Mechanics**:\n   When a row is updated in PostgreSQL, the old row is NOT overwritten. Instead, the engine writes a new row version with `xmin = current_tx_id` and stamps the old row\'s `xmax = current_tx_id`. A transaction uses its Snapshot (active transaction list) to evaluate whether a row version is visible. Outdated versions are reclaimed asynchronously by the `VACUUM` process.\n\n3. **Deadlock Detection & Resolution**:\n   A deadlock occurs when Tx1 locks Row A and requests Row B, while Tx2 locks Row B and requests Row A. PostgreSQL uses a background timer (`deadlock_timeout`, default 1s) to inspect its lock wait-for dependency graph. When a circular dependency is detected, it raises an error on one transaction and rolls it back, allowing the other to complete.',
    codeExample: {
      language: 'sql',
      code: `-- Deadlock Scenario Demonstration
-- Transaction 1
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1; -- Acquires row lock on 1
-- Interleaved...
UPDATE accounts SET balance = balance + 100 WHERE id = 2; -- Blocks waiting for Tx2!

-- Transaction 2 (Concurrent session)
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 2; -- Acquires row lock on 2
UPDATE accounts SET balance = balance + 50 WHERE id = 1; -- Deadlock detected! Rolled back with 40P01

-- MITIGATION: Always acquire locks in uniform numerical order!
-- Both transactions lock id = MIN(1, 2) first, eliminating circular lock wait graphs.`
    },
    commonMistakes: [
      'Assuming Repeatable Read prevents all race conditions; it prevents phantoms but does not prevent concurrent lost updates unless `SELECT ... FOR UPDATE` or optimistic concurrency checks are used.',
      'Allowing long-running transactions to remain open, which prevents `VACUUM` from cleaning old tuple versions and causes catastrophic database table bloat.',
      'Neglecting to handle deadlock errors (`40P01` in Postgres) with automated application-level retries and exponential backoff.'
    ],
    realWorldUseCases: [
      'Financial ledgers and banking transactions executing high-frequency double-entry balance transfers.',
      'Inventory reservations during flash sales (e-commerce ticket booking).'
    ],
    tradeOffs: [
      'Higher isolation levels (Serializable) eliminate data anomalies completely, but incur higher abort/retry rates under concurrent write contention.'
    ],
    followUpQuestions: [
      'What is Write Skew, and why does standard Repeatable Read permit it while Serializable prevents it?',
      'How does PostgreSQL autovacuum tuning prevent transaction ID wraparound freeze emergencies?'
    ],
    relatedQuestionIds: ['db-1', 'be-3', 'fs-3'],
    tags: ['Databases', 'ACID', 'Transactions', 'MVCC', 'PostgreSQL', 'Deadlocks'],
    keywords: ['ACID', 'MVCC', 'isolation levels', 'Repeatable Read', 'Serializable', 'deadlock', 'xmin', 'VACUUM'],
    companies: ['Stripe', 'Robinhood', 'Coinbase', 'Meta'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 92%',
    isBookmarked: true
  },
  {
    id: 'db-3',
    slug: 'b-tree-vs-lsm-tree-storage-architectures',
    title: 'Compare B-Tree and LSM-tree (Log-Structured Merge) architectures under heavy write-amplification versus point-lookup constraints.',
    questionText: 'Explain why modern write-heavy data stores (Cassandra, RocksDB) favor SSTables and compaction while standard OLTP engines (PostgreSQL, MySQL InnoDB) rely on B+Trees.',
    category: 'Databases & Storage Engines',
    categoryId: 'databases-storage',
    topicId: 'storage-engines',
    subtopicId: 'storage-engines',
    difficulty: 'Medium',
    questionType: 'Trade-off Analysis',
    roleTarget: 'Database Administrator',
    roleIds: ['database-admin', 'backend-dev', 'distributed-systems-eng'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Explain write amplification, sequential disk I/O vs random I/O, MemTable, WAL, SSTables, Bloom filters, and compaction strategies.',
    shortAnswer: 'B+Trees optimize for reads and point-lookups by maintaining an in-place balanced tree on disk, requiring random writes that suffer high write amplification. LSM-Trees (Log-Structured Merge-Trees) optimize for writes by appending updates sequentially to a Write-Ahead Log (WAL) and an in-memory MemTable, then periodically flushing immutable SSTables to disk and merging them via background compaction. LSM-Trees trade read latency (mitigated by Bloom filters) for superior write throughput.',
    detailedAnswer: '1. **B+Tree Mechanics (OLTP Standard: Postgres, MySQL InnoDB)**:\n   - Updates write directly to page blocks in place.\n   - *Reads*: Fast and deterministic. Traversing a 3-level tree requires at most 3 page reads (O(log N)), with root and internal nodes cached in buffer pool memory.\n   - *Writes*: Modifying a single 20-byte row requires writing an entire 8KB or 16KB disk page to storage (high write amplification).\n\n2. **LSM-Tree Mechanics (Write-Optimized: Cassandra, ScyllaDB, RocksDB, Bigtable)**:\n   - *Write Path*: Writes append to an append-only WAL on disk (for durability) and are inserted into a sorted in-memory skiplist/red-black tree (**MemTable**). This is 100% sequential I/O and exceptionally fast.\n   - *Flushing*: When the MemTable reaches size limits (e.g. 64MB), it is flushed to disk as an immutable **SSTable (Sorted String Table)** at Level 0.\n   - *Compaction*: Background threads perform Leveled or Size-Tiered compaction, merging overlapping key ranges and discarding overwritten or tombstoned records.\n   - *Read Optimization*: Because a key could be in multiple SSTables, LSMs use **Bloom Filters** to check if an SSTable definitely does not contain a key, skipping unnecessary disk seeks.',
    codeExample: {
      language: 'text',
      code: `LSM-Tree Write Path:
Client Write -> [Write-Ahead Log (Sequential Disk)] + [MemTable (In-Memory Skiplist)]
                      | (When MemTable fills)
                      v
             [SSTable L0 (Immutable)] -> [SSTable L0]
                      | (Background Compaction)
                      v
             [SSTable L1 (Sorted, Non-Overlapping)]

B+Tree Write Path:
Client Write -> [WAL (Disk)] -> In-Place Page Buffer Dirtying -> Flush 8KB/16KB Random Disk Page`
    },
    commonMistakes: [
      'Believing LSM-Trees never do disk reads during writes; deletes in an LSM write a "tombstone" marker rather than immediately deleting records on disk.',
      'Ignoring compaction write amplification; if background compaction falls behind write volume, write stalls occur.',
      'Using B+Trees for massive event logging or timeseries metrics exceeding hundreds of thousands of inserts per second.'
    ],
    realWorldUseCases: [
      'High-throughput time-series metrics, telemetry, and IoT event ingestion (LSM-trees: Cassandra, InfluxDB, ClickHouse).',
      'Standard relational ACID business transactions with frequent point-lookups and relational foreign keys (B+Trees: PostgreSQL, MySQL).'
    ],
    tradeOffs: [
      'LSM-Trees maximize write throughput and storage compression, but have unpredictable read tail latencies (p99) during heavy background compaction.',
      'B+Trees offer stable, predictable read latencies, but incur heavy disk write wear and random I/O bottlenecks under massive write ingestion.'
    ],
    followUpQuestions: [
      'How does Leveled Compaction differ from Size-Tiered Compaction in Apache Cassandra?',
      'How do Bloom filters prevent disk reads for non-existent keys in RocksDB?'
    ],
    relatedQuestionIds: ['db-1', 'sd-1'],
    tags: ['Storage Engines', 'B-Tree', 'LSM-Tree', 'Databases', 'Cassandra', 'RocksDB'],
    keywords: ['B+Tree', 'LSM-Tree', 'SSTable', 'MemTable', 'write amplification', 'compaction', 'Bloom filter'],
    companies: ['Meta', 'Amazon', 'Datadog', 'Snowflake'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 85%',
    isBookmarked: false
  },
  {
    id: 'db-4',
    slug: 'sql-joins-nested-loop-hash-join-merge-join',
    title: 'SQL Joins & Execution Algorithms: Inner vs Outer Joins, Hash Join vs Nested Loop, and Left Join Pitfalls',
    questionText: 'Explain the conceptual difference between INNER, LEFT, RIGHT, and FULL OUTER joins. How does the database query planner choose between Nested Loop, Hash Join, and Merge Join algorithms under the hood?',
    category: 'Databases & Storage Engines',
    categoryId: 'databases',
    topicId: 'sql-fundamentals',
    subtopicId: 'sql-joins',
    difficulty: 'Medium',
    questionType: 'Database Query',
    roleTarget: 'SQL Developer',
    roleIds: ['sql-developer', 'database-admin', 'backend-dev', 'fullstack-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Master SQL joins semantics, Cartesian explosions, and internal join execution engine physical operators (Nested Loop, Hash Join, Merge Join).',
    shortAnswer: 'Conceptually, an INNER JOIN returns rows with matching keys in both tables; a LEFT (OUTER) JOIN preserves all rows from the left table, padding unmatched right columns with NULL; FULL OUTER preserves all rows from both tables. Physically, query optimizers choose between three join algorithms: 1) **Nested Loop**: Iterates outer rows and probes an inner index, optimal for small filtered datasets; 2) **Hash Join**: Builds an in-memory hash table of the smaller relation and streams the larger table against it in O(M+N) time, optimal for large equi-joins; 3) **Merge Join**: Sorts both tables on join keys and merges them linearly, optimal when tables are pre-sorted by B+Tree indexes.',
    detailedAnswer: '1. **Conceptual Joins vs Cartesian Explosion**:\n   - **INNER JOIN**: Intersection `A ∩ B`. Excludes non-matching records.\n   - **LEFT OUTER JOIN**: Keeps all of A; includes B where keys match, else NULLs.\n   - **CROSS JOIN**: Cartesian product of A x B. A common interview trap occurs when joining on a non-unique foreign key without group-by, accidentally multiplying result row counts exponentially.\n\n2. **Physical Join Execution Engines (EXPLAIN ANALYZE)**:\n   - **Nested Loop Join**: Scans Table A. For every row, executes an index lookup on Table B (`O(A * log B)`). Fast startup time, minimal RAM footprint.\n   - **Hash Join**: Table A (smaller build table) is hashed into memory (`work_mem`). Table B (probe table) is read sequentially, probing the hash table. If the hash table exceeds `work_mem`, it spills to temporary disk files (Batch Hash Join), causing dramatic I/O slowdowns.\n   - **Merge Join**: Both datasets must be sorted by join key. Pointers walk both inputs in lockstep. Fastest when composite B+Tree indexes already provide pre-sorted ordering.',
    codeExample: {
      language: 'sql',
      code: `-- SQL Joins with Aggregation and Explain Plan
EXPLAIN ANALYZE
SELECT 
  c.customer_id,
  c.company_name,
  COUNT(o.order_id) AS total_orders,
  COALESCE(SUM(o.amount), 0) AS total_spent
FROM customers c
-- LEFT JOIN ensures customers with zero orders are still included
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status = 'COMPLETED'
WHERE c.created_at >= '2026-01-01'
GROUP BY c.customer_id, c.company_name
HAVING COUNT(o.order_id) > 5
ORDER BY total_spent DESC;`
    },
    commonMistakes: [
      'Placing filters on the right table inside the WHERE clause instead of the ON clause during a LEFT JOIN (e.g. `WHERE o.status = "COMPLETED"` converts a LEFT JOIN into an INNER JOIN because NULLs fail the WHERE equality).',
      'Joining on columns without indexes or with type mismatches (e.g. joining `VARCHAR` to `INTEGER`), which forces expensive sequential scans and disables index lookups.',
      'Allowing Hash Joins to spill to disk due to undersized `work_mem` configuration.'
    ],
    realWorldUseCases: [
      'Generating monthly billing reports joining user accounts, subscription tiers, and payment invoices.',
      'Analytics dashboards calculating conversion rates between site visitors and completed checkouts.'
    ],
    tradeOffs: [
      'Hash Joins have higher memory overhead and startup latency (must build hash table before first row is returned), whereas Nested Loops return the first row instantly.'
    ],
    followUpQuestions: [
      'Why does placing `WHERE right_table.status = "active"` inadvertently turn a LEFT JOIN into an INNER JOIN?',
      'How does a Semi-Join (EXISTS) outperform an INNER JOIN when you only need to check existence without duplicating rows?'
    ],
    relatedQuestionIds: ['db-1', 'db-2', 'fs-3'],
    relatedTopicIds: ['sql-fundamentals', 'databases', 'sql-joins'],
    prerequisiteTopicIds: ['sql-fundamentals', 'data-types'],
    nextTopicIds: ['query-optimization', 'transactions-acid'],
    tags: ['Databases', 'SQL', 'Joins', 'Query Plans', 'Hash Join', 'PostgreSQL'],
    keywords: ['sql joins', 'inner join', 'left join', 'hash join', 'nested loop', 'merge join', 'query optimization']
  }
];
