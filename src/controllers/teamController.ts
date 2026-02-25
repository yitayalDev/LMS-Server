import { Response } from 'express';
import Team from '../models/Team';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import { logAudit } from '../utils/auditService';

/**
 * Create a new team (Organization Admin only)
 */
export const createTeam = async (req: any, res: Response) => {
    try {
        const { name, description, managerId } = req.body;
        const orgId = req.user.organization;

        if (!orgId) {
            return res.status(400).json({ message: 'User must belong to an organization to create teams' });
        }

        const team = await Team.create({
            name,
            description,
            organization: orgId,
            manager: managerId,
            members: []
        });

        // Update manager's role if they are just a student
        const manager = await User.findById(managerId);
        if (manager && manager.role === 'student') {
            manager.role = 'manager';
            await manager.save();
        }

        await logAudit({
            userId: req.user.id,
            action: 'TEAM_CREATE',
            resourceType: 'Team',
            resourceId: team.id,
            description: `Admin created team: ${name}`,
            req
        });

        res.status(201).json(team);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get all teams for an organization
 */
export const getOrganizationTeams = async (req: any, res: Response) => {
    try {
        const orgId = req.user.organization;
        const teams = await Team.find({ organization: orgId })
            .populate('manager', 'name email')
            .populate('members', 'name email');
        res.json(teams);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Add member to team
 */
export const addTeamMember = async (req: any, res: Response) => {
    try {
        const { teamId } = req.params;
        const { userId } = req.body;

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.members.includes(userId)) {
            return res.status(400).json({ message: 'User already in team' });
        }

        team.members.push(userId);
        await team.save();

        await logAudit({
            userId: req.user.id,
            action: 'TEAM_ADD_MEMBER',
            resourceType: 'Team',
            resourceId: team.id,
            description: `Added user ${userId} to team ${team.name}`,
            req
        });

        res.json(team);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Team Analytics (Manager View)
 */
export const getTeamAnalytics = async (req: any, res: Response) => {
    try {
        const team = await Team.findOne({ manager: req.user.id })
            .populate('members', 'name email');

        if (!team) return res.status(404).json({ message: 'No team found for this manager' });

        // Calculate aggregate progress for team members
        const memberStats = await Promise.all(team.members.map(async (member: any) => {
            const enrollments = await Enrollment.find({ user: member._id })
                .populate('course', 'title');

            const totalProgress = enrollments.length > 0
                ? enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) / enrollments.length
                : 0;

            return {
                _id: member._id,
                name: member.name,
                email: member.email,
                averageProgress: totalProgress,
                courseCount: enrollments.length
            };
        }));

        res.json({
            teamName: team.name,
            memberCount: team.members.length,
            stats: memberStats
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
