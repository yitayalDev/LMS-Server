import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { Request } from 'express';
import User from '../models/User';

export const configurePassport = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/sso/google/callback`,
        passReqToCallback: true
    }, async (req: Request, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
            // Find or create user
            let user = await User.findOne({
                $or: [
                    { ssoId: profile.id, ssoProvider: 'google' },
                    { email: profile.emails?.[0].value }
                ]
            });

            if (user) {
                // Link account if not already linked
                if (!user.ssoId) {
                    user.ssoId = profile.id;
                    user.ssoProvider = 'google';
                    await user.save();
                }
                return done(null, user);
            }

            // Create new user (Just-In-Time Provisioning)
            user = await User.create({
                name: profile.displayName,
                email: profile.emails?.[0].value,
                ssoProvider: 'google',
                ssoId: profile.id,
                isVerified: true, // SSO users are verified by the provider
                role: 'student' // Default role
            });

            return done(null, user);
        } catch (error) {
            return done(error as Error, undefined);
        }
    }));

    // Passport session setup is not strictly needed for JWT-based auth,
    // but we can implement it if we want to use passport.authenticate('jwt') later.
    passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};
