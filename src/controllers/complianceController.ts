import { Request, Response } from 'express';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import { updateEnrollmentCompliance } from '../services/complianceService';
import mongoose from 'mongoose';

export const getComplianceSummary = async (req: any, res: Response) => {
    try {
        const organizationId = req.user.organization;
        if (!organizationId) {
            return res.status(403).json({ message: 'Organization access required' });
        }

        // Find all mandatory courses for the organization
        const mandatoryCourses = await Course.find({
            organization: organizationId,
            isMandatory: true
        });

        const mandatoryCourseIds = mandatoryCourses.map(c => c._id);

        // Aggregate enrollment stats for these courses
        const stats = await Enrollment.aggregate([
            { $match: { course: { $in: mandatoryCourseIds } } },
            {
                $group: {
                    _id: '$complianceStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            compliant: 0,
            expiring_soon: 0,
            expired: 0,
            not_started: 0
        };

        stats.forEach((stat: any) => {
            if (summary.hasOwnProperty(stat._id)) {
                (summary as any)[stat._id] = stat.count;
            }
        });

        res.json({
            summary,
            mandatoryCourseCount: mandatoryCourseIds.length,
            totalComplianceRate: (summary.compliant / (mandatoryCourseIds.length || 1)) * 100 // Simplified rate
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving compliance summary', error });
    }
};

export const getUserComplianceDetail = async (req: any, res: Response) => {
    try {
        const { userId } = req.params;
        const organizationId = req.user.organization;

        const enrollments = await Enrollment.find({ user: userId })
            .populate('course', 'title isMandatory recertificationDays');

        // Filter for mandatory courses or courses with recertification
        const complianceRecords = enrollments.filter(e => {
            const course = e.course as any;
            return course.isMandatory || course.recertificationDays > 0;
        });

        res.json(complianceRecords);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user compliance details', error });
    }
};
