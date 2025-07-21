const express = require('express');
const passport = require('passport');
const commandRoute = require('./command.route');
const infoRoute = require('./info.route');

const router = express.Router();

router.use('/command', commandRoute);
router.use('/info', infoRoute);

// ✅ POST /api/login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ message: 'Logged in', user: { id: user.id, username: user.username } });
    });
  })(req, res, next);
});

// ✅ GET /api/me
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ user: { id: req.user.id, username: req.user.username } });
});

// ✅ GET /api/logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out' });
  });
});

router.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Windows System Management & Deployment Tool APIs",
  });
});

module.exports = router;
