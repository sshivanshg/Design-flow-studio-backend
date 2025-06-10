const passport = require('passport');

const googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
});

const googleCallback = passport.authenticate('google', {
    failureRedirect: '/login',
    session: false
}, (req, res) => {
    // Generate JWT token
    const token = req.user.generateAuthToken();
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?token=${token}`);
});

module.exports = {
    googleAuth,
    googleCallback
}; 