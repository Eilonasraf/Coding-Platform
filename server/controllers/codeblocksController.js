// server/controllers/codeblocksController.js
const CodeBlock = require('../models/CodeBlock');

// Get a list of all code blocks
exports.list = async (req, res) => {
  try {
    const blocks = await CodeBlock.find({}, 'title');
    res.json(blocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get details of a single code block by ID
exports.getOne = async (req, res) => {
  try {
    const block = await CodeBlock.findById(req.params.id);
    if (!block) return res.status(404).json({ error: 'Not found' });
    res.json(block);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a snapshot for a code block
exports.createSnapshot = async (req, res) => {
  const { code, clientId } = req.body;
  if (!clientId) return res.status(400).json({ error: 'Missing clientId' });

  try {
    const block = await CodeBlock.findById(req.params.id);
    if (!block) return res.sendStatus(404);

    block.snapshots.push({ clientId, code });
    await block.save();
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all snapshots for a code block, optionally filtered by clientId
exports.getSnapshots = async (req, res) => {
  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: 'Missing clientId' });

  try {
    const block = await CodeBlock.findById(req.params.id, 'snapshots');
    if (!block) return res.sendStatus(404);

    // filter to only this client’s snapshots
    const mine = block.snapshots
      .filter(s => s.clientId === clientId)
      .sort((a, b) => b.timestamp - a.timestamp);

    res.json(mine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
