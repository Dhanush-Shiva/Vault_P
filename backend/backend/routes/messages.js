const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getMessages, createMessage, updateMessage, deleteMessage } = require('../controllers/messageController');

router.use(authenticate);
router.get('/',      getMessages);
router.post('/',     createMessage);
router.put('/:id',   updateMessage);
router.delete('/:id', deleteMessage);

module.exports = router;
