import { QuestionItem } from '../../types';

export const DSA_QUESTIONS: QuestionItem[] = [
  {
    id: 'dsa-1',
    slug: 'sliding-window-longest-substring-distinct',
    title: 'Sliding Window Algorithm: Longest Substring Without Repeating Characters & Substring Optimization',
    questionText: 'Given a string `s`, find the length of the longest substring without repeating characters. Explain how the dynamic-size sliding window pattern achieves O(n) time complexity compared to the brute force O(n²) approach.',
    category: 'Data Structures & Algorithms',
    categoryId: 'dsa',
    topicId: 'sliding-window',
    subtopicId: 'dynamic-window',
    difficulty: 'Medium',
    questionType: 'Coding',
    roleTarget: 'Software Engineer',
    roleIds: ['software-engineer', 'junior-software-dev', 'fullstack-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Master the dynamic two-pointer sliding window using a hash map to skip invalid duplicate characters in O(n) single pass.',
    shortAnswer: 'The dynamic sliding window maintains two pointers: `left` and `right`. As `right` iterates through the string, we record each character’s latest seen index in a hash map. If the current character was already seen inside our active window (`map.get(char) >= left`), we instantly jump `left` to `lastSeenIndex + 1`, eliminating the duplicate without re-evaluating intermediate characters. At each step, we update `maxLength = Math.max(maxLength, right - left + 1)`. This runs in O(n) time and O(min(n, m)) space where m is the alphabet size.',
    detailedAnswer: '1. **Brute Force vs Sliding Window**:\n   - Brute force checks all O(n²) substrings and validates uniqueness with a set in O(n), totaling O(n³).\n   - The sliding window recognizes that if substring `s[left...right]` has a duplicate of `s[right]` at index `j`, any new valid window starting before `j + 1` is guaranteed to still contain the duplicate. Thus, `left` can jump directly to `j + 1`.\n\n2. **Algorithm Execution**:\n   - Initialize `left = 0`, `maxLength = 0`, and a Map `charIndexMap`.\n   - Loop `right` from 0 to `s.length - 1`:\n     - Fetch `prevIndex = charIndexMap.get(s[right])`.\n     - If `prevIndex !== undefined` AND `prevIndex >= left`:\n       - Set `left = prevIndex + 1`.\n     - Store/update `charIndexMap.set(s[right], right)`.\n     - Recalculate `maxLength = Math.max(maxLength, right - left + 1)`.\n   - Return `maxLength`.\n\n3. **Space/Time Complexity**:\n   - **Time**: O(n) single pass; each character is visited by `right` once, and `left` moves strictly forward.\n   - **Space**: O(min(n, m)) where m is the size of the character set (e.g. 128 for ASCII or 26 for English letters).',
    codeExample: {
      language: 'typescript',
      code: `function lengthOfLongestSubstring(s: string): number {
  let maxLength = 0;
  let left = 0;
  const charIndexMap = new Map<string, number>();

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    const prevIndex = charIndexMap.get(char);

    // If duplicate found within current window boundaries, advance left pointer
    if (prevIndex !== undefined && prevIndex >= left) {
      left = prevIndex + 1;
    }

    charIndexMap.set(char, right);
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

// Test cases
console.log(lengthOfLongestSubstring("abcabcbb")); // 3 ("abc")
console.log(lengthOfLongestSubstring("bbbbb"));    // 1 ("b")
console.log(lengthOfLongestSubstring("pwwkew"));   // 3 ("wke")`,
      exampleInput: 's = "abcabcbb"',
      exampleOutput: '3 (The answer is "abc", with the length of 3).'
    },
    commonMistakes: [
      'Forgetting the `prevIndex >= left` boundary check, causing `left` to erroneously jump backwards when encountering a character that occurred before the current window.',
      'Using a nested while loop to shrink the window character by character instead of using a hash map to jump `left` in O(1).',
      'Off-by-one errors in window size calculation (`right - left + 1`).'
    ],
    realWorldUseCases: [
      'Network packet analysis identifying longest non-repeating sequence of IP identifiers.',
      'Rate-limiting sliding window logs calculating unique request timestamps.',
      'DNA sequence genomics matching unique k-mers.'
    ],
    tradeOffs: [
      'Hash map provides O(1) jump lookups at the expense of memory; for fixed ASCII, an integer array of size 128 or 256 offers faster cache locality and zero GC overhead.'
    ],
    followUpQuestions: [
      'How would you adapt this algorithm for the "Longest Substring with At Most K Distinct Characters" problem?',
      'How does the Minimum Window Substring problem differ when we need to match frequencies from a target string T?'
    ],
    relatedQuestionIds: ['dsa-5', 'fe-2', 'be-4'],
    relatedTopicIds: ['sliding-window', 'arrays-strings', 'two-pointers'],
    prerequisiteTopicIds: ['hash-maps', 'time-complexity'],
    nextTopicIds: ['two-pointers', 'dynamic-programming'],
    tags: ['DSA', 'Sliding Window', 'Two Pointers', 'Hash Map', 'Algorithms'],
    keywords: ['sliding window', 'longest substring', 'hash map', 'two pointers', 'leetcode', 'strings']
  },
  {
    id: 'dsa-2',
    slug: 'monotonic-stack-daily-temperatures',
    title: 'Monotonic Stack Pattern: Next Greater Element & Histogram Rectangles',
    questionText: 'What is a Monotonic Stack? How does it resolve the "Daily Temperatures" (Next Greater Element) problem in O(n) linear time instead of O(n²)?',
    category: 'Data Structures & Algorithms',
    categoryId: 'dsa',
    topicId: 'stacks-queues',
    subtopicId: 'monotonic-stack',
    difficulty: 'Medium',
    questionType: 'Coding',
    roleTarget: 'Software Engineer',
    roleIds: ['software-engineer', 'senior-software-eng', 'backend-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Understand strictly decreasing and increasing monotonic stacks to identify nearest larger/smaller elements in a single pass.',
    shortAnswer: 'A Monotonic Stack is a stack data structure whose elements are strictly sorted in either monotonically increasing or decreasing order. For the Next Greater Element / Daily Temperatures problem, we maintain a monotonically decreasing stack of unresolved indices. As we iterate through temperatures, while the current temperature is warmer than the temperature at the index stored on top of the stack, we pop that index and calculate the distance: `result[prevIndex] = currentIndex - prevIndex`. The current index is then pushed onto the stack. Since each index is pushed and popped at most once, the entire algorithm runs in O(n) amortized time.',
    detailedAnswer: '1. **Why Monotonic Stacks Exist**:\n   Whenever an algorithm requires finding the "next greater element", "previous smaller element", or "maximum area rectangle" across an array, a naive nested loop scans backward or forward for each element in O(n²). A monotonic stack acts as an active waiting room for elements whose answers have not yet arrived.\n\n2. **The Mechanics (Decreasing Stack)**:\n   - Let `stack` store indices of temperatures waiting for a warmer day.\n   - For index `i` from 0 to `temperatures.length - 1`:\n     - While `stack.length > 0` and `temperatures[i] > temperatures[stack.peek()]`:\n       - `prevIndex = stack.pop()`\n       - `result[prevIndex] = i - prevIndex`\n     - Push `i` to stack.\n   - Any indices remaining on the stack at the end have no warmer future day and remain 0 in `result`.\n\n3. **Amortized Analysis**:\n   Although the `while` loop is nested inside a `for` loop, every element is pushed to the stack exactly once and popped at most once. Therefore, the total number of operations across the entire array is bounded by 2n, proving strict O(n) time complexity.',
    codeExample: {
      language: 'typescript',
      code: `function dailyTemperatures(temperatures: number[]): number[] {
  const n = temperatures.length;
  const result: number[] = new Array(n).fill(0);
  const stack: number[] = []; // Stores INDICES, maintaining decreasing temperature order

  for (let i = 0; i < n; i++) {
    const currentTemp = temperatures[i];

    // While current temperature is warmer than stack top, resolve stack top!
    while (stack.length > 0 && currentTemp > temperatures[stack[stack.length - 1]]) {
      const prevIndex = stack.pop()!;
      result[prevIndex] = i - prevIndex;
    }

    stack.push(i);
  }

  return result;
}

// Test case:
console.log(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]));
// Output: [1, 1, 4, 2, 1, 1, 0, 0]`,
      exampleInput: 'temperatures = [73, 74, 75, 71, 69, 72, 76, 73]',
      exampleOutput: '[1, 1, 4, 2, 1, 1, 0, 0] (e.g. day 2 temp 75 waits 4 days until day 6 temp 76).'
    },
    commonMistakes: [
      'Pushing values instead of indices onto the stack, preventing distance calculation (`i - prevIndex`).',
      'Using `>=` instead of `>` when strictly greater elements are required.',
      'Assuming nested loops automatically imply O(n²) without calculating amortized push/pop bounds.'
    ],
    realWorldUseCases: [
      'Financial market breakout indicators (identifying subsequent higher-high stock ticks).',
      'UI Layout rendering engines computing Largest Rectangle in Histogram for text layout.',
      'Terrain elevation rainwater retention analysis.'
    ],
    tradeOffs: [
      'Consumes O(n) auxiliary stack space in the worst case (e.g. monotonically decreasing inputs like `[100, 90, 80]`).'
    ],
    followUpQuestions: [
      'How would you use a monotonic stack to solve "Largest Rectangle in Histogram" in O(n) time?',
      'How does a Monotonic Queue differ and how is it used for "Sliding Window Maximum"?'
    ],
    relatedQuestionIds: ['dsa-1', 'dsa-5', 'sd-2'],
    relatedTopicIds: ['stacks-queues', 'arrays-strings', 'algorithms'],
    prerequisiteTopicIds: ['data-structures', 'time-complexity'],
    nextTopicIds: ['monotonic-queue', 'dynamic-programming'],
    tags: ['DSA', 'Monotonic Stack', 'Stacks', 'Next Greater Element', 'Algorithms'],
    keywords: ['monotonic stack', 'daily temperatures', 'next greater element', 'amortized time', 'stack']
  },
  {
    id: 'dsa-3',
    slug: 'topological-sort-kahns-algorithm-cycle-detection',
    title: 'Topological Sort & Cycle Detection: Kahn’s Algorithm for Dependency Graphs',
    questionText: 'Given a list of course prerequisites or build tasks represented as a directed graph, how do you determine if a valid execution order exists, detect circular dependency deadlocks, and return the topological order?',
    category: 'Data Structures & Algorithms',
    categoryId: 'dsa',
    topicId: 'graphs',
    subtopicId: 'topological-sort',
    difficulty: 'Hard',
    questionType: 'Coding',
    roleTarget: 'Software Engineer',
    roleIds: ['software-engineer', 'backend-dev', 'distributed-systems-eng'],
    estimatedTime: '5 mins response',
    estimatedMinutes: 5,
    description: 'Solve Course Schedule II using Kahn’s BFS algorithm with in-degree tracking to detect cycles in Directed Acyclic Graphs (DAGs).',
    shortAnswer: 'Topological sorting linearly orders vertices of a Directed Acyclic Graph (DAG) such that for every directed edge u -> v, u appears before v. Kahn’s Algorithm accomplishes this using BFS with in-degree counting: 1) Build an adjacency list and calculate the in-degree (number of incoming edges) for every vertex, 2) Enqueue all vertices with an in-degree of 0 (no prerequisites), 3) While the queue is not empty, dequeue vertex u, append u to the topological order, and decrement the in-degree of all its neighbors v. If any neighbor’s in-degree drops to 0, enqueue it. If the final ordered list length equals total vertices, a valid order exists; otherwise, the graph contains a circular dependency cycle.',
    detailedAnswer: '1. **Topological Order vs Cycles**:\n   A graph can ONLY be topologically sorted if it is a Directed Acyclic Graph (DAG). If A depends on B, and B depends on A, neither can ever reach in-degree 0, causing Kahn’s BFS queue to terminate prematurely.\n\n2. **Kahn’s Algorithm Steps**:\n   - Step 1: Create `adj = Map<number, number[]>()` and `inDegree = new Array(numCourses).fill(0)`.\n   - Step 2: For each prerequisite `[course, prereq]`, add `course` to `adj[prereq]` and increment `inDegree[course]++`.\n   - Step 3: Initialize `queue` with all courses having `inDegree[i] === 0`.\n   - Step 4: Process BFS:\n     - `curr = queue.shift()`\n     - `order.push(curr)`\n     - For each `neighbor` in `adj[curr]`:\n       - `inDegree[neighbor]--`\n       - If `inDegree[neighbor] === 0`, push to `queue`.\n   - Step 5: Check `order.length === numCourses`. If true, return `order`; if false, return empty array (cycle detected).\n\n3. **Complexity**:\n   - **Time**: O(V + E) where V is vertices (courses) and E is edges (prerequisites). Every edge and vertex is visited once.\n   - **Space**: O(V + E) for the adjacency list, in-degree array, and BFS queue.',
    codeExample: {
      language: 'typescript',
      code: `function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const adj = new Map<number, number[]>();
  const inDegree = new Array(numCourses).fill(0);
  const order: number[] = [];

  // 1. Build graph & calculate in-degrees
  // [course, prereq] implies prereq -> course
  for (const [course, prereq] of prerequisites) {
    if (!adj.has(prereq)) adj.set(prereq, []);
    adj.get(prereq)!.push(course);
    inDegree[course]++;
  }

  // 2. Enqueue all vertices with 0 incoming dependencies
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  // 3. BFS Traversal
  while (queue.length > 0) {
    const curr = queue.shift()!;
    order.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const next of neighbors) {
      inDegree[next]--;
      if (inDegree[next] === 0) {
        queue.push(next);
      }
    }
  }

  // 4. If processed count != total vertices, a cycle exists
  return order.length === numCourses ? order : [];
}

// Test case: 4 courses where [1,0] means course 0 must be taken before course 1
console.log(findOrder(4, [[1,0],[2,0],[3,1],[3,2]]));
// Output: [0, 1, 2, 3] or [0, 2, 1, 3]`,
      exampleInput: 'numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]',
      exampleOutput: '[0, 1, 2, 3] (Take 0 first, then 1 and 2 in either order, finally 3).'
    },
    commonMistakes: [
      'Inverting edge direction (interpreting `[u, v]` as `u -> v` when the problem specification declares `v` is prerequisite for `u`).',
      'Failing to detect cycles when the queue empties early before all vertices are visited.',
      'Using DFS without maintaining a three-state coloring (Unvisited, Visiting, Visited) to differentiate back-edges (cycles) from cross-edges.'
    ],
    realWorldUseCases: [
      'Package dependency managers (npm, pip, cargo) computing installation sequences.',
      'Build systems (Webpack, Turborepo, Vite) resolving module compilation graphs.',
      'Database migration runner executing foreign key schema migrations in topological order.'
    ],
    tradeOffs: [
      'Kahn’s BFS produces a natural level-by-level parallelization order (all nodes in queue at the same time can be compiled in parallel), whereas DFS-based topological sort requires recursion stack depth.'
    ],
    followUpQuestions: [
      'How would you adapt Kahn’s algorithm to run tasks in parallel using a thread pool or worker queue?',
      'How do you find the specific nodes participating in the cycle using Tarjan’s strongly connected components algorithm?'
    ],
    relatedQuestionIds: ['be-3', 'sd-1', 'dsa-4'],
    relatedTopicIds: ['graphs', 'breadth-first-search', 'algorithms'],
    prerequisiteTopicIds: ['graphs-fundamentals', 'queues'],
    nextTopicIds: ['tarjan-scc', 'distributed-systems'],
    tags: ['DSA', 'Graphs', 'Topological Sort', 'Kahns Algorithm', 'Cycle Detection'],
    keywords: ['topological sort', 'kahns algorithm', 'bfs', 'dag', 'directed acyclic graph', 'cycle detection', 'course schedule']
  },
  {
    id: 'dsa-4',
    slug: 'dynamic-programming-coin-change-state-transition',
    title: 'Dynamic Programming: State Space Modeling & 1D Space Optimization (Coin Change)',
    questionText: 'Given an integer array `coins` representing coin denominations and an integer `amount`, return the fewest number of coins needed to make up that amount. How do you design the state transition formula and optimize space from O(n * amount) to O(amount)?',
    category: 'Data Structures & Algorithms',
    categoryId: 'dsa',
    topicId: 'dynamic-programming',
    subtopicId: 'unbounded-knapsack',
    difficulty: 'Medium',
    questionType: 'Coding',
    roleTarget: 'Software Engineer',
    roleIds: ['software-engineer', 'fullstack-dev', 'senior-software-eng'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Master unbounded knapsack dynamic programming: state definitions, base cases, recurrence relations, and space optimization.',
    shortAnswer: 'The Coin Change problem is an Unbounded Knapsack problem modeled via Dynamic Programming. Let `dp[i]` represent the minimum coins required to make sum `i`. The base case is `dp[0] = 0`, and all other values are initialized to infinity (`Infinity`). The recurrence relation is: `dp[i] = min(dp[i], dp[i - coin] + 1)` for every coin denomination where `coin <= i`. By computing solutions bottom-up from 1 to `amount`, we reuse previously solved subproblems. The algorithm runs in O(amount * len(coins)) time and requires only O(amount) 1D space.',
    detailedAnswer: '1. **Overlapping Subproblems & Optimal Substructure**:\n   To make amount 11 with coins `[1, 2, 5]`, the optimal solution is `1 + min(coins to make 10, coins to make 9, coins to make 6)`. Subproblems overlap heavily (e.g., amount 5 is queried repeatedly in a naive recursion tree of O(k^n)).\n\n2. **State Definition & Transition**:\n   - Let `dp = new Array(amount + 1).fill(Infinity)`\n   - Base Case: `dp[0] = 0` (0 coins needed for 0 amount)\n   - For `i` from 1 to `amount`:\n     - For each `coin` in `coins`:\n       - If `i - coin >= 0`:\n         - `dp[i] = Math.min(dp[i], dp[i - coin] + 1)`\n   - Final Answer: `dp[amount] === Infinity ? -1 : dp[amount]`.\n\n3. **Why 1D Array is Sufficient**:\n   In classic 2D knapsack DP `dp[coin_index][current_amount]`, because coins can be reused infinitely (unbounded), the state for `current_amount` depends only on the current row’s earlier values (`i - coin`), allowing in-place updates of a single 1D array of size `amount + 1`.',
    codeExample: {
      language: 'typescript',
      code: `function coinChange(coins: number[], amount: number): number {
  // dp[i] stores min coins needed to form amount i
  const dp: number[] = new Array(amount + 1).fill(Infinity);
  dp[0] = 0; // Base case: 0 coins for amount 0

  // Iterate through all sub-amounts from 1 to target
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

// Test cases
console.log(coinChange([1, 2, 5], 11)); // 3 (5 + 5 + 1)
console.log(coinChange([2], 3));          // -1 (impossible)
console.log(coinChange([1], 0));          // 0`,
      exampleInput: 'coins = [1, 2, 5], amount = 11',
      exampleOutput: '3 (11 = 5 + 5 + 1)'
    },
    commonMistakes: [
      'Attempting a Greedy approach (always picking the largest coin). For coins `[1, 6, 10]` and amount 12, greedy picks 10 + 1 + 1 = 3 coins, whereas DP correctly finds 6 + 6 = 2 coins.',
      'Initializing the DP array with `0` or `Number.MAX_VALUE` without handling arithmetic overflow when adding `+ 1`.',
      'Confusing the outer and inner loops when counting combinations vs permutations.'
    ],
    realWorldUseCases: [
      'Currency conversion and vending machine physical coin dispatchers.',
      'Cloud compute packing: fitting container workloads into minimum instance sizes.',
      'Cutting stock optimization minimizing raw material wastage in manufacturing.'
    ],
    tradeOffs: [
      'DP time complexity is pseudo-polynomial: O(amount * N). If `amount` is 10^9, DP exceeds memory and time limits, requiring Branch-and-Bound integer linear programming.'
    ],
    followUpQuestions: [
      'How does the recurrence change if you want to find the NUMBER OF WAYS (combinations) to make the amount instead of the minimum coins?',
      'How does the 0/1 Knapsack problem differ where each coin/item can only be picked at most once?'
    ],
    relatedQuestionIds: ['dsa-1', 'dsa-2', 'dsa-3'],
    relatedTopicIds: ['dynamic-programming', 'algorithms', 'arrays-strings'],
    prerequisiteTopicIds: ['recursion', 'time-complexity'],
    nextTopicIds: ['01-knapsack', 'dp-tree'],
    tags: ['DSA', 'Dynamic Programming', 'Unbounded Knapsack', 'Algorithms'],
    keywords: ['coin change', 'dynamic programming', 'dp', 'knapsack', 'optimization', 'recurrence']
  },
  {
    id: 'dsa-5',
    slug: 'two-pointers-trapping-rain-water',
    title: 'Two Pointers Pattern: Trapping Rain Water in O(1) Space',
    questionText: 'Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining. How does the Two-Pointer approach eliminate the O(n) auxiliary arrays of the dynamic programming approach?',
    category: 'Data Structures & Algorithms',
    categoryId: 'dsa',
    topicId: 'two-pointers',
    subtopicId: 'in-place-two-pointers',
    difficulty: 'Hard',
    questionType: 'Coding',
    roleTarget: 'Software Engineer',
    roleIds: ['software-engineer', 'senior-software-eng', 'software-architect'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Solve Trapping Rain Water in O(n) time and O(1) auxiliary space using inward-moving left and right pointers.',
    shortAnswer: 'The volume of water trapped at any bar `i` is determined by `min(maxLeft, maxRight) - height[i]`. Instead of precomputing `leftMax` and `rightMax` arrays in O(n) space, the Two-Pointer approach uses pointers `left = 0` and `right = height.length - 1` with variables `maxLeft` and `maxRight`. At each step, if `height[left] < height[right]`, we know with certainty that the limiting factor is `maxLeft` regardless of future right heights. If `height[left] >= maxLeft`, we update `maxLeft`; otherwise, we add `maxLeft - height[left]` to total water and advance `left++`. Symmetrically, if `height[right] <= height[left]`, we process `right--`. This achieves O(n) time with O(1) space.',
    detailedAnswer: '1. **The Core Physical Principle**:\n   Water cannot spill over the shorter of the two bounding walls. For index `left`, as long as `height[left] < height[right]`, we know there exists some boundary on the right that is at least as tall as `height[left]`. Hence, `maxRight` will never be the bottleneck for `left`.\n\n2. **Algorithm Execution**:\n   - Initialize `left = 0`, `right = height.length - 1`.\n   - Initialize `maxLeft = 0`, `maxRight = 0`, `totalWater = 0`.\n   - While `left < right`:\n     - If `height[left] < height[right]`:\n       - If `height[left] >= maxLeft` -> `maxLeft = height[left]`\n       - Else -> `totalWater += maxLeft - height[left]`\n       - `left++`\n     - Else:\n       - If `height[right] >= maxRight` -> `maxRight = height[right]`\n       - Else -> `totalWater += maxRight - height[right]`\n       - `right--`\n   - Return `totalWater`.\n\n3. **Complexity Comparison**:\n   - Brute force: O(n²) time, O(1) space.\n   - Prefix/Suffix DP arrays: O(n) time, O(n) space.\n   - Two Pointers: O(n) time, O(1) space.',
    codeExample: {
      language: 'typescript',
      code: `function trap(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let maxLeft = 0;
  let maxRight = 0;
  let totalWater = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= maxLeft) {
        maxLeft = height[left];
      } else {
        totalWater += maxLeft - height[left];
      }
      left++;
    } else {
      if (height[right] >= maxRight) {
        maxRight = height[right];
      } else {
        totalWater += maxRight - height[right];
      }
      right--;
    }
  }

  return totalWater;
}

// Test case:
console.log(trap([0,1,0,2,1,0,1,3,2,1,2,1])); // 6
console.log(trap([4,2,0,3,2,5]));             // 9`,
      exampleInput: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
      exampleOutput: '6 (Units of trapped rainwater between bars).'
    },
    commonMistakes: [
      'Advancing both pointers simultaneously instead of advancing only the pointer with the smaller height.',
      'Forgetting to update `maxLeft` or `maxRight` before accumulating water, resulting in negative water values.',
      'Using a monotonic stack when the two-pointer approach accomplishes the task with lower constant factors and O(1) space.'
    ],
    realWorldUseCases: [
      'Topographical terrain water catchment runoff simulation in GIS software.',
      'Histogram peak detection and valley extraction in image processing.',
      'Buffer allocation in streaming media players.'
    ],
    tradeOffs: [
      'The two-pointer technique relies strictly on the sorted nature or bilateral constraints of the array; it cannot be applied if elements cannot be independently bounded from both extremities.'
    ],
    followUpQuestions: [
      'How would you solve the 3D version of this problem: Trapping Rain Water II on an m x n matrix using a Priority Queue / Min-Heap?',
      'How does Container With Most Water (LeetCode 11) differ in its area calculation?'
    ],
    relatedQuestionIds: ['dsa-1', 'dsa-2', 'dsa-4'],
    relatedTopicIds: ['two-pointers', 'arrays-strings', 'algorithms'],
    prerequisiteTopicIds: ['arrays-strings', 'time-complexity'],
    nextTopicIds: ['heaps-priority-queues', 'monotonic-stack'],
    tags: ['DSA', 'Two Pointers', 'Trapping Rain Water', 'Algorithms', 'Array'],
    keywords: ['two pointers', 'trapping rain water', 'in-place', 'space optimization', 'arrays']
  }
];
