import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import Question from "../models/Question.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// [category, difficulty, question, answer]
const Q = [
  ['Java', 'Easy', 'What is the difference between JDK, JRE and JVM?', 'JVM runs bytecode. JRE = JVM + core libraries needed to run programs. JDK = JRE + development tools (javac, debugger) needed to build programs.'],
  ['Java', 'Easy', 'What is the difference between == and equals()?', '== compares references for objects (or values for primitives). equals() compares logical content when overridden, as in String and wrapper classes.'],
  ['Java', 'Medium', 'How does HashMap work internally?', 'It stores entries in an array of buckets chosen by hash(key) & (n-1). Collisions form a linked list that becomes a balanced tree after 8 entries (Java 8+). It resizes at 0.75 load factor.'],
  ['Java', 'Medium', 'Explain the difference between an abstract class and an interface.', 'Abstract classes can hold state and constructors and support single inheritance. Interfaces define contracts (with default/static methods since Java 8) and a class can implement many.'],
  ['Java', 'Hard', 'What is the Java Memory Model and what does volatile guarantee?', 'The JMM defines visibility and ordering rules between threads. volatile guarantees visibility of writes and prevents reordering around the access, but does not make compound actions like i++ atomic.'],
  ['Python', 'Easy', 'What is the difference between a list and a tuple?', 'Lists are mutable and tuples are immutable. Tuples are hashable (if their items are) so they can be dictionary keys, and are slightly faster and lighter.'],
  ['Python', 'Medium', 'What are decorators?', 'A decorator is a callable that takes a function and returns a new function that wraps it, adding behaviour such as logging, caching or auth without changing the original code. Syntax: @decorator.'],
  ['Python', 'Medium', 'Explain the GIL.', 'The Global Interpreter Lock lets only one thread execute Python bytecode at a time in CPython. It limits CPU-bound threading, so use multiprocessing for CPU work and threads/asyncio for I/O.'],
  ['Python', 'Easy', 'What is the difference between deep copy and shallow copy?', 'A shallow copy duplicates the outer object but shares nested objects. A deep copy recursively copies everything so changes to nested objects do not affect the original.'],
  ['Python', 'Hard', 'How do generators work and why use them?', 'Functions with yield return an iterator that produces values lazily and keeps local state between calls. They use constant memory for large or infinite streams.'],
  ['DSA', 'Easy', 'Array vs linked list: when would you choose each?', 'Arrays give O(1) random access and cache-friendly iteration; inserts/deletes in the middle are O(n). Linked lists give O(1) insert/delete given a node but O(n) access.'],
  ['DSA', 'Medium', 'Explain the time complexity of quicksort.', 'Average O(n log n), worst O(n^2) with bad pivots (e.g. sorted input and a first-element pivot). Randomised or median-of-three pivots make the worst case unlikely. Space O(log n).'],
  ['DSA', 'Medium', 'How do you detect a cycle in a linked list?', "Floyd's tortoise and hare: move slow by 1 and fast by 2. If they meet there is a cycle; if fast hits null there is none. O(n) time, O(1) space."],
  ['DSA', 'Medium', 'BFS vs DFS: differences and use cases?', 'BFS uses a queue and explores level by level, finding shortest paths in unweighted graphs. DFS uses a stack/recursion, suits topological sort, cycle detection and backtracking.'],
  ['DSA', 'Hard', 'What is dynamic programming and when is it applicable?', 'DP solves problems with overlapping subproblems and optimal substructure by storing sub-results (memoisation or tabulation), turning exponential recursion into polynomial time.'],
  ['DBMS', 'Easy', 'What are ACID properties?', 'Atomicity (all or nothing), Consistency (valid state to valid state), Isolation (concurrent transactions do not interfere), Durability (committed data survives failures).'],
  ['DBMS', 'Easy', 'What is the difference between primary key and unique key?', 'A table has one primary key, which cannot be NULL. It can have many unique keys, and they may allow a NULL (depending on the DBMS).'],
  ['DBMS', 'Medium', 'Explain normalization and the first three normal forms.', '1NF: atomic values. 2NF: 1NF and no partial dependency on part of a composite key. 3NF: 2NF and no transitive dependency of non-key attributes on the key. It reduces redundancy and anomalies.'],
  ['DBMS', 'Medium', 'What is the difference between INNER JOIN and LEFT JOIN?', 'INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table plus matches from the right, with NULLs where there is no match.'],
  ['DBMS', 'Hard', 'How does an index speed up queries and what are the trade-offs?', 'Indexes (usually B-trees) let the engine locate rows without a full scan. Trade-offs: extra storage and slower writes because the index must be maintained.'],
  ['Operating System', 'Easy', 'What is the difference between a process and a thread?', 'A process has its own address space and resources. Threads share a process address space and resources but have their own stack and registers, so they are cheaper to create and switch.'],
  ['Operating System', 'Medium', 'What is a deadlock and what are the necessary conditions?', 'Processes wait forever on each other. Conditions: mutual exclusion, hold and wait, no preemption, circular wait. Break any one to prevent deadlock.'],
  ['Operating System', 'Medium', 'Explain paging and virtual memory.', 'Paging splits memory into fixed-size pages mapped to frames via page tables. Virtual memory lets processes use more memory than RAM by swapping pages to disk on page faults.'],
  ['Operating System', 'Medium', 'Compare FCFS, SJF and Round Robin scheduling.', 'FCFS is simple but suffers the convoy effect. SJF minimises average waiting time but can starve long jobs. Round Robin gives each process a time quantum, good for responsiveness.'],
  ['Operating System', 'Hard', 'What is the difference between a mutex and a semaphore?', 'A mutex is a lock owned by the thread that locked it, giving mutual exclusion. A semaphore is a counter for signalling or limiting access to N resources, and any thread can signal it.'],
  ['Computer Networks', 'Easy', 'Explain the OSI model layers.', 'Physical, Data Link, Network, Transport, Session, Presentation, Application. Each layer provides services to the one above and uses the one below.'],
  ['Computer Networks', 'Easy', 'TCP vs UDP?', 'TCP is connection-oriented, reliable and ordered with flow/congestion control. UDP is connectionless and faster with no delivery guarantee, used for streaming, DNS and gaming.'],
  ['Computer Networks', 'Medium', 'What happens when you type a URL in the browser?', 'DNS resolves the domain, the browser opens a TCP connection (and TLS handshake for HTTPS), sends an HTTP request, the server responds, and the browser renders the HTML and loads sub-resources.'],
  ['Computer Networks', 'Medium', 'What is the TCP three-way handshake?', 'The client sends SYN, the server replies SYN-ACK, the client sends ACK. This synchronises sequence numbers and establishes the connection.'],
  ['Computer Networks', 'Hard', 'How does HTTPS/TLS secure communication?', 'The server presents a certificate; client and server agree on keys through an asymmetric handshake, then encrypt traffic with a symmetric session key for confidentiality, integrity and server authentication.'],
  ['HR', 'Easy', 'Tell me about yourself.', 'Use present-past-future: who you are now (degree, focus), relevant experience or projects, and what you want next at this company. Keep it to about 90 seconds.'],
  ['HR', 'Easy', 'Why should we hire you?', 'Match your strongest skills and one proof point (a project or result) to the job requirements, and show enthusiasm to learn and contribute quickly.'],
  ['HR', 'Medium', 'What is your greatest weakness?', 'Name a real, non-critical weakness, show the concrete steps you are taking to improve it, and share a small result from that effort.'],
  ['HR', 'Medium', 'Describe a conflict in a team and how you handled it.', 'Use STAR: Situation, Task, Action (listen, understand the other view, find common ground), Result. Emphasise collaboration and what you learned.'],
  ['HR', 'Medium', 'Where do you see yourself in five years?', 'Show ambition aligned with the role: building deep skills, taking ownership of larger work and possibly mentoring, while contributing to the company growth.'],
];

(async () => {
  

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// ADD THIS CODE HERE — before await connectDB()
console.log("URI loaded:", Boolean(process.env.MONGO_URI));

try {
  const uri = new URL(process.env.MONGO_URI);
  console.log("Mongo host:", uri.hostname);
  console.log("Username loaded:", decodeURIComponent(uri.username));
  console.log("Password present:", Boolean(uri.password));
} catch (err) {
  console.log("URI parsing failed:", err.message);
}


  await connectDB();
  if ((await Question.countDocuments()) === 0) {
    await Question.insertMany(Q.map(([category, difficulty, question, answer]) => ({ category, difficulty, question, answer })));
    console.log(`Seeded ${Q.length} questions`);
  } else console.log('Questions already present, skipping');

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!admin) {
      admin = await User.create({ name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
      await Profile.create({ user: admin._id, fullName: 'Admin' });
      console.log(`Created admin ${ADMIN_EMAIL}`);
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
      console.log(`Promoted ${ADMIN_EMAIL} to admin`);
    } else console.log('Admin already exists');
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
