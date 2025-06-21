// server/models/CodeBlock.js
const mongoose = require('mongoose');

const SnapshotSchema = new mongoose.Schema({
  clientId:  String,
  code:      String,
  timestamp: { type: Date, default: Date.now }
});

const TestSchema = new mongoose.Schema({
  code:     String,
  expected: mongoose.Schema.Types.Mixed
});

const CodeBlockSchema = new mongoose.Schema({
  title:     String,
  template:  String,
  solution:  String,
  tests:     [TestSchema],
  snapshots: { type: [SnapshotSchema], default: [] }
});

module.exports = mongoose.model('CodeBlock', CodeBlockSchema);
