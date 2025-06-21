const router = require('express').Router();
const ctrl = require('../controllers/codeblocksController');

// list all code blocks
router.get('/', ctrl.list);

// get details of a single code block by ID
router.get('/:id', ctrl.getOne);

// create a snapshot for a code block
router.post('/:id/snapshot',  ctrl.createSnapshot);

// list snapshots for a code block, optionally filtered by clientId
router.get('/:id/snapshots',  ctrl.getSnapshots);


module.exports = router;
