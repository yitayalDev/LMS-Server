import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d'
    });
};

// Initiate Google login
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));

// Google callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req: any, res) => {
        const token = generateToken(req.user.id);
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';

        // Redirect back to frontend with the token
        // In a real app, you might use a more secure way to pass the token,
        // like a secure cookie or a one-time code.
        res.redirect(`${frontendUrl}/sso-success?token=${token}`);
    }
);

export default router;
