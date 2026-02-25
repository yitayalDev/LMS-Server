import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import Certificate from '../models/Certificate';
import Course from '../models/Course';
import Exam from '../models/Exam';
import User from '../models/User';
import path from 'path';
import fs from 'fs';

export const generateCertificate = async (req: any, res: Response) => {
    try {
        const { examAttemptId } = req.body; // In a real flow, this might be triggered after submisison
        // For this MVP, we'll allow manual generation or call it from submitExam

        // This is a placeholder for the actual generation logic which will be integrated in submitExam
        res.status(501).json({ message: 'Certificate generation logic moved to automated submission flow' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyCertificates = async (req: any, res: Response) => {
    try {
        const certificates = await Certificate.find({ user: req.user.id })
            .populate('course', 'title')
            .populate('exam', 'title');
        res.json(certificates);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const downloadCertificate = async (req: any, res: Response) => {
    try {
        const cert = await Certificate.findById(req.params.id)
            .populate('user', 'name')
            .populate('course', 'title');

        if (!cert) return res.status(404).json({ message: 'Certificate not found' });
        if (cert.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificate-${cert.certificateId}.pdf`);

        doc.pipe(res);

        // Certificate Design
        doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).lineWidth(10).stroke('#1a365d');
        doc.rect(55, 55, doc.page.width - 110, doc.page.height - 110).lineWidth(2).stroke('#1a365d');

        doc.fontSize(60).fillColor('#1a365d').text('CERTIFICATE', 0, 150, { align: 'center' });
        doc.fontSize(20).fillColor('#4a5568').text('OF COMPLETION', 0, 220, { align: 'center' });

        doc.fontSize(16).text('This is to certify that', 0, 280, { align: 'center' });
        doc.fontSize(30).fillColor('#2d3748').text((cert.user as any).name, 0, 310, { align: 'center' });

        doc.fontSize(16).fillColor('#4a5568').text('has successfully completed the course', 0, 360, { align: 'center' });
        doc.fontSize(24).fillColor('#1a365d').text((cert.course as any).title, 0, 390, { align: 'center' });

        doc.fontSize(12).fillColor('#718096').text(`Issued on ${new Date(cert.issueDate).toLocaleDateString()}`, 0, 450, { align: 'center' });
        doc.text(`Certificate ID: ${cert.certificateId}`, 0, 470, { align: 'center' });

        doc.end();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
