// scripts/seed.js
const mongoose = require('mongoose');
const CodeBlock = require('../models/CodeBlock');

const blocks = [
  {
    title: 'Closure Counter',
    template: `// Closure Counter
function makeCounter() {
  // TODO: Return a function that increments and returns the count.
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
`,
    solution: `// Closure Counter
function makeCounter() {
  let count = 0;
  return function() {
    count += 1;
    return count;
  };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
`
  },
  {
    title: 'Promise.all Demo',
  template: `// Promise.all Demo
// Given two promises that resolve after different delays,
// use Promise.all to wait for both and log the two results as an array.

const p1 = new Promise(res => setTimeout(() => res("A"), 100));
const p2 = new Promise(res => setTimeout(() => res("B"), 50));

// TODO: Combine p1 & p2 so you get ["A","B"] in one console.log.
`,
  solution: `// Promise.all Demo
const p1 = new Promise(res => setTimeout(() => res("A"), 100));
const p2 = new Promise(res => setTimeout(() => res("B"), 50));

Promise.all([p1, p2]).then(results => {
  console.log(results); // ["A","B"]
});`
},
  {
    title: 'Array Deduplicator',
    template: `// Array Deduplicator
function dedupe(arr) {
  // TODO: Return a new array without duplicates.
}

console.log(dedupe([1,2,2,3,3,3])); // [1,2,3]
console.log(dedupe(['a','b','a'])); // ['a','b']
`,
    solution: `// Array Deduplicator
function dedupe(arr) {
  return [...new Set(arr)];
}

console.log(dedupe([1,2,2,3,3,3])); // [1,2,3]
console.log(dedupe(['a','b','a'])); // ['a','b']
`
  },
  {
    title: 'Event Loop Race',
    template: `// Event Loop Race
console.log(1);
setTimeout(() => console.log(2), 0);
console.log(3);

// TODO: Use a single console.log call to display the output in the order they appear.
`,
    solution: `// Event Loop Race
console.log(1);
setTimeout(() => console.log(2), 0);
console.log(3);
console.log(1, 3, 2);
`
  }
];

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    await CodeBlock.deleteMany({});
    await CodeBlock.insertMany(blocks);
    console.log('✅  Seeded code blocks');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
