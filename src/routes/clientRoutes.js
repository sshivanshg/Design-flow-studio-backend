const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createClient,
    getClients,
    getClient,
    updateClient,
    deleteClient,
    addNote
} = require('../controllers/clientController');

// All routes are protected
router.use(protect);

// Client routes
router.route('/')
    .post(createClient)
    .get(getClients);

router.route('/:id')
    .get(getClient)
    .put(updateClient)
    .delete(deleteClient);

// Add note to client
router.post('/:id/notes', addNote);

module.exports = router; 