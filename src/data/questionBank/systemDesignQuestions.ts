import { QuestionItem } from '../../types';

export const SYSTEM_DESIGN_QUESTIONS: QuestionItem[] = [
  {
    id: 'sd-1',
    slug: 'distributed-caching-stampede-mitigation',
    title: 'How do you design a distributed caching layer that survives Cache Stampedes (Thundering Herd) and Hotspot Keys?',
    questionText: 'When a popular cached item expires under 100,000 req/sec, how do you prevent the underlying database from crashing, and how do you protect single hot Redis nodes?',
    category: 'System Design & High Scale',
    categoryId: 'system-design',
    topicId: 'distributed-caching',
    subtopicId: 'cache-stampede',
    difficulty: 'Hard',
    questionType: 'System Design',
    roleTarget: 'Software Architect',
    roleIds: ['software-architect', 'backend-dev', 'distributed-systems-eng'],
    estimatedTime: '5 mins response',
    estimatedMinutes: 5,
    description: 'Mitigate cache stampede using distributed mutexes (Redlock), probabilistic early expiration (XFetch), background refresh workers, and key replication.',
    shortAnswer: 'A Cache Stampede (Thundering Herd) occurs when a high-traffic cache key expires, causing thousands of concurrent requests to experience cache misses simultaneously and overwhelm the database. It is resolved using three techniques: 1) Distributed Mutex locking (only one request queries the database while others wait), 2) Probabilistic Early Expiration (XFetch algorithm: proactively recomputing the cache before it expires based on compute time and random delta), and 3) Asynchronous Background Worker refreshes with stale-while-revalidate.',
    detailedAnswer: '1. **The Stampede Phenomenon**:\n   If an item requested 50,000 times per second has an exact TTL of 60 seconds, at second 60.001, all 50,000 requests miss the cache and hit the relational database at once, causing CPU saturation, connection pool exhaustion, and cascading service outages.\n\n2. **Mitigation 1: Distributed Mutex (Singleflight)**:\n   When a cache miss occurs, the application attempts to acquire a short-lived distributed lock in Redis (`SET lock:product:123 "token" NX PX 5000`). Only the thread that acquires the lock queries the database. All other threads wait 50ms and re-check Redis. In Go, this is packaged as `singleflight`.\n\n3. **Mitigation 2: Probabilistic Early Expiration (XFetch)**:\n   Instead of waiting for the key to expire, a client reading the key computes: `currentTime - (delta * beta * ln(random())) > expiry`. If true, this single client asynchronously recomputes the cache in the background while still returning the current cached data to the user. The closer to expiration and the heavier the compute time `delta`, the higher the probability that an early refresh is triggered.\n\n4. **Hotspot Key Mitigation**:\n   If a single key (e.g. Taylor Swift concert tickets) overwhelms a single Redis shard, replicate the key across N shards with randomized suffixes: `key:123_shard_1`, `key:123_shard_2`... and have clients read from a random replica, distributing read throughput across the cluster.',
    codeExample: {
      language: 'typescript',
      code: `// Probabilistic Early Expiration (XFetch Algorithm)
interface CacheEntry<T> {
  value: T;
  delta: number; // Duration taken to compute value in ms
  expiry: number; // Unix timestamp
}

function shouldRefreshEarly<T>(entry: CacheEntry<T>, beta: number = 1.0): boolean {
  // -delta * beta * ln(random) computes a probabilistic time offset before expiration
  const randomFactor = -entry.delta * beta * Math.log(Math.random());
  return Date.now() - randomFactor > entry.expiry;
}

async function getWithProbabilisticRefresh<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await redis.get<CacheEntry<T>>(key);

  if (cached) {
    if (shouldRefreshEarly(cached)) {
      // Recompute in background without blocking current user response!
      (async () => {
        const start = Date.now();
        const fresh = await fetchFn();
        const delta = Date.now() - start;
        await redis.set(key, { value: fresh, delta, expiry: Date.now() + ttlSeconds * 1000 });
      })().catch(console.error);
    }
    return cached.value;
  }

  // Cold cache miss: compute synchronously
  const start = Date.now();
  const fresh = await fetchFn();
  const delta = Date.now() - start;
  await redis.set(key, { value: fresh, delta, expiry: Date.now() + ttlSeconds * 1000 });
  return fresh;
}`,
      explanation: 'XFetch ensures that popular keys are refreshed before they expire, completely eliminating 100% of cache stampede spikes.'
    },
    commonMistakes: [
      'Setting hard, identical TTLs across millions of keys (e.g., all expire at midnight), causing coordinated stampedes. Always add random jitter (`ttl = 3600 + Math.random() * 300`).',
      'Failing to handle database query timeouts inside the mutex lock, leaving other requests permanently waiting.',
      'Caching null or error responses identically to valid data without a very short negative TTL.'
    ],
    realWorldUseCases: [
      'Black Friday product detail caching and homepage hero banner traffic on Amazon/Shopify.',
      'Social media viral posts or live video stream metadata on YouTube/Twitter.'
    ],
    tradeOffs: [
      'XFetch requires storing calculation metadata (`delta`, `expiry`) alongside the cached payload, increasing Redis memory usage by a small percentage.'
    ],
    followUpQuestions: [
      'How does Consistent Hashing with virtual nodes prevent data loss when Redis cluster nodes are added or removed?',
      'How do you handle Cache Invalidation when underlying database rows update before the TTL expires?'
    ],
    relatedQuestionIds: ['be-1', 'sd-2'],
    tags: ['System Design', 'Caching', 'Redis', 'High Availability', 'Architecture'],
    keywords: ['Cache Stampede', 'Thundering Herd', 'Redis', 'XFetch', 'Singleflight', 'Mutex', 'Hotspot'],
    companies: ['Meta', 'Amazon', 'Twitter', 'Netflix'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 94%',
    isBookmarked: true
  },
  {
    id: 'sd-2',
    slug: 'distributed-rate-limiting-token-bucket-redis',
    title: 'Design a distributed rate limiter that enforces 10,000 req/sec limits across multiple API gateway nodes using Redis.',
    questionText: 'Compare Token Bucket, Leaky Bucket, and Sliding Window Counter. How do you implement atomic sliding window counting in Redis without race conditions?',
    category: 'System Design & High Scale',
    categoryId: 'system-design',
    topicId: 'rate-limiting',
    subtopicId: 'distributed-rate-limiter',
    difficulty: 'Hard',
    questionType: 'System Design',
    roleTarget: 'Software Architect',
    roleIds: ['software-architect', 'backend-dev', 'api-developer'],
    estimatedTime: '5 mins response',
    estimatedMinutes: 5,
    description: 'Compare Token Bucket vs Sliding Window Counter, atomic Redis Lua scripts, memory footprint, and handling Redis cluster failover.',
    shortAnswer: 'A distributed rate limiter enforces rate limits across stateless API gateways by maintaining shared counters in Redis. Sliding Window Counter provides high accuracy without burst vulnerabilities by calculating the weighted average between the previous minute counter and current minute counter. Executing the check and increment inside an atomic Redis Lua script ensures zero race conditions across distributed nodes in a single network roundtrip.',
    detailedAnswer: '1. **Algorithm Comparison**:\n   - *Token Bucket*: Tokens refill at a steady rate up to capacity. Allows short bursts up to bucket size. Ideal for API endpoints allowing occasional burst traffic.\n   - *Leaky Bucket*: Enforces a smooth, constant output rate via a queue. Excess requests drop. Ideal for smoothing network egress.\n   - *Fixed Window Counter*: Counts requests per fixed minute (`10:00:00 - 10:00:59`). Suffers from the boundary problem (double limit allowed at the window boundary: 10:00:59 and 10:01:01).\n   - *Sliding Window Counter*: Weighs the previous window: `requests = previous_window_count * ((window_size - time_into_current) / window_size) + current_window_count`. Highly memory efficient (2 keys per user) and mathematically smooth.\n\n2. **Atomic Execution via Redis Lua Script**:\n   If you perform `GET`, calculate in Node.js, and `SET`, concurrent requests cause race conditions. A Lua script executes atomically on the Redis single thread, evaluating limits and incrementing in 1ms without distributed locks.',
    codeExample: {
      language: 'lua',
      code: `-- Redis Lua Script: Atomic Sliding Window Counter Rate Limiter
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local current_time = tonumber(ARGV[2])
local window_size = tonumber(ARGV[3]) -- e.g. 60 seconds

local clear_before = current_time - window_size

-- 1. Remove timestamps older than the sliding window
redis.call('ZREMRANGEBYSCORE', key, '-inf', clear_before)

-- 2. Count requests in current sliding window
local current_requests = redis.call('ZCARD', key)

if current_requests < limit then
  -- Allow request: add unique member with current timestamp as score
  redis.call('ZADD', key, current_time, current_time .. '-' .. math.random(100000))
  redis.call('EXPIRE', key, window_size)
  return 1 -- Allowed
else
  return 0 -- Rejected (HTTP 429 Too Many Requests)
end`
    },
    commonMistakes: [
      'Using a Fixed Window Counter without realizing an attacker can send 2x the allowed limit across window boundaries.',
      'Storing every request timestamp in a Sorted Set (ZSET) for millions of free users; at high volume, ZSET memory consumption can consume gigabytes of Redis RAM.',
      'Failing to return rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`) to clients.'
    ],
    realWorldUseCases: [
      'Cloudflare and Stripe API gateways protecting public endpoints from credential stuffing, brute force, and scraping.',
      'SaaS tier enforcement (e.g. Free Tier: 60 req/min, Enterprise Tier: 5,000 req/min).'
    ],
    tradeOffs: [
      'Centralized Redis rate limiting introduces a network hop (~1ms) per request. For ultra-low latency, API gateways use local in-memory token buckets synchronized asynchronously.'
    ],
    followUpQuestions: [
      'What happens if Redis crashes or is partitioned? (Fail-open vs Fail-closed policies in security vs availability)',
      'How does Cloudflare implement local token buckets with asynchronous batch sync to eliminate centralized database roundtrips?'
    ],
    relatedQuestionIds: ['sd-1', 'be-1'],
    tags: ['System Design', 'Rate Limiting', 'Redis', 'Lua', 'Security'],
    keywords: ['Rate Limiting', 'Token Bucket', 'Sliding Window', 'Redis', 'Lua', 'API Gateway'],
    companies: ['Stripe', 'Cloudflare', 'Twilio', 'GitHub'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 91%',
    isBookmarked: true
  },
  {
    id: 'sd-3',
    slug: 'design-url-shortener-bitly-distributed',
    title: 'Design a globally scalable URL Shortener service (like Bitly) handling 100M URLs generated per month and 10B clicks per month.',
    questionText: 'Walk through capacity estimation, Base62 encoding vs MD5 hashing, database schema, caching, and handling 100:1 read-to-write ratio.',
    category: 'System Design & High Scale',
    categoryId: 'system-design',
    topicId: 'system-design',
    subtopicId: 'system-design',
    difficulty: 'Medium',
    questionType: 'System Design',
    roleTarget: 'Software Architect',
    roleIds: ['software-architect', 'fullstack-dev', 'backend-dev'],
    estimatedTime: '5 mins response',
    estimatedMinutes: 5,
    description: 'Calculate QPS, storage requirements over 5 years, Base62 ID generators (Snowflake / Range Allocation), 301 vs 302 redirects, and CDN caching.',
    shortAnswer: 'A URL shortener converts long URLs into 7-character Base62 keys (62^7 = 3.5 trillion unique combinations). Writes generate unique 64-bit IDs using a distributed ID generator (Twitter Snowflake or ZooKeeper range allocation) and convert the integer to Base62. Reads look up the key in a distributed Redis cache (80-20 rule caches top 20% URLs) before hitting partitioned NoSQL/SQL databases. Return HTTP 302 (Found) to track analytics or HTTP 301 (Moved Permanently) to maximize browser caching.',
    detailedAnswer: '1. **Capacity Estimation**:\n   - *Writes*: 100M URLs/month = ~40 URLs/sec.\n   - *Reads*: 10B clicks/month = ~4,000 reads/sec (100:1 read-heavy ratio).\n   - *Storage (5 years)*: 100M * 12 * 5 = 6 billion URLs. At 500 bytes per record = 3 Terabytes total (easily fits in distributed storage).\n\n2. **Key Generation (Base62 vs Hashing)**:\n   - *MD5/SHA256*: Hashing generates a 128-bit hash. Truncating to 7 characters causes hash collisions, requiring collision retry loops.\n   - *Base62 Encoding of Distributed Auto-Incrementing IDs*: Assign a unique 64-bit integer ID via Twitter Snowflake or a ZooKeeper Range Allocation service (assigning worker nodes blocks of 1,000,000 IDs: Node 1 takes 1–1,000,000, Node 2 takes 1,000,001–2,000,000). Convert that integer into Base62 (`[0-9a-zA-Z]`). Guarantees zero collisions with zero coordination.\n\n3. **HTTP 301 vs 302 Redirect Trade-off**:\n   - `301 Moved Permanently`: The browser caches the redirect forever. Subsequent clicks do NOT hit the shortener backend, reducing server load but completely destroying click analytics.\n   - `302 Found` (or `307 Temporary Redirect`): The browser requests the shortener service on every click, allowing real-time click tracking, geolocation analytics, and referrer metrics.',
    codeExample: {
      language: 'typescript',
      code: `const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function encodeBase62(num: bigint): string {
  if (num === 0n) return '0';
  let str = '';
  let base = 62n;
  let current = num;
  while (current > 0n) {
    const remainder = Number(current % base);
    str = BASE62_CHARS[remainder] + str;
    current = current / base;
  }
  return str;
}

// Example: Integer 125,123,456,789n converts to clean 7-character string: "bM7h2D"
console.log(encodeBase62(125123456789n));`,
      explanation: 'Base62 conversion produces short, clean, URL-safe identifiers without collision checks.'
    },
    commonMistakes: [
      'Using `301 Moved Permanently` without realizing that client browsers will never contact the server again, making click metrics and analytics impossible to collect.',
      'Using centralized database auto-increment in a multi-region deployment, creating a single global bottleneck.',
      'Not expiring inactive URLs after a retention period or not indexing on the 7-character hash key.'
    ],
    realWorldUseCases: [
      'Bitly, TinyURL, and t.co (X/Twitter link wrapping for analytics and malware inspection).',
      'SMS text campaign link tracking where character count is limited to 160 characters.'
    ],
    tradeOffs: [
      'HTTP 302 redirects allow 100% accurate click analytics, but introduce a 20–50ms network hop before the user lands on the destination website.'
    ],
    followUpQuestions: [
      'How do you design real-time click analytics at 10,000 clicks/sec using Apache Kafka and Apache Flink / ClickHouse?',
      'How does Twitter Snowflake generate ordered 64-bit IDs using timestamps, machine IDs, and sequence numbers?'
    ],
    relatedQuestionIds: ['sd-1', 'sd-2'],
    tags: ['System Design', 'Scalability', 'Base62', 'Snowflake', 'Caching'],
    keywords: ['Bitly', 'URL Shortener', 'Base62', 'Snowflake', '301 vs 302', 'capacity estimation'],
    companies: ['Google', 'Meta', 'Amazon', 'Twitter'],
    status: 'passed',
    statusLabel: 'Practiced 3x • High Score: 95%',
    isBookmarked: false
  }
];
