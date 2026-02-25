import { Response } from 'express';
import ExcelJS from 'exceljs';
import Enrollment from '../models/Enrollment';
import User from '../models/User';
import Course from '../models/Course';

export const exportUserProgressReport = async (req: any, res: Response) => {
    try {
        const organizationId = req.user.organization || (req.user.role === 'admin' ? null : undefined);

        const enrollmentQuery: any = {};
        if (organizationId) {
            const orgUsers = await User.find({ organization: organizationId }).select('_id');
            const userIds = orgUsers.map(u => u._id);
            enrollmentQuery.user = { $in: userIds };
        }

        const enrollments = await Enrollment.find(enrollmentQuery)
            .populate('user', 'name email')
            .populate('course', 'title');

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('User Progress');

        sheet.columns = [
            { header: 'User Name', key: 'name', width: 24 },
            { header: 'Email', key: 'email', width: 32 },
            { header: 'Course', key: 'course', width: 36 },
            { header: 'Progress (%)', key: 'progress', width: 15 },
            { header: 'Status', key: 'status', width: 16 },
            { header: 'Compliance Status', key: 'compliance', width: 20 },
            { header: 'Expires At', key: 'expires', width: 18 },
            { header: 'Enrolled On', key: 'enrolled', width: 18 },
        ];

        // Style the header row
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        enrollments.forEach((e: any) => {
            sheet.addRow({
                name: e.user?.name || 'N/A',
                email: e.user?.email || 'N/A',
                course: e.course?.title || 'N/A',
                progress: e.progress || 0,
                status: e.status,
                compliance: e.complianceStatus || 'N/A',
                expires: e.expiresAt ? new Date(e.expiresAt).toLocaleDateString() : 'N/A',
                enrolled: new Date(e.createdAt).toLocaleDateString(),
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=user_progress_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const exportComplianceReport = async (req: any, res: Response) => {
    try {
        const organizationId = req.user.organization;

        const mandatoryCourses = await Course.find({ organization: organizationId, isMandatory: true });
        const courseIds = mandatoryCourses.map(c => c._id);

        const enrollments = await Enrollment.find({ course: { $in: courseIds } })
            .populate('user', 'name email')
            .populate('course', 'title recertificationDays');

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Compliance Report');

        sheet.columns = [
            { header: 'User Name', key: 'name', width: 24 },
            { header: 'Email', key: 'email', width: 32 },
            { header: 'Course', key: 'course', width: 36 },
            { header: 'Compliance Status', key: 'compliance', width: 20 },
            { header: 'Expires At', key: 'expires', width: 18 },
            { header: 'Recertification (Days)', key: 'recert', width: 22 },
        ];

        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };

        const statusColors: Record<string, string> = {
            compliant: 'FF22C55E',
            expiring_soon: 'FFF59E0B',
            expired: 'FFEF4444',
            not_started: 'FF6B7280',
        };

        enrollments.forEach((e: any) => {
            const row = sheet.addRow({
                name: e.user?.name || 'N/A',
                email: e.user?.email || 'N/A',
                course: e.course?.title || 'N/A',
                compliance: e.complianceStatus || 'not_started',
                expires: e.expiresAt ? new Date(e.expiresAt).toLocaleDateString() : 'N/A',
                recert: e.course?.recertificationDays || 'None',
            });
            const color = statusColors[e.complianceStatus || 'not_started'];
            row.getCell('compliance').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=compliance_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
