import { Request, Response } from 'express';
import SystemSettings from '../models/SystemSettings';

export const getSettings = async (req: Request, res: Response) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({});
        }
        res.status(200).json(settings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const settings = await SystemSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.status(200).json(settings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const uploadLogo = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const logoPath = `/uploads/branding/${req.file.filename}`;
        const settings = await SystemSettings.findOneAndUpdate({}, { platformLogo: logoPath }, { new: true, upsert: true });

        res.status(200).json(settings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
