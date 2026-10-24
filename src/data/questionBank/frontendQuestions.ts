import { QuestionItem } from '../../types';

export const FRONTEND_QUESTIONS: QuestionItem[] = [
  {
    id: 'fe-1',
    slug: 'useeffect-vs-uselayouteffect-rendering',
    title: 'Explain the difference between useEffect, useLayoutEffect, and useInsertionEffect with practical use cases.',
    questionText: 'When does each hook fire relative to DOM mutations, browser layout, and paint? What problems occur if you pick the wrong one?',
    category: 'React Internals',
    categoryId: 'react-ecosystem',
    topicId: 'react-hooks-internals',
    subtopicId: 'effect-timing',
    difficulty: 'Easy',
    questionType: 'Conceptual',
    roleTarget: 'Frontend Developer',
    roleIds: ['frontend-dev', 'react-dev', 'fullstack-dev'],
    estimatedTime: '3 mins response',
    estimatedMinutes: 3,
    description: 'Focus on render timing, browser paint synchronization, DOM mutation flicker prevention, and CSS-in-JS style injection overhead.',
    shortAnswer: 'useEffect fires asynchronously AFTER the browser paints to avoid blocking the user interface. useLayoutEffect fires synchronously AFTER DOM mutations but BEFORE the browser paints, which is essential for measuring DOM nodes or preventing visual flicker. useInsertionEffect fires before any DOM mutations to inject styles into the DOM for CSS-in-JS libraries.',
    detailedAnswer: 'In React 18 Concurrent Mode, the component lifecycle is divided into render and commit phases. During the commit phase, React mutates the host DOM. \n\n1. `useInsertionEffect` executes first, before DOM mutations are finalized, allowing CSS-in-JS libraries (like Emotion/styled-components) to inject `<style>` tags without recalculating CSSOM rules for each DOM node.\n2. `useLayoutEffect` executes synchronously immediately after DOM mutations, while the browser has not yet performed its Layout and Paint steps. If you read element dimensions (e.g., `getBoundingClientRect()`) or reposition an element based on its size, doing so in `useLayoutEffect` ensures the correction happens in the same browser frame, preventing visual flicker.\n3. `useEffect` is scheduled to fire asynchronously on the microtask/event queue once the browser has completed its Paint step. This keeps animations and user interactions snappy because data fetching, subscriptions, and logging do not delay the initial visual response.',
    codeExample: {
      language: 'tsx',
      code: `import React, { useState, useLayoutEffect, useRef } from 'react';

export const Tooltip = ({ targetRef, text }: { targetRef: React.RefObject<HTMLElement>, text: string }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // useLayoutEffect prevents flickering by measuring and repositioning BEFORE the browser paints
  useLayoutEffect(() => {
    if (targetRef.current && tooltipRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      setCoords({
        top: targetRect.bottom + 8,
        left: targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2),
      });
    }
  }, [targetRef]);

  return (
    <div 
      ref={tooltipRef} 
      style={{ position: 'fixed', top: coords.top, left: coords.left }}
      className="bg-zinc-900 text-white p-2 rounded shadow-lg text-xs"
    >
      {text}
    </div>
  );
};`,
      explanation: 'Using useLayoutEffect here measures the tooltip dimensions and sets coordinates before the user sees an unpositioned element at (0, 0).'
    },
    commonMistakes: [
      'Using useLayoutEffect for data fetching, causing unnecessary main-thread blocking before the first paint.',
      'Forgetting that useLayoutEffect produces warnings on Server-Side Rendering (SSR) because the DOM is not available on Node.js.',
      'Assuming useEffect always runs after a delay; it runs on the next tick, but can still block subsequent interactions if heavy computations are executed inside it.'
    ],
    realWorldUseCases: [
      'Positioning dynamic tooltips, popovers, and context menus relative to anchor elements.',
      'Auto-scrolling a chat container to the bottom before the frame is rendered.',
      'Animating layout FLIP (First, Last, Invert, Play) transitions smoothly.'
    ],
    tradeOffs: [
      'useLayoutEffect blocks the browser main thread from painting until execution finishes, which degrades First Contentful Paint if abused.',
      'useEffect cannot synchronously measure DOM dimensions without causing a visible 1-frame jump or flicker.'
    ],
    followUpQuestions: [
      'How does React SSR handle useLayoutEffect, and how do you resolve the SSR hydration warning?',
      'How do useTransition and startTransition affect effect timing in React 18?'
    ],
    relatedQuestionIds: ['fe-2', 'fe-4', 'fe-6'],
    tags: ['React', 'Hooks', 'Rendering', 'Performance', 'DOM'],
    keywords: ['useEffect', 'useLayoutEffect', 'paint', 'reflow', 'commit phase', 'DOM mutations'],
    companies: ['Meta', 'Vercel', 'Shopify', 'Airbnb'],
    status: 'passed',
    statusLabel: 'Practiced 3x • High Score: 92%',
    isBookmarked: true
  },
  {
    id: 'fe-2',
    slug: 'css-box-model-reflow-repaint',
    title: 'Walk through how the CSS box model, layout recalculation, and composite layers impact 60fps browser rendering.',
    questionText: 'What triggers reflow (layout) vs repaint vs compositing, and how do you leverage GPU acceleration safely?',
    category: 'HTML & CSS Architecture',
    categoryId: 'html-css',
    topicId: 'browser-rendering-pipeline',
    subtopicId: 'reflow-repaint',
    difficulty: 'Easy',
    questionType: 'Conceptual',
    roleTarget: 'Frontend Developer',
    roleIds: ['frontend-dev', 'ui-engineer', 'web-dev'],
    estimatedTime: '3 mins response',
    estimatedMinutes: 3,
    description: 'Explain triggers for reflow vs repaint, GPU acceleration with transform/opacity, and will-change memory trade-offs.',
    shortAnswer: 'Reflow (Layout) recalculates the physical geometry of elements in the document tree. Repaint draws the pixels of visible elements without altering geometry. Compositing groups layers onto the GPU. Modifying geometric properties like width or top forces costly reflow and repaint, whereas transform and opacity skip both and execute directly on the GPU compositor thread for silky 60fps rendering.',
    detailedAnswer: 'The browser rendering pipeline consists of JavaScript execution -> Style Calculation -> Layout (Reflow) -> Paint -> Compositing.\n\n1. **Reflow (Layout)** occurs whenever an element\'s geometry changes (e.g., `width`, `height`, `padding`, `margin`, `fontSize`, or reading properties like `offsetWidth` and `scrollTop`). Because elements affect their siblings and parents, a reflow often triggers a cascade across the DOM tree.\n2. **Repaint** occurs when visual properties change without affecting geometric space (e.g., `color`, `background-color`, `visibility`, `box-shadow`). The browser regenerates the pixel bitmaps for that element.\n3. **Compositing** happens when layers are uploaded to the GPU as textures. The GPU can transform, rotate, scale, and blend layers without touching the CPU main thread. Properties like `transform` and `opacity` are composited directly on the GPU, achieving stable 60fps (or 120fps on ProMotion displays).\n4. **Forced Synchronous Layout**: Reading a layout metric immediately after mutating the DOM forces the browser to prematurely calculate layout before the batch queue finishes, causing layout thrashing.',
    codeExample: {
      language: 'css',
      code: `/* BAD: Triggers continuous Reflow & Repaint on CPU main thread */
.bad-drawer {
  position: absolute;
  left: -300px;
  transition: left 0.3s ease;
}
.bad-drawer.open {
  left: 0; /* Forces geometry recalculation on every intermediate frame */
}

/* GOOD: Composite-only animation processed on GPU */
.good-drawer {
  position: absolute;
  transform: translate3d(-100%, 0, 0);
  will-change: transform;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.good-drawer.open {
  transform: translate3d(0, 0, 0); /* Offloaded to GPU layer compositor */
}`,
      explanation: 'Transform mutations do not alter document flow, allowing the GPU to move the layer texture without CPU reflow.'
    },
    commonMistakes: [
      'Animating top, left, width, or height instead of transform.',
      'Overusing `will-change: transform`, which consumes excessive GPU VRAM and causes mobile browser crashes.',
      'Reading `element.offsetHeight` inside an animation loop without caching, triggering Layout Thrashing.'
    ],
    realWorldUseCases: [
      '60fps off-canvas navigation drawers and modal backdrop transitions.',
      'Drag-and-drop interfaces (e.g., Trello/Linear Kanban boards).',
      'Smooth sticky header parallax effects.'
    ],
    tradeOffs: [
      'Creating too many GPU composite layers increases memory consumption and layer tile management overhead.',
      'Transform does not push adjacent DOM elements, meaning surrounding content will not automatically flow around it.'
    ],
    followUpQuestions: [
      'What is Layout Thrashing, and how do you batch DOM reads and writes using requestAnimationFrame or FastDOM?',
      'How does CSS contain: strict / content improve rendering performance in complex dashboards?'
    ],
    relatedQuestionIds: ['fe-5', 'fe-10'],
    tags: ['CSS', 'Performance', 'Browser Internals', 'Animations', 'GPU'],
    keywords: ['box model', 'reflow', 'repaint', 'compositing', 'transform', 'will-change', 'layout thrashing'],
    companies: ['Google', 'Apple', 'Canva', 'Meta'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: false
  },
  {
    id: 'fe-3',
    slug: 'csr-vs-ssr-vs-ssg-tradeoffs',
    title: 'Explain the architectural trade-offs between CSR, SSR, and SSG in high-traffic consumer web applications.',
    questionText: 'How do CSR, SSR, SSG, and ISR compare across LCP, TTI, server infrastructure cost, dynamic state, and caching?',
    category: 'Technical Architecture',
    categoryId: 'html-css',
    topicId: 'browser-rendering-pipeline',
    subtopicId: 'cwv-opt',
    difficulty: 'Medium',
    questionType: 'Trade-off Analysis',
    roleTarget: 'Frontend Developer',
    roleIds: ['frontend-dev', 'fullstack-dev', 'software-architect'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Focus on Time-To-Interactive (TTI), Largest Contentful Paint (LCP), server load variance, CDN caching invalidation strategies, and SEO implications for dynamic user state.',
    shortAnswer: 'CSR (Client-Side Rendering) sends an empty HTML shell and renders in browser JS, delivering fast client transitions but poor initial LCP/SEO. SSR (Server-Side Rendering) computes fresh HTML per request on the server, providing optimal SEO and fast LCP at the cost of server compute and delayed TTI during hydration. SSG (Static Site Generation) pre-builds HTML at deployment for instant CDN delivery, ideal for content that changes infrequently.',
    detailedAnswer: '1. **CSR (Client-Side Rendering)**: \n   - *Mechanism*: Web server serves an empty `<div id="root"></div>` alongside JS bundles. Browser downloads, parses, and executes the bundle before rendering UI.\n   - *Pros*: Zero server compute per request, instant page transitions with client-side routers, excellent for authenticated private portals.\n   - *Cons*: Slow Largest Contentful Paint (LCP) and First Meaningful Paint over high-latency mobile networks; web crawlers without headless JS evaluation cannot index dynamic content.\n\n2. **SSR (Server-Side Rendering)**: \n   - *Mechanism*: Node.js or edge worker executes React components on every incoming HTTP request, returning full HTML strings with pre-populated data.\n   - *Pros*: Excellent SEO, fast initial LCP, content visible before JS arrives.\n   - *Cons*: Server CPU load scales directly with traffic spikes; Time-To-Interactive (TTI) is delayed while client JS downloads and "hydrates" the DOM (attaching event listeners).\n\n3. **SSG (Static Site Generation) & ISR (Incremental Static Regeneration)**: \n   - *Mechanism*: HTML is compiled once at build time and cached on worldwide CDN edge nodes (Cloudflare/CloudFront/Fastly). ISR revalidates static pages in the background when a stale-while-revalidate TTL expires.\n   - *Pros*: Near-zero latency, extreme resilience against DDoS/traffic spikes, cheapest infrastructure cost.\n   - *Cons*: Build times increase with millions of pages unless ISR or on-demand cache tags are implemented; dynamic personalized user state requires client-side hydration.',
    codeExample: {
      language: 'typescript',
      code: `// Next.js ISR Example: Combining CDN caching with background revalidation
export async function getStaticProps() {
  const res = await fetch('https://api.example.com/products');
  const products = await res.json();

  return {
    props: { products },
    // Re-generate page at the edge at most once every 60 seconds when requests arrive
    revalidate: 60,
  };
}`,
      explanation: 'Edge CDNs serve the static cached page instantly. When 60s passes, the next request serves stale while the edge worker builds fresh HTML in the background.'
    },
    commonMistakes: [
      'Choosing SSR for a private, authenticated dashboard behind a login wall where public SEO is irrelevant.',
      'Assuming SSR guarantees instant interactivity; users can experience the "uncanny valley" where buttons look clickable but do not respond until hydration finishes.',
      'Failing to set appropriate Cache-Control headers with stale-while-revalidate for SSR routes.'
    ],
    realWorldUseCases: [
      'E-commerce product detail pages using SSG + ISR for instant LCP and high search ranking.',
      'SaaS administrative dashboards using CSR for complex interactive data grids.',
      'News media websites using SSR with edge caching for up-to-the-minute articles.'
    ],
    tradeOffs: [
      'SSR provides the fastest first paint for dynamic data, but requires scaling Node.js edge/serverless fleets.',
      'SSG delivers lowest latency and zero hosting costs, but cannot render user-specific personalized views without client-side hydration.'
    ],
    followUpQuestions: [
      'How does React Server Components (RSC) fundamentally differ from traditional SSR with hydration?',
      'How do you eliminate hydration mismatch errors when local client state (like timezone) differs from the server?'
    ],
    relatedQuestionIds: ['fs-5', 'fe-5'],
    tags: ['Architecture', 'Performance', 'SSR', 'Next.js', 'Core Web Vitals'],
    keywords: ['CSR', 'SSR', 'SSG', 'ISR', 'Hydration', 'LCP', 'TTI', 'CDN'],
    companies: ['Meta', 'Stripe', 'Vercel', 'Amazon'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 84%',
    isBookmarked: true
  },
  {
    id: 'fe-4',
    slug: 'react-memory-leaks-closure-cleanup',
    title: 'How do you identify, profile, and remediate memory leaks caused by lingering event listeners or closures in React 18 Concurrent Mode?',
    questionText: 'Explain how detached DOM trees occur, how Chrome DevTools heap snapshots diagnose retained objects, and how to write airtight cleanup contracts.',
    category: 'React Internals',
    categoryId: 'react-ecosystem',
    topicId: 'react-reconciliation',
    subtopicId: 'fiber-tree',
    difficulty: 'Hard',
    questionType: 'Debugging',
    roleTarget: 'Frontend Developer',
    roleIds: ['frontend-dev', 'react-dev', 'fullstack-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Explain Chrome DevTools memory allocation snapshots, retained object trees, cleanup contracts in useEffect, and handling unsubscribed RxJS or WebSocket connections.',
    shortAnswer: 'Memory leaks in React occur when unmounted components retain references in closures, global event listeners, timers, or WebSocket subscriptions, preventing garbage collection. They are diagnosed by taking three sequential Chrome DevTools Heap Snapshots (baseline, action, return) and searching for Detached HTMLElement nodes and retained fibers. They are fixed by returning deterministic cleanup functions from all useEffect hooks and using AbortController for pending fetches.',
    detailedAnswer: '1. **Root Causes in React**:\n   - Global event listeners (`window.addEventListener`) added in `useEffect` without an equivalent `removeEventListener` in the cleanup function.\n   - Uncancelled asynchronous fetch requests or timers (`setInterval`) that retain component state setters in their closure scope.\n   - WebSocket or EventEmitter subscriptions that continue dispatching messages into unmounted component state, causing memory growth and React state update warnings.\n   - Closures retaining large objects (e.g., video frames, canvas textures, entire Redux slices).\n\n2. **Profiling Methodology with Chrome DevTools**:\n   - Open DevTools -> Memory Panel -> Take **Snapshot 1** (baseline).\n   - Perform the suspect user interaction (e.g., open a heavy data-table modal 10 times and close it).\n   - Force Garbage Collection (click the trash can icon in DevTools) and take **Snapshot 2**.\n   - Repeat the cycle and take **Snapshot 3**.\n   - Switch perspective to "Objects allocated between Snapshot 1 and 2" or inspect the "Class Filter" for `Detached HTMLDivElement`.\n   - Expand the **Retainers Tree** at the bottom to identify the GC Root (usually an event listener or a persistent singleton holding a reference to the unmounted Fiber node).\n\n3. **Remediation Contract**:\n   - Always return a cleanup function from `useEffect`.\n   - Use `AbortController` to cancel in-flight HTTP requests when components unmount.\n   - Clean up third-party DOM plugins (chart.js, Leaflet, Monaco editor) via their explicit `.destroy()` methods.',
    codeExample: {
      language: 'tsx',
      code: `import React, { useEffect, useState } from 'react';

export const LiveDataFeed = ({ channelId }: { channelId: string }) => {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // 1. AbortController for in-flight fetch cleanup
    const controller = new AbortController();
    
    // 2. Global event listener
    const handleResize = () => console.log('Resized:', window.innerWidth);
    window.addEventListener('resize', handleResize);

    // 3. WebSocket connection
    const socket = new WebSocket(\`wss://stream.example.com/\${channelId}\`);
    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    // AIRTIGHT CLEANUP CONTRACT: Guaranteed execution on unmount or channelId change
    return () => {
      controller.abort();
      window.removeEventListener('resize', handleResize);
      socket.close();
    };
  }, [channelId]);

  return <div>Messages: {messages.length}</div>;
};`,
      explanation: 'Returning the cleanup function ensures sockets close, listeners detach, and aborted requests do not attempt to set state on unmounted fibers.'
    },
    commonMistakes: [
      'Passing an anonymous inline function to `addEventListener` (`window.addEventListener("scroll", () => ...)`), making it impossible to remove in cleanup.',
      'Relying on empty dependency array `[]` without realizing that if the component unmounts mid-request, an unhandled promise resolution still leaks closures.',
      'Storing massive raw API responses in mutable component refs that outlive user interactions.'
    ],
    realWorldUseCases: [
      'Real-time financial trading terminals receiving continuous market ticker WebSocket feeds.',
      'Complex single-page applications with heavy map or chart visualizers that leak dozens of megabytes per route change if uncleaned.'
    ],
    tradeOffs: [
      'Proper teardown and cleanup logic requires strict boilerplate discipline, but prevents gradual browser tab slowdown and mobile browser crashes.'
    ],
    followUpQuestions: [
      'How does React 18 Concurrent Mode StrictMode help catch missing effect cleanup in development?',
      'What is WeakRef / FinalizationRegistry in modern JavaScript, and when should you avoid using it for DOM management?'
    ],
    relatedQuestionIds: ['fe-1', 'fe-6', 'js-2'],
    tags: ['React', 'Memory Leaks', 'Performance', 'Chrome DevTools', 'Debugging'],
    keywords: ['memory leak', 'heap snapshot', 'detached DOM', 'garbage collection', 'AbortController', 'cleanup'],
    companies: ['Netflix', 'Uber', 'Airbnb', 'Google'],
    status: 'review',
    statusLabel: 'Needs Review • Last Score: 64%',
    isBookmarked: true
  },
  {
    id: 'fe-5',
    slug: 'core-web-vitals-inp-lcp-cls-optimization',
    title: 'How do you diagnose and optimize Core Web Vitals, specifically Largest Contentful Paint (LCP) and Interaction to Next Paint (INP)?',
    questionText: 'Walk through how the browser computes LCP and INP, key bottlenecks, and concrete engineering fixes.',
    category: 'Frontend Performance',
    categoryId: 'frontend-web',
    topicId: 'browser-rendering-pipeline',
    subtopicId: 'cwv-opt',
    difficulty: 'Medium',
    questionType: 'Practical Trade-off',
    roleTarget: 'Frontend Developer',
    roleIds: ['frontend-dev', 'frontend-perf-engineer', 'web-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Diagnose LCP sub-parts (TTFB, Load Delay, Load Time, Render Delay) and optimize INP by breaking long tasks with scheduler.yield() or web workers.',
    shortAnswer: 'LCP (Largest Contentful Paint) measures when the main hero content becomes visible and should be under 2.5 seconds. Optimize it by eliminating server TTFB, preloading hero images with fetchpriority="high", and eliminating render-blocking CSS/JS. INP (Interaction to Next Paint) measures overall page responsiveness across all user interactions and should be under 200ms. Optimize it by breaking long tasks (>50ms) using scheduler.yield(), requestIdleCallback(), or Web Workers.',
    detailedAnswer: '1. **Largest Contentful Paint (LCP) Breakdown**:\n   LCP is composed of 4 sub-parts: \n   - *Time to First Byte (TTFB)*: Time for the server/CDN to return the first HTML byte. Fix with edge caching and CDN optimization.\n   - *Resource Load Delay*: Time between HTML arrival and when the browser discovers the LCP asset. Fix by adding `<link rel="preload" as="image" fetchpriority="high">` in the `<head>`.\n   - *Resource Load Time*: Time to download the asset. Fix with modern formats (AVIF/WebP), responsive `srcset`, and compression.\n   - *Element Render Delay*: Time between asset download completion and final paint. Fix by deferring non-critical JavaScript and removing render-blocking CSS.\n\n2. **Interaction to Next Paint (INP) Breakdown**:\n   INP replaced FID in March 2024. It measures the latency of every click, tap, and keypress across the entire user session.\n   - *Input Delay*: Time waiting for the main thread to finish background tasks before event handlers run. Fix by breaking up long tasks.\n   - *Processing Duration*: Time spent executing JavaScript event handlers. Fix with debouncing, memoization, and offloading heavy sorting/filtering to Web Workers.\n   - *Presentation Delay*: Time for the browser to recalculate layout and paint the next frame. Fix by minimizing DOM tree depth and avoiding synchronous reflows immediately after event handling.',
    codeExample: {
      language: 'html',
      code: `<!-- 1. Optimal LCP Preloading in HTML Head -->
<link 
  rel="preload" 
  as="image" 
  href="/hero-product.avif" 
  type="image/avif" 
  fetchpriority="high"
/>

<!-- 2. Yielding to Main Thread for Optimal INP in JavaScript -->
<script>
async function processLargeBatch(items) {
  for (let i = 0; i < items.length; i++) {
    renderItem(items[i]);
    
    // Yield every 50ms so user clicks and typing can be processed immediately
    if (i % 20 === 0 && 'scheduler' in window && 'yield' in window.scheduler) {
      await window.scheduler.yield();
    }
  }
}
</script>`,
      explanation: 'fetchpriority="high" prioritizes the hero image in the network queue, while scheduler.yield() ensures the main thread stays responsive to user clicks.'
    },
    commonMistakes: [
      'Lazy-loading the LCP hero image with `loading="lazy"`, which deliberately delays image loading and destroys LCP scores.',
      'Running heavy array filtering/sorting synchronously inside a React input `onChange` handler instead of using `useDeferredValue` or `useTransition`.',
      'Using third-party analytics tag managers (GTM) that inject dozens of synchronous scripts, blocking main-thread input handling.'
    ],
    realWorldUseCases: [
      'High-traffic e-commerce storefronts where sub-second LCP directly improves Google Search SEO rankings and cart conversions.',
      'SaaS analytics dashboards where typing in search filters remains fluid without dropped frames.'
    ],
    tradeOffs: [
      'Yielding to the main thread with `scheduler.yield()` spreads processing over multiple frames, increasing total task duration slightly to prioritize input responsiveness.'
    ],
    followUpQuestions: [
      'How does useDeferredValue in React 18 specifically improve INP during fast keyboard typing?',
      'How does the Speculation Rules API improve LCP through prerendering?'
    ],
    relatedQuestionIds: ['fe-2', 'fe-3', 'fe-6'],
    tags: ['Web Vitals', 'Performance', 'LCP', 'INP', 'Browser Runtimes'],
    keywords: ['Core Web Vitals', 'LCP', 'INP', 'FID', 'CLS', 'fetchpriority', 'scheduler.yield'],
    companies: ['Google', 'Shopify', 'Target', 'Pinterest'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 89%',
    isBookmarked: false
  },
  {
    id: 'fe-6',
    slug: 'javascript-event-loop-microtasks-macrotasks',
    title: 'Explain the JavaScript event loop, microtask queues, and macrotask scheduling in modern browser runtimes.',
    questionText: 'Given nested Promise, setTimeout, requestAnimationFrame, and synchronous statements, predict execution order and explain why.',
    category: 'JavaScript & TypeScript',
    categoryId: 'javascript-typescript',
    topicId: 'event-loop',
    subtopicId: 'micro-vs-macro',
    difficulty: 'Medium',
    questionType: 'Output Prediction',
    roleTarget: 'Frontend Developer',
    roleIds: ['frontend-dev', 'javascript-dev', 'fullstack-dev'],
    estimatedTime: '3 mins response',
    estimatedMinutes: 3,
    description: 'Deconstruct call stack, microtask queue (Promises, queueMicrotask, MutationObserver), macrotask queue (setTimeout, I/O), and rendering turns.',
    shortAnswer: 'JavaScript executes synchronous code on the call stack first. When the stack is empty, the engine drains ALL pending microtasks (Promises, queueMicrotask) until the microtask queue is completely empty before executing the next single macrotask (setTimeout, setInterval, I/O). The browser may perform layout/paint between macrotasks.',
    detailedAnswer: '1. **Call Stack**: Executes synchronous frames in LIFO order.\n2. **Microtask Queue**: Holds microtasks generated by `Promise.resolve().then()`, `queueMicrotask()`, and `MutationObserver`. CRITICAL RULE: Once the call stack clears, the engine processes every microtask in the queue, including any new microtasks queued by running microtasks, before moving on. An infinite microtask loop will freeze the browser tab completely.\n3. **Render Queue / requestAnimationFrame**: Fires before browser layout and paint, right before the next display refresh.\n4. **Macrotask (Task) Queue**: Holds tasks from `setTimeout`, `setInterval`, network callbacks, and user I/O events. The event loop picks exactly ONE macrotask, executes it, then immediately drains the entire microtask queue again before selecting the next macrotask.',
    codeExample: {
      language: 'javascript',
      code: `console.log('1: Sync');

setTimeout(() => {
  console.log('2: Macrotask (setTimeout)');
}, 0);

Promise.resolve().then(() => {
  console.log('3: Microtask 1');
}).then(() => {
  console.log('4: Microtask 2');
});

queueMicrotask(() => {
  console.log('5: Microtask 3');
});

console.log('6: Sync End');

// PREDICTED OUTPUT:
// 1: Sync
// 6: Sync End
// 3: Microtask 1
// 5: Microtask 3
// 4: Microtask 2
// 2: Macrotask (setTimeout)`,
      explanation: 'Sync lines 1 and 6 execute first. All microtasks (3, 5, then 4) drain next. Finally, the setTimeout macrotask runs.'
    },
    commonMistakes: [
      'Believing setTimeout(fn, 0) runs immediately after the current line of code; it must wait for both call stack and microtask queues to empty.',
      'Assuming Promise callbacks run as macrotasks like timers.',
      'Creating recursive microtasks (`function loop() { Promise.resolve().then(loop); }`), which starves the event loop and locks up UI interaction.'
    ],
    realWorldUseCases: [
      'Batching state updates in framework rendering loops using queueMicrotask.',
      'Scheduling non-critical work with setTimeout to allow browser paint frames to land smoothly.',
      'Synchronizing animations with requestAnimationFrame to avoid frame tearing.'
    ],
    tradeOffs: [
      'Microtasks guarantee immediate execution before UI repaints, but risk freezing the UI if they take longer than a few milliseconds.'
    ],
    followUpQuestions: [
      'Where does requestAnimationFrame fit relative to microtasks and browser paint steps in the W3C spec?',
      'How does Node.js process.nextTick() differ from standard browser queueMicrotask()?'
    ],
    relatedQuestionIds: ['fe-1', 'fe-2', 'fe-5'],
    tags: ['JavaScript', 'Event Loop', 'Asynchronous', 'Promises', 'V8'],
    keywords: ['event loop', 'microtask', 'macrotask', 'call stack', 'Promise', 'queueMicrotask'],
    companies: ['Google', 'Meta', 'Amazon', 'Microsoft'],
    status: 'passed',
    statusLabel: 'Practiced 3x • High Score: 95%',
    isBookmarked: true
  },
  {
    id: 'fe-7',
    slug: 'typescript-generics-conditional-types',
    title: 'How do you design type-safe APIs using TypeScript Generics, Conditional Types, and the infer keyword?',
    questionText: 'Demonstrate how to write advanced utility types like DeepReadonly, ReturnType, or Flatten using conditional types and pattern matching with infer.',
    category: 'JavaScript & TypeScript',
    categoryId: 'javascript-typescript',
    topicId: 'ts-advanced-types',
    subtopicId: 'conditional-types',
    difficulty: 'Hard',
    questionType: 'Coding',
    roleTarget: 'Frontend Developer',
    roleIds: ['typescript-dev', 'frontend-dev', 'fullstack-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Master generic constraints (extends), distributive conditional types over unions, and extracting inner types using infer.',
    shortAnswer: 'Conditional types follow the ternary pattern `T extends U ? X : Y`. Combined with the `infer` keyword, TypeScript can dynamically extract component types (such as unwrapping a Promise, extracting function return types, or unpacking array elements). When generic types receive naked union parameters, conditional types distribute across the union automatically.',
    detailedAnswer: '1. **Generic Constraints**: `T extends object` restricts allowed types.\n2. **Conditional Types**: Enable branching in the type system based on type compatibility: `T extends Function ? true : false`.\n3. **The `infer` Keyword**: Declares an inline type variable inside a conditional clause that TypeScript solves via pattern matching. For example, `T extends (...args: any[]) => infer R ? R : any` infers the return type `R` of an arbitrary function signature.\n4. **Distributive Conditional Types**: If `T` is a bare type parameter in `T extends any ? ...`, a union like `string | number` distributes as `(string extends any ? ...) | (number extends any ? ...)`. Wrapping in a tuple `[T] extends [any]` disables distribution when exact tuple matching is required.',
    codeExample: {
      language: 'typescript',
      code: `// 1. Unwrap Promise / Await utility using infer
type UnpackPromise<T> = T extends Promise<infer U> ? UnpackPromise<U> : T;

// 2. DeepReadonly recursive mapped type
type DeepReadonly<T> = T extends Function | boolean | number | string | null | undefined
  ? T
  : T extends Array<infer Item>
  ? ReadonlyArray<DeepReadonly<Item>>
  : { readonly [K in keyof T]: DeepReadonly<T[K]> };

// Example Usage
async function fetchUser() {
  return { id: 'usr-101', profile: { name: 'Alex', tags: ['lead', 'arch'] } };
}

// Inferred as: { id: string; profile: { name: string; tags: string[] } }
type UserResult = UnpackPromise<ReturnType<typeof fetchUser>>;

// All nested properties and arrays are deeply immutable
type ImmutableUser = DeepReadonly<UserResult>;`,
      explanation: 'UnpackPromise recursively unwraps nested Promise types, while DeepReadonly enforces immutability down the entire object graph.'
    },
    commonMistakes: [
      'Forgetting that conditional types distribute over unions, which can produce unexpected union combinations instead of matching the collective union.',
      'Using `any` instead of `unknown` when constraining generic variables.',
      'Over-complicating types to the point where the TypeScript language server times out or hits "Type instantiation is excessively deep and possibly infinite".'
    ],
    realWorldUseCases: [
      'Building type-safe API client wrappers (like tRPC, TanStack Query, or Redux Toolkit).',
      'Validating form schemas with runtime-to-type inference (like Zod `z.infer<typeof schema>`).'
    ],
    tradeOffs: [
      'Advanced generic metaprogramming improves developer experience and eliminates runtime type bugs, but increases IDE compilation latency.'
    ],
    followUpQuestions: [
      'What are Template Literal Types in TypeScript, and how do you build a type-safe EventBus or deep object path accessor (`user.profile.name`)?',
      'How does the satisfies operator in TypeScript 4.9 differ from standard type annotations or `as const`?'
    ],
    relatedQuestionIds: ['fe-1', 'fe-6'],
    tags: ['TypeScript', 'Generics', 'Type System', 'Utility Types', 'infer'],
    keywords: ['TypeScript', 'Generics', 'infer', 'conditional types', 'DeepReadonly', 'ReturnType'],
    companies: ['Microsoft', 'Stripe', 'Vercel', 'Meta'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: false
  },
  {
    id: 'fe-8',
    slug: 'react-fiber-reconciliation-diffing',
    title: 'Deconstruct React Fiber architecture, the double-buffering work loop, and heuristic virtual DOM diffing rules.',
    questionText: 'How does React prioritize work with lanes, schedule interruptible rendering, and why are keys critical for array reconciliation?',
    category: 'React Internals',
    categoryId: 'react-ecosystem',
    topicId: 'react-reconciliation',
    subtopicId: 'fiber-tree',
    difficulty: 'Hard',
    questionType: 'Conceptual',
    roleTarget: 'Frontend Developer',
    roleIds: ['react-dev', 'frontend-dev', 'software-architect'],
    estimatedTime: '5 mins response',
    estimatedMinutes: 5,
    description: 'Analyze Fiber nodes as units of work, double-buffering (current vs workInProgress), O(n) heuristic diffing rules, and React 18 Lane priority scheduling.',
    shortAnswer: 'React Fiber is a complete reimplementation of the reconciliation engine that represents every component as a singly linked list node (unit of work). It enables interruptible, incremental rendering using double-buffering (current tree vs workInProgress tree). Diffing uses an O(n) heuristic: elements of different types generate brand new subtrees, and array elements are keyed to track identity across reorders without destroying DOM nodes.',
    detailedAnswer: '1. **Why Fiber replaced the Stack Reconciler**:\n   The legacy React stack reconciler performed synchronous recursive tree traversal. For massive component trees, this held the main thread for 100ms+, causing dropped frames and sluggish user typing. Fiber broke tree traversal into incremental units of work that can be paused, aborted, or reprioritized using browser requestIdleCallback / scheduler primitives.\n\n2. **Double Buffering**:\n   React maintains two Fiber trees in memory at all times: \n   - `current`: The Fiber tree corresponding to what is currently visible on the screen.\n   - `workInProgress`: The tree being constructed during the render phase. Once all work is completed and validated, a single pointer swap (`current = workInProgress`) commits the changes to the screen instantly.\n\n3. **Lanes & Priority**:\n   React 18 uses 31 bitmask Lanes to represent task urgency: \n   - SyncLane / InputContinuousLane: Urgent user interactions (typing, clicking).\n   - DefaultLane: Normal data fetching updates.\n   - TransitionLane: Non-urgent updates (`useTransition`, `useDeferredValue`) that yield to user typing.\n\n4. **O(n) Heuristic Diffing**:\n   Generic tree diffing is O(n^3). React achieves O(n) by assuming: \n   - Two elements of different types produce different trees (e.g., changing `<div>` to `<section>` unmounts the entire child subtree).\n   - Stable `key` props identify which child elements persist across array insertions, deletions, or reorders.',
    codeExample: {
      language: 'tsx',
      code: `// Why array index as key breaks Fiber reconciliation on reorder
// BAD: Using index
{items.map((item, index) => (
  <ListItem key={index} data={item} />
))}

// GOOD: Stable unique ID preserves Fiber identity & internal DOM state (focus, input values)
{items.map((item) => (
  <ListItem key={item.id} data={item} />
))}`,
      explanation: 'When keys are stable IDs, Fiber reorders existing DOM nodes rather than destroying and recreating them, preserving input focus and CSS transitions.'
    },
    commonMistakes: [
      'Using `key={Math.random()}`, which forces React to unmount and remount the DOM node on every single render, destroying all internal component state.',
      'Using array index as key in lists that can be filtered, sorted, or prepended.',
      'Performing side effects inside the Fiber render phase (outside useEffect), which run multiple times if concurrent work is paused or restarted.'
    ],
    realWorldUseCases: [
      'High-frequency interactive tables (e.g., Bloomberg or Stripe dashboards) where typing in filter inputs cannot drop frames while thousands of cells re-render.',
      'Page transitions where the previous screen stays interactive until the next screen has finished assembling its Fiber tree.'
    ],
    tradeOffs: [
      'Fiber maintains two parallel linked list trees in memory, slightly increasing JavaScript heap memory to gain interruptible rendering.'
    ],
    followUpQuestions: [
      'How does React 19 Action and useActionState build on top of Fiber transition lanes?',
      'What happens under the hood when Suspense throws a Promise during the Fiber workLoop?'
    ],
    relatedQuestionIds: ['fe-1', 'fe-4'],
    tags: ['React', 'Fiber', 'Reconciliation', 'Architecture', 'Concurrent Mode'],
    keywords: ['Fiber', 'reconciliation', 'virtual DOM', 'double buffering', 'lanes', 'keys'],
    companies: ['Meta', 'Vercel', 'Uber', 'Netflix'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 91%',
    isBookmarked: true
  }
];
