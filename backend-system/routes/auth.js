// routes/auth.js
import express from 'express';
const router = express.Router();

// temporary basic route to test
router.get('/test', (req, res) =>{
    res.json({ message: 'Auth routes are working! '});
});

router.post('/register', (req, res) => {
    res.json({ message: 'Registration endpoint is soon' });
});

router.post('/login', (req, res) => {
    res.json({ message: 'Login endpoints is soon' });
});

export default router;