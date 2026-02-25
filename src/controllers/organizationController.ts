import { Request, Response } from 'express';
import Organization from '../models/Organization';
import User from '../models/User';

export const createOrganization = async (req: any, res: Response) => {
    try {
        const { name, description, logo, primaryColor, domain } = req.body;

        const organization = await Organization.create({
            name,
            description,
            logo,
            primaryColor,
            domain,
            admin: req.user.id
        });

        // Update the user's role to 'organization' ONLY if they are not a Super Admin
        const userUpdate: any = { organization: organization._id };
        if (req.user.role !== 'admin') {
            userUpdate.role = 'organization';
        }

        await User.findByIdAndUpdate(req.user.id, userUpdate);

        res.status(201).json(organization);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrganizationDetails = async (req: Request, res: Response) => {
    try {
        const organization = await Organization.findById(req.params.id)
            .populate('admin', 'name email');

        if (!organization) return res.status(404).json({ message: 'Organization not found' });

        res.json(organization);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const addMemberToOrganization = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const { id: orgId } = req.params;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.organization = orgId as any;
        await user.save();

        res.json({ message: 'User added to organization successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllOrganizations = async (req: Request, res: Response) => {
    try {
        const organizations = await Organization.find()
            .populate('admin', 'name email');
        res.json(organizations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyBilling = async (req: any, res: Response) => {
    try {
        const organizationId = req.user.organization;
        if (!organizationId) {
            return res.status(404).json({ message: 'No organization found for this user' });
        }

        const organization = await Organization.findById(organizationId)
            .populate('subscription');

        const userCount = await User.countDocuments({ organization: organizationId });

        res.json({
            organization: {
                _id: organization?._id,
                name: organization?.name,
                maxSeats: organization?.maxSeats,
                primaryColor: (organization as any)?.primaryColor,
                logo: (organization as any)?.logo,
                allowedIPs: (organization as any)?.allowedIPs,
                webhookUrl: (organization as any)?.webhookUrl,
                userCount
            },
            subscription: organization?.subscription || null
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateOrgSettings = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { name, primaryColor, logo, allowedIPs, webhookUrl } = req.body;

        // Only the organization admin or super admin can update
        const org = await Organization.findById(id);
        if (!org) return res.status(404).json({ message: 'Organization not found' });
        if (org.admin.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const updated = await Organization.findByIdAndUpdate(id, {
            name, primaryColor, logo, allowedIPs, webhookUrl
        }, { new: true });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

