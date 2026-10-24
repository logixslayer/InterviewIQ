import { QuestionItem } from '../../types';

export const QA_SECURITY_QUESTIONS: QuestionItem[] = [
  {
    id: 'sec-1',
    slug: 'idor-broken-object-level-authorization',
    title: 'Insecure Direct Object References (IDOR): Object-Level Authorization vs Role-Based Access Control',
    questionText: 'What is Broken Object-Level Authorization (BOLA / IDOR), ranked #1 in the OWASP API Security Top 10? Why does standard Role-Based Access Control (RBAC) fail to prevent it, and how do you implement robust object-level policy checks?',
    category: 'Testing & Security',
    categoryId: 'qa-security',
    topicId: 'owasp-risks',
    subtopicId: 'idor-bola',
    difficulty: 'Medium',
    questionType: 'Practical Trade-off Analysis',
    roleTarget: 'Application Security Engineer',
    roleIds: ['app-sec-eng', 'backend-dev', 'fullstack-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Understand why authenticated users can tamper with resource IDs (`/api/documents/1042`) and how policy-based authorization (ABAC / CASL / OPA) secures endpoints.',
    shortAnswer: 'IDOR (Insecure Direct Object Reference) / BOLA occurs when an endpoint takes an object identifier (e.g. `GET /api/invoices/9842`) and returns or mutates the resource without validating whether the currently authenticated user actually owns or is authorized to access that specific object instance. Standard RBAC only checks if the caller possesses the role (e.g. `isCustomer === true`), which permits any customer to view any other customer’s invoices by simply iterating numerical IDs. Prevention requires Object-Level / Attribute-Based Access Control (ABAC): scoping queries directly to the authenticated tenant/user ID (`WHERE id = :invoiceId AND user_id = :currentUserId`) or utilizing authorization policy interceptors.',
    detailedAnswer: '1. **The Anatomy of an IDOR Attack**:\n   - User Alice logs in and views her invoice at `/api/invoices/1001`.\n   - Alice changes the URL parameter in Burp Suite to `/api/invoices/1002`.\n   - In an insecure application, the server executes `SELECT * FROM invoices WHERE id = 1002`. Because Alice has a valid session token, the server returns Bob’s confidential financial data.\n\n2. **Why RBAC is Blind to IDOR**:\n   Middleware like `verifyToken` checks authentication, and `requireRole("USER")` checks broad authorization. Both pass because Alice is a legitimate user with the "USER" role. RBAC does not verify relationship between the *subject* (Alice) and the *resource* (Invoice 1002).\n\n3. **Production Remediation Strategies**:\n   - **Database-Level Tenant Scoping**: Never query by resource ID alone. Always enforce `SELECT * FROM invoices WHERE id = :id AND organization_id = :authOrgId`.\n   - **UUIDv4 / Non-Sequential IDs**: While not a substitute for authorization, UUIDs prevent trivial enumeration and dictionary scraping attacks.\n   - **Policy-Based Access Control (CASL / OPA)**: Define fine-grained declarative policy rules: `can("read", "Invoice", { userId: user.id })`.\n   - **Indirect Reference Maps**: Hash user-specific session keys to database IDs so ID references are ephemeral per session.',
    codeExample: {
      language: 'typescript',
      code: `// Express + Prisma: Secure Object-Level Authorization
import { Request, Response } from 'express';
import { prisma } from '../db';

export async function getInvoice(req: Request, res: Response) {
  const { invoiceId } = req.params;
  const currentUserId = req.user?.id; // Injected securely by auth middleware
  const currentTenantId = req.user?.tenantId;

  // VULNERABLE APPROACH (IDOR):
  // const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  // SECURE APPROACH: Enforce composite tenant & ownership scoping
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      // User must either own the invoice or belong to the authorized tenant
      OR: [
        { userId: currentUserId },
        { tenantId: currentTenantId, isSharedWithTeam: true }
      ]
    }
  });

  if (!invoice) {
    // Return 404 rather than 403 to prevent resource existence enumeration!
    return res.status(404).json({ error: 'Invoice not found' });
  }

  return res.json(invoice);
}`,
      exampleInput: "User Alice requests '/api/invoices/992' belonging to User Bob.",
      exampleOutput: "Query returns null; server responds with generic 404 without leaking existence of Bob's record."
    },
    commonMistakes: [
      'Returning `403 Forbidden` on unauthorized IDOR probes, which confirms to an attacker that the resource ID exists and belongs to someone else (use `404 Not Found` instead).',
      'Relying solely on frontend UI hiding of edit/delete buttons while leaving backend API endpoints exposed without ownership verification.',
      'Assuming sequential auto-incrementing integers (1, 2, 3) are acceptable for public-facing API entity identifiers.'
    ],
    realWorldUseCases: [
      'Multi-tenant SaaS platforms ensuring Tenant A cannot read Tenant B’s CRM contacts.',
      'Medical health records portals where patient lab results must be strictly restricted to the patient and their assigned physician.'
    ],
    tradeOffs: [
      'Deep object-level permission checks require additional database joins or secondary queries, which can be mitigated with composite index keys on `(id, user_id)`.'
    ],
    followUpQuestions: [
      'Why is Returning 404 preferred over 403 for unauthorized object requests in public APIs?',
      'How does Open Policy Agent (OPA) decouple authorization rules from microservice application code?'
    ],
    relatedQuestionIds: ['fs-3', 'be-2', 'db-2'],
    relatedTopicIds: ['owasp-risks', 'web-security', 'backend-dev'],
    prerequisiteTopicIds: ['authentication-authorization', 'rest-api'],
    nextTopicIds: ['abac-policy', 'api-security'],
    tags: ['Security', 'OWASP', 'IDOR', 'BOLA', 'API Security', 'Authorization'],
    keywords: ['idor', 'bola', 'owasp', 'broken object level authorization', 'rbac', 'abac', 'api security']
  },
  {
    id: 'sec-2',
    slug: 'testing-pyramid-and-mocking-boundaries',
    title: 'The Modern Testing Pyramid: Unit, Integration, and E2E Trade-offs & Contract Testing',
    questionText: 'How do you structure an effective Automated Testing Strategy using the Testing Pyramid? What are the dangers of over-mocking, and how does Consumer-Driven Contract Testing (Pact) solve microservice integration issues?',
    category: 'Testing & Security',
    categoryId: 'qa-security',
    topicId: 'testing-quality',
    subtopicId: 'testing-pyramid',
    difficulty: 'Medium',
    questionType: 'Practical Trade-off Analysis',
    roleTarget: 'QA Engineer',
    roleIds: ['qa-eng', 'sdet', 'software-engineer'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Balance test execution speed, execution confidence, and maintenance overhead. Avoid fragile mocks and master contract testing.',
    shortAnswer: 'The Testing Pyramid advises a high volume of fast, isolated Unit Tests at the base (testing pure business logic and algorithms in milliseconds), a moderate layer of Integration Tests in the middle (testing interactions between components, real database transactions with Testcontainers, and HTTP handlers), and a sparse layer of End-to-End (E2E) tests at the top (testing critical user flows via Playwright/Cypress). Over-mocking occurs when tests mock out all internal dependencies, resulting in tests that pass because they verify their own mocks while real-world production integration breaks. Consumer-Driven Contract Testing (Pact) bridges this gap for microservices by generating verifiable contract schemas verified against real producer endpoints in CI without spinning up live distributed environments.',
    detailedAnswer: '1. **The Three Layers of the Pyramid**:\n   - **Unit Tests (70%)**: Pure functions, data transformations, domain entities. Zero network, zero disk I/O. Execute 1,000 tests in under 2 seconds (Vitest/Jest).\n   - **Integration Tests (20%)**: Test the seam between code and infrastructure. Run against real ephemeral Docker databases via Testcontainers. Verify SQL migrations, ORM queries, and API route controllers.\n   - **E2E Tests (10%)**: Playwright browser automation covering smoke paths (Sign Up, Checkout, Login). High confidence, but slow (minutes) and susceptible to flakiness due to network and timing.\n\n2. **The Danger of the Mocking Trap**:\n   If Service A mocks Service B’s JSON response as `{ status: "ok" }`, and Service B’s team later updates the field to `{ resultStatus: "OK" }`, Service A’s unit tests continue to pass 100%, giving false confidence until deployment crashes in production.\n\n3. **Consumer-Driven Contract Testing (Pact)**:\n   - Consumer defines expected requests and responses in code.\n   - Pact exports a contract JSON file.\n   - The Provider service runs tests in its own CI pipeline directly against this contract.\n   - Prevents breaking changes before pull requests are merged without requiring live end-to-end multi-service test environments.',
    codeExample: {
      language: 'typescript',
      code: `// Vitest + Testcontainers: Real Integration Test without brittle DB Mocks
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';

describe('User Account Integration Test', () => {
  let container: StartedPostgreSqlContainer;
  let client: Client;

  beforeAll(async () => {
    // Spins up real, isolated Postgres container in Docker
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = new Client({ connectionString: container.getConnectionString() });
    await client.connect();
    // Run real schema migrations
    await client.query('CREATE TABLE users (id SERIAL PRIMARY KEY, balance INT CHECK (balance >= 0))');
  }, 30000);

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  it('enforces database check constraints against negative balances', async () => {
    await client.query('INSERT INTO users (balance) VALUES (100)');
    // Attempting to violate constraint fails at real DB engine level:
    await expect(
      client.query('UPDATE users SET balance = -50 WHERE id = 1')
    ).rejects.toThrow(/check constraint/);
  });
});`,
      exampleInput: "Developer modifies database constraint or query syntax.",
      exampleOutput: "Integration test executes against real containerized engine, instantly catching syntax and constraint violations."
    },
    commonMistakes: [
      'The "Ice Cream Cone" anti-pattern: building hundreds of slow, brittle E2E browser tests while neglecting fast unit and integration tests.',
      'Mocking what you don’t own (e.g. mocking complex third-party AWS SDKs or database drivers rather than testing against local emulators or wrappers).',
      'Ignoring flaky tests instead of immediately quarantining or resolving race conditions and arbitrary `sleep()` statements.'
    ],
    realWorldUseCases: [
      'Fintech platforms running database transaction rollback tests against Testcontainers to prove ledger balance invariants.',
      'E-commerce platforms running Pact contract tests between checkout and payment microservices.'
    ],
    tradeOffs: [
      'Testcontainers require Docker on CI runners and take several seconds to spin up, making them slower than pure unit tests but infinitely more dependable than mock assertions.'
    ],
    followUpQuestions: [
      'How does Mutation Testing (e.g. Stryker) measure whether test suites actually catch bugs rather than merely hitting line coverage targets?',
      'How do you prevent flaky E2E tests caused by asynchronous animations and network latency in Playwright?'
    ],
    relatedQuestionIds: ['fs-1', 'be-1', 'sec-1'],
    relatedTopicIds: ['testing-quality', 'integration-testing', 'e2e-testing'],
    prerequisiteTopicIds: ['unit-testing', 'docker-containers'],
    nextTopicIds: ['contract-testing', 'mutation-testing'],
    tags: ['QA', 'Testing', 'Testcontainers', 'Vitest', 'Integration Tests', 'E2E'],
    keywords: ['testing pyramid', 'unit test', 'integration test', 'e2e', 'pact', 'testcontainers', 'mocking']
  },
  {
    id: 'sec-3',
    slug: 'secure-password-hashing-argon2id-vs-bcrypt',
    title: 'Password Hashing: Argon2id vs bcrypt vs PBKDF2 and GPU/ASIC Resistance',
    questionText: 'Why are SHA-256 and MD5 strictly unacceptable for password storage? How do memory-hard hashing algorithms like Argon2id protect against GPU and ASIC brute-force attacks?',
    category: 'Testing & Security',
    categoryId: 'qa-security',
    topicId: 'cryptography',
    subtopicId: 'password-hashing',
    difficulty: 'Medium',
    questionType: 'Conceptual',
    roleTarget: 'Application Security Engineer',
    roleIds: ['app-sec-eng', 'backend-dev', 'software-engineer'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Understand salt mechanics, computational work factors, memory hardness, and why Argon2id is the OWASP password hashing gold standard.',
    shortAnswer: 'General-purpose cryptographic hash functions like SHA-256, SHA-512, and MD5 are engineered for extreme speed and high throughput (computing hundreds of millions of hashes per second), making them trivial for attackers to crack with GPUs or ASICs. In contrast, password hashing algorithms are deliberately designed to be computationally slow and tunable via a work factor. Furthermore, modern password hashing requires **Memory-Hardness**: Argon2id requires a configurable amount of physical RAM (e.g. 64MB) to compute a single hash. Because GPUs contain thousands of lightweight parallel cores with tiny memory caches, requiring 64MB per hash completely stalls massive GPU parallel brute-force clusters, rendering attacks economically unfeasible.',
    detailedAnswer: '1. **The Evolution of Password Hashing**:\n   - **MD5 / SHA-1 / SHA-256**: Fatal flaw: fast and vulnerable to Rainbow Tables if unsalted, and crackable at billions of guesses per second on modern NVIDIA RTX GPUs.\n   - **bcrypt (1999)**: CPU-bound work factor ($2^{\\text{cost}}$ iterations). Still acceptable with cost 12–14, but utilizes only 4KB of L1 cache, making it vulnerable to custom FPGA acceleration.\n   - **scrypt (2009)**: First memory-hard function, but vulnerable to side-channel cache attacks.\n   - **Argon2id (Winner of the Password Hashing Competition 2015)**: The OWASP current recommended gold standard. Combines Argon2d (data-dependent memory access for GPU resistance) and Argon2i (data-independent memory access for side-channel defense).\n\n2. **Cryptographic Salt Mechanics**:\n   A unique, cryptographically random salt (minimum 16 bytes) is generated for every user upon registration: `hash = Argon2id(password, salt, memory=64MB, iterations=3, parallelism=4)`. Salt ensures that two users with the identical password ("Password123!") produce completely different hash strings, defeating rainbow table lookups.\n\n3. **Tuning Work Factors**:\n   The target execution duration for password verification in production should be between 200ms and 500ms on server hardware. This rate-limits attackers while keeping login latency imperceptible to human users.',
    codeExample: {
      language: 'typescript',
      code: `// Node.js Password Hashing using Argon2id (OWASP Recommended)
import argon2 from 'argon2';

// OWASP Recommended Minimum Parameters:
// Memory: 64 MiB (65536 KB), Iterations (timeCost): 3, Parallelism: 4
export async function hashPassword(plainPassword: string): Promise<string> {
  return await argon2.hash(plainPassword, {
    type: argon2.argon2id, // Hybrid mode resistant to both side-channel & GPU attacks
    memoryCost: 2 ** 16,   // 64 MiB
    timeCost: 3,           // 3 iterations
    parallelism: 4,        // 4 concurrent threads
    hashLength: 32,        // 256-bit output
  });
}

export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  try {
    // Argon2 verifies password against hash in constant-time, preventing timing attacks
    return await argon2.verify(hash, plainPassword);
  } catch (err) {
    return false;
  }
}`,
      exampleInput: "User signs up with password 'SuperSecret123!'.",
      exampleOutput: "Stored hash: '$argon2id$v=19$m=65536,t=3,p=4$qN7Y...$rE29...' containing algorithm version, memory cost, salt, and hash."
    },
    commonMistakes: [
      'Using SHA-256 with a salt or running SHA-256 in a loop 1,000 times, which remains millions of times faster to crack than modern memory-hard functions.',
      'Setting the work factor / cost too low to save server CPU, exposing passwords to offline cracking if database breaches occur.',
      'Using non-constant time comparison (`hashA === hashB`), which introduces timing attack vulnerabilities that leak character matches.'
    ],
    realWorldUseCases: [
      'Enterprise identity providers (Auth0, Okta, Firebase Auth) securing billion-credential databases.',
      'Password managers (1Password, Bitwarden) deriving master encryption keys from master passwords via Argon2id / PBKDF2.'
    ],
    tradeOffs: [
      'High memory cost consumes server RAM during burst login spikes; DDoS protection and rate limiting on `/login` endpoints are necessary to prevent CPU/RAM exhaustion.'
    ],
    followUpQuestions: [
      'How does a password peppering strategy (storing a secret key in HSM/KMS outside the database) provide defense-in-depth against SQL dumps?',
      'What is constant-time string comparison (`crypto.timingSafeEqual`) and why is it critical in cryptography?'
    ],
    relatedQuestionIds: ['sec-1', 'be-2', 'fs-3'],
    relatedTopicIds: ['cryptography', 'owasp-risks', 'web-security'],
    prerequisiteTopicIds: ['authentication-authorization', 'memory-management'],
    nextTopicIds: ['kms-encryption', 'hsm-hardware'],
    tags: ['Security', 'Cryptography', 'Argon2id', 'bcrypt', 'Passwords', 'OWASP'],
    keywords: ['argon2', 'bcrypt', 'password hashing', 'salt', 'memory hardness', 'gpu resistance', 'owasp']
  }
];
