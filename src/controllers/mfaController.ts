import { Response } from 'express';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../models/User';

// Step 1: Generate a TOTP secret and return QR code for the user to scan
export const setupMfa = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.mfaEnabled) {
            return res.status(400).json({ message: 'MFA is already enabled' });
        }

        const secret = speakeasy.generateSecret({
            name: `LMS UOG (${user.email})`,
            length: 20,
        });

        // Temporarily store the secret (not yet activated)
        user.mfaSecret = secret.base32;
        await user.save();

        const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url || '');

        res.json({
            secret: secret.base32,
            qrCode: qrCodeDataUrl,
            message: 'Scan the QR code with your authenticator app, then call /verify to enable MFA.'
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Step 2: Verify the TOTP code and activate MFA
export const verifyMfa = async (req: any, res: Response) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user.id);
        if (!user || !user.mfaSecret) {
            return res.status(400).json({ message: 'MFA setup not started. Please call /setup first.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1 // Allow 30-second drift
        });

        if (!verified) {
            return res.status(400).json({ message: 'Invalid token. Please try again.' });
        }

        user.mfaEnabled = true;
        await user.save();

        res.json({ message: 'MFA has been successfully enabled on your account.' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Step 3: Disable MFA (requires a valid TOTP token as confirmation)
export const disableMfa = async (req: any, res: Response) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user.id);
        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            return res.status(400).json({ message: 'MFA is not enabled on this account.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ message: 'Invalid token. MFA not disabled.' });
        }

        user.mfaEnabled = false;
        user.mfaSecret = undefined;
        await user.save();

        res.json({ message: 'MFA has been disabled.' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Utility: Validate MFA token during login (called internally)
export const validateMfaToken = (secret: string, token: string): boolean => {
    return speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
};
