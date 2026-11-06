// Curriculum for the "Data Structures and Algorithms" subject.
// Quiz question format: [question, CORRECT answer, wrong, wrong, wrong, difficulty]
// The seed script shuffles the options (deterministically) and records the correct index.
const subject = {
  name: 'Data Structures and Algorithms',
  code: 'DSA',
  description: 'Core data structures and algorithms, from variables to dynamic programming.',
  university: 'General',
};

// [key, name, difficulty, estimatedHours, description, [prerequisite keys], [questions]]
const concepts = [
  ['variables', 'Variables and Data Types', 'beginner', 2, 'Storing values and choosing the right data type.', [], [
    ['What does a variable do?', 'Names a storage location that holds a value', 'Repeats a block of code', 'Defines the order functions run', 'Compresses data', 'easy'],
    ['Which data type is best for storing true/false?', 'Boolean', 'Integer', 'Float', 'Character array', 'easy'],
    ['In C or Java, what is 7 / 2 when both operands are ints?', '3', '3.5', '4', 'Compile error', 'medium'],
  ]],
  ['control', 'Control Flow', 'beginner', 2, 'Conditions and loops that decide what runs and how often.', ['variables'], [
    ['Which structure runs a block only if a condition is true?', 'if statement', 'Loop counter', 'Function call', 'Variable declaration', 'easy'],
    ['How many times does a loop "for i = 0; i < 5; i++" execute its body?', '5', '4', '6', 'Infinitely many', 'easy'],
    ['What does "break" do inside a loop?', 'Exits the loop immediately', 'Skips to the next iteration', 'Restarts the loop', 'Ends the program', 'medium'],
  ]],
  ['functions', 'Functions', 'beginner', 2, 'Reusable blocks of code with parameters and return values.', ['variables'], [
    ['What does a return statement do?', 'Ends the function and sends a value back to the caller', 'Prints a value', 'Declares a variable', 'Starts a loop', 'easy'],
    ['What is a parameter?', 'A named input listed in a function definition', 'The value a function returns', 'A loop counter', 'A comment', 'easy'],
    ['Variables declared inside a function are usually visible...', 'Only inside that function', 'Everywhere in the program', 'Only in other functions', 'Only before the program starts', 'medium'],
  ]],
  ['arrays', 'Arrays', 'beginner', 3, 'Contiguous, index-addressable collections.', [], [
    ['Accessing arr[i] in an array takes...', 'O(1)', 'O(n)', 'O(log n)', 'O(n^2)', 'easy'],
    ['Array indices in most languages start at...', '0', '1', '-1', '2', 'easy'],
    ['Inserting at the beginning of an array of n elements needs shifting about...', 'n elements', '0 elements', '1 element', 'log n elements', 'medium'],
  ]],
  ['strings', 'Strings', 'beginner', 2, 'Sequences of characters and common string operations.', ['arrays', 'control'], [
    ['A string is best described as...', 'A sequence of characters', 'A single number', 'A sorted array of integers', 'A hash value', 'easy'],
    ['Which of these is a palindrome?', 'level', 'lever', 'leaf', 'lemon', 'easy'],
    ['Why can repeated concatenation in a loop be slow when strings are immutable?', 'Each concatenation copies into a new string', 'Strings cannot be used in loops', 'It forces recursion', 'It sorts the string each time', 'medium'],
  ]],
  ['recursion', 'Recursion', 'intermediate', 4, 'Functions that solve a problem by calling themselves on smaller inputs.', ['functions'], [
    ['What is recursion?', 'A function that calls itself', 'A loop with a counter', 'A sorting method', 'A type of variable', 'easy'],
    ['Every correct recursive function needs a...', 'Base case', 'Global variable', 'Pointer', 'Sorted input', 'easy'],
    ['What usually happens if a recursive function never reaches its base case?', 'Stack overflow', 'It returns 0', 'It runs exactly once', 'It skips the call', 'medium'],
  ]],
  ['complexity', 'Time and Space Complexity', 'beginner', 3, 'Big-O notation for comparing algorithms.', ['control'], [
    ['Binary search on n sorted items has time complexity...', 'O(log n)', 'O(1)', 'O(n)', 'O(n log n)', 'easy'],
    ['Which grows fastest as n becomes large?', 'O(n^2)', 'O(n)', 'O(n log n)', 'O(log n)', 'easy'],
    ['Two nested loops that each run n times give...', 'O(n^2)', 'O(n)', 'O(2n)', 'O(log n)', 'medium'],
  ]],
  ['pointers', 'Pointers and References', 'intermediate', 3, 'Addresses and references to values in memory.', ['variables'], [
    ['A pointer stores...', 'The memory address of another value', 'A copy of a value', 'A function body', 'A loop index', 'easy'],
    ['What is a null pointer?', 'A pointer that refers to nothing', 'A pointer to the first array element', 'A pointer to a function', 'A pointer to a string', 'easy'],
    ['Two references point to the same object. Changing the object through one reference...', 'Is visible through the other', 'Does not affect the other', 'Deletes the other reference', 'Copies the object', 'medium'],
  ]],
  ['linkedlist', 'Linked Lists', 'intermediate', 4, 'Nodes chained together by pointers.', ['pointers'], [
    ['Each node of a singly linked list holds...', 'Data and a pointer to the next node', 'Only data', 'Two arrays', 'Data and an index', 'easy'],
    ['Inserting at the head of a linked list takes...', 'O(1)', 'O(n)', 'O(log n)', 'O(n^2)', 'medium'],
    ['Accessing the k-th element of a linked list takes...', 'O(k)', 'O(1)', 'O(log k)', 'O(k^2)', 'medium'],
  ]],
  ['stack', 'Stacks', 'intermediate', 3, 'Last-in, first-out collections.', ['arrays'], [
    ['A stack follows which order?', 'LIFO', 'FIFO', 'Sorted order', 'Random order', 'easy'],
    ['Which operation adds an element to a stack?', 'push', 'pop', 'peek', 'dequeue', 'easy'],
    ['Which problem is naturally solved with a stack?', 'Checking balanced parentheses', 'Level-order tree traversal', 'Shortest path in an unweighted graph', 'First-come first-served scheduling', 'medium'],
  ]],
  ['queue', 'Queues', 'intermediate', 3, 'First-in, first-out collections.', ['arrays'], [
    ['A queue follows which order?', 'FIFO', 'LIFO', 'Sorted order', 'Random order', 'easy'],
    ['Which operation removes the front element of a queue?', 'dequeue', 'enqueue', 'push', 'peek', 'easy'],
    ['Which of these uses a queue?', 'Breadth-first search', 'The recursion call stack', 'Undo history', 'Matching parentheses', 'medium'],
  ]],
  ['hashing', 'Hash Tables', 'intermediate', 4, 'Key-value lookup using hash functions.', ['arrays', 'complexity'], [
    ['Average-case lookup in a hash table is...', 'O(1)', 'O(n)', 'O(log n)', 'O(n log n)', 'easy'],
    ['A hash collision occurs when...', 'Two keys map to the same bucket', 'A key is missing', 'The table is empty', 'A key is deleted', 'medium'],
    ['Which is a common way to resolve collisions?', 'Chaining', 'Recursion', 'Binary search', 'Sorting the keys', 'medium'],
  ]],
  ['binsearch', 'Binary Search', 'beginner', 2, 'Halving a sorted search space.', ['arrays', 'complexity'], [
    ['Binary search requires the data to be...', 'Sorted', 'Unique', 'Stored in a linked list', 'Of length 2^k', 'easy'],
    ['Each step of binary search...', 'Halves the search range', 'Scans one element', 'Sorts the array', 'Doubles the search range', 'easy'],
    ['In a sorted array of 1024 elements, binary search needs at most about how many comparisons?', '10', '32', '512', '1024', 'medium'],
  ]],
  ['sort_basic', 'Elementary Sorting', 'beginner', 3, 'Bubble, selection and insertion sort.', ['arrays', 'control'], [
    ['Bubble sort repeatedly...', 'Swaps adjacent out-of-order elements', 'Splits the array in halves', 'Builds a heap', 'Hashes the elements', 'easy'],
    ['Worst-case time of insertion sort is...', 'O(n^2)', 'O(n)', 'O(n log n)', 'O(log n)', 'medium'],
    ['Which of these sorts is stable?', 'Insertion sort', 'Selection sort (swap version)', 'Heap sort', 'Quick sort (typical)', 'hard'],
  ]],
  ['sort_fast', 'Merge Sort and Quick Sort', 'intermediate', 4, 'Divide-and-conquer sorting in O(n log n).', ['sort_basic', 'recursion'], [
    ['Merge sort runs in which time in all cases?', 'O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)', 'easy'],
    ['Quick sort has which worst-case time?', 'O(n^2)', 'O(n log n)', 'O(n)', 'O(log n)', 'medium'],
    ['Merge sort is an example of which paradigm?', 'Divide and conquer', 'Greedy', 'Backtracking', 'Dynamic programming', 'easy'],
  ]],
  ['twopointers', 'Two Pointers and Sliding Window', 'intermediate', 3, 'Linear-time scans over arrays and strings.', ['arrays', 'strings'], [
    ['Two pointers on a sorted array can find a pair with a given sum in...', 'O(n)', 'O(n^2)', 'O(log n)', 'O(n^3)', 'medium'],
    ['A sliding window is best suited to problems about...', 'Contiguous subarrays or substrings', 'Tree depth', 'Hash collisions', 'Graph cycles', 'easy'],
    ['How many windows of size k exist in an array of n elements (k <= n)?', 'n - k + 1', 'n * k', 'k', 'n + k', 'medium'],
  ]],
  ['trees', 'Trees', 'intermediate', 4, 'Hierarchical structures of nodes and edges.', ['linkedlist', 'recursion'], [
    ['A tree node with no children is called a...', 'Leaf', 'Root', 'Parent', 'Edge', 'easy'],
    ['A tree with n nodes has how many edges?', 'n - 1', 'n', 'n + 1', '2n', 'medium'],
    ['What is the height (in edges) of a tree with a single node?', '0', '1', '2', '-1', 'medium'],
  ]],
  ['bst', 'Binary Search Trees', 'intermediate', 4, 'Ordered binary trees with fast search.', ['trees', 'binsearch'], [
    ['In a BST, the left subtree contains keys that are...', 'Smaller than the node', 'Larger than the node', 'Equal to the node', 'In random order', 'easy'],
    ['Average search time in a balanced BST is...', 'O(log n)', 'O(n)', 'O(1)', 'O(n^2)', 'easy'],
    ['Worst-case search in an unbalanced BST (for example after sorted inserts) is...', 'O(n)', 'O(log n)', 'O(1)', 'O(n log n)', 'medium'],
  ]],
  ['heaps', 'Heaps and Priority Queues', 'intermediate', 4, 'Complete binary trees with the heap property.', ['trees', 'arrays'], [
    ['In a min-heap, the root is the...', 'Smallest element', 'Largest element', 'Median', 'Newest element', 'easy'],
    ['Inserting into a binary heap takes...', 'O(log n)', 'O(1)', 'O(n)', 'O(n^2)', 'medium'],
    ['Which structure typically implements a priority queue?', 'Binary heap', 'Stack', 'Plain queue', 'Trie', 'easy'],
  ]],
  ['traversal', 'Tree Traversals', 'intermediate', 3, 'Preorder, inorder, postorder and level-order.', ['trees', 'recursion', 'queue'], [
    ['Inorder traversal of a BST visits keys in...', 'Sorted order', 'Reverse sorted order', 'Random order', 'Level order', 'medium'],
    ['Level-order traversal uses a...', 'Queue', 'Stack', 'Heap', 'Hash table', 'easy'],
    ['Preorder traversal visits nodes in which order?', 'Node, left, right', 'Left, node, right', 'Left, right, node', 'Right, node, left', 'easy'],
  ]],
  ['avl', 'AVL Trees', 'advanced', 5, 'Self-balancing binary search trees.', ['bst'], [
    ['In an AVL tree, every balance factor must be...', '-1, 0 or 1', '0 only', 'Between -2 and 2', 'Positive', 'medium'],
    ['Balance is restored after an insertion using...', 'Rotations', 'Hashing', 'Sorting', 'Queues', 'easy'],
    ['Worst-case search time in an AVL tree is...', 'O(log n)', 'O(n)', 'O(1)', 'O(n^2)', 'medium'],
  ]],
  ['trie', 'Tries', 'advanced', 3, 'Prefix trees for fast string lookup.', ['trees', 'hashing'], [
    ['Tries are mainly used for...', 'Prefix searches on strings', 'Sorting numbers', 'Finding shortest paths', 'Balancing trees', 'easy'],
    ['Looking up a word of length L in a trie takes...', 'O(L)', 'O(n)', 'O(log n)', 'O(L^2)', 'medium'],
    ['Each edge in a typical trie represents...', 'A character', 'A weight', 'A hash', 'A node count', 'easy'],
  ]],
  ['graphs', 'Graphs', 'intermediate', 4, 'Vertices, edges and their representations.', ['arrays', 'hashing'], [
    ['A graph consists of...', 'Vertices and edges', 'Only nodes', 'Arrays and loops', 'Keys and values', 'easy'],
    ['An adjacency list uses how much space for V vertices and E edges?', 'O(V + E)', 'O(V^2)', 'O(E^2)', 'O(1)', 'medium'],
    ['The edges of a directed graph...', 'Have a direction', 'Have no direction', 'Always form a cycle', 'Are always weighted', 'easy'],
  ]],
  ['bfsdfs', 'BFS and DFS', 'intermediate', 4, 'Breadth-first and depth-first graph traversal.', ['graphs', 'stack', 'queue', 'recursion'], [
    ['Breadth-first search uses a...', 'Queue', 'Stack', 'Heap', 'Trie', 'easy'],
    ['BFS finds shortest paths (fewest edges) in...', 'Unweighted graphs', 'Graphs with negative edges', 'Weighted graphs only', 'Only DAGs', 'medium'],
    ['Depth-first search can be implemented with...', 'Recursion or an explicit stack', 'Only a queue', 'Only a heap', 'Only sorting', 'easy'],
  ]],
  ['shortest', 'Shortest Paths', 'advanced', 5, 'Dijkstra and Bellman-Ford.', ['bfsdfs', 'heaps'], [
    ['Dijkstra\'s algorithm requires edge weights to be...', 'Non-negative', 'Negative', 'Integers only', 'All equal', 'medium'],
    ['Dijkstra\'s algorithm typically uses a...', 'Priority queue', 'Stack', 'Trie', 'Plain queue', 'medium'],
    ['Which algorithm handles negative edge weights (without negative cycles)?', 'Bellman-Ford', 'Dijkstra', 'BFS', 'Prim', 'hard'],
  ]],
  ['unionfind', 'Union-Find', 'advanced', 3, 'Disjoint sets with union and find.', ['arrays', 'trees'], [
    ['Union-Find supports which operations?', 'Union and find of sets', 'Sorting', 'Matrix multiplication', 'String matching', 'easy'],
    ['Path compression...', 'Flattens trees to speed up find', 'Sorts the elements', 'Deletes nodes', 'Balances a BST', 'medium'],
    ['Union-Find is commonly used to detect...', 'Cycles in undirected graphs', 'Palindromes', 'The median', 'Heap order violations', 'medium'],
  ]],
  ['mst', 'Minimum Spanning Trees', 'advanced', 4, 'Kruskal and Prim.', ['graphs', 'unionfind', 'sort_basic'], [
    ['A minimum spanning tree of a connected graph with V vertices has how many edges?', 'V - 1', 'V', 'V + 1', '2V', 'medium'],
    ['Kruskal\'s algorithm starts by sorting...', 'Edges by weight', 'Vertices by degree', 'Nodes alphabetically', 'Paths by length', 'medium'],
    ['Prim\'s algorithm grows the tree by adding the...', 'Cheapest edge leaving the tree', 'Most expensive edge', 'A random edge', 'Edge to the vertex with most neighbours', 'hard'],
  ]],
  ['toposort', 'Topological Sort', 'advanced', 3, 'Ordering a DAG so prerequisites come first.', ['bfsdfs'], [
    ['A topological ordering exists only for...', 'Directed acyclic graphs', 'Undirected graphs', 'Any graph', 'Trees only', 'easy'],
    ['Kahn\'s algorithm repeatedly removes nodes with...', 'Zero in-degree', 'Zero out-degree', 'Maximum degree', 'Minimum weight', 'medium'],
    ['In a valid topological order, for each edge u -> v, u appears...', 'Before v', 'After v', 'Next to v', 'At the very end', 'easy'],
  ]],
  ['backtracking', 'Backtracking', 'advanced', 4, 'Exploring choices and undoing them.', ['recursion'], [
    ['Backtracking builds solutions step by step and...', 'Abandons partial solutions that cannot work', 'Never abandons a branch', 'Only uses sorting', 'Only uses loops', 'easy'],
    ['N-Queens is a classic problem for...', 'Backtracking', 'Binary search', 'Union-Find', 'Hashing', 'easy'],
    ['Pruning in backtracking...', 'Cuts branches that cannot lead to a solution', 'Sorts the input', 'Merges solutions', 'Enlarges the search space', 'medium'],
  ]],
  ['greedy', 'Greedy Algorithms', 'intermediate', 3, 'Making the best local choice at every step.', ['sort_basic', 'complexity'], [
    ['A greedy algorithm...', 'Takes the best local choice at each step', 'Tries every possibility', 'Always uses recursion', 'Stores all subproblems', 'easy'],
    ['Which problem is classically solved with a greedy algorithm?', 'Activity selection', '0/1 knapsack', 'Longest common subsequence', 'Edit distance', 'medium'],
    ['Greedy choices are guaranteed optimal when the problem has...', 'The greedy-choice property and optimal substructure', 'Negative weights', 'Sorted input', 'Small size', 'hard'],
  ]],
  ['dp', 'Dynamic Programming', 'advanced', 6, 'Solving problems using overlapping subproblems.', ['arrays', 'recursion'], [
    ['Dynamic programming applies when a problem has...', 'Overlapping subproblems and optimal substructure', 'No subproblems', 'Only sorted input', 'Only graph input', 'medium'],
    ['Memoization means...', 'Caching results of subproblems', 'Compiling the program', 'Sorting the input', 'Deleting variables', 'easy'],
    ['Naive recursive Fibonacci (no caching) runs in...', 'Exponential time', 'Linear time', 'Logarithmic time', 'Constant time', 'hard'],
  ]],
];

module.exports = { subject, concepts };
