import { IEnrollment } from '../models/Enrollment';
import { ICourse } from '../models/Course';
import dayjs from 'dayjs';

export const calculateComplianceStatus = (enrollment: IEnrollment, course: ICourse) => {
    if (enrollment.status !== 'completed') {
        return enrollment.complianceStatus || 'not_started';
    }

    if (!course.recertificationDays || course.recertificationDays <= 0) {
        return 'compliant';
    }

    const completionDate = dayjs(enrollment.completedAt);
    const expirationDate = completionDate.add(course.recertificationDays, 'day');
    const now = dayjs();

    if (now.isAfter(expirationDate)) {
        return 'expired';
    }

    // Mark as expiring soon if within 30 days of expiration
    if (now.isAfter(expirationDate.subtract(30, 'day'))) {
        return 'expiring_soon';
    }

    return 'compliant';
};

export const updateEnrollmentCompliance = (enrollment: any, course: any) => {
    const status = calculateComplianceStatus(enrollment, course);
    enrollment.complianceStatus = status;

    if (enrollment.status === 'completed' && course.recertificationDays > 0) {
        enrollment.expiresAt = dayjs(enrollment.completedAt).add(course.recertificationDays, 'day').toDate();
    }

    return enrollment;
};
