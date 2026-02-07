const db = require('../config/database');

class Campaign {
    // Create a new campaign
    static async create(campaignData) {
        const {
            projectId, campaignName, campaignCode, campaignType,
            imageUrls, videoUrls, description, targetAmount,
            startDate, endDate, isPublic, razorpayEnabled, createdBy
        } = campaignData;

        // Generate campaign code if not provided
        const code = campaignCode || `CAMP-${Date.now().toString(36).toUpperCase()}`;

        const [result] = await db.execute(
            `INSERT INTO campaigns (
                ProjectId, CampaignName, CampaignCode, CampaignType,
                ImageUrls, VideoUrls, Description, TargetAmount,
                StartDate, EndDate, IsPublic, RazorpayEnabled, CreatedBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                projectId, campaignName, code, campaignType || 'FUNDRAISING',
                JSON.stringify(imageUrls || []), JSON.stringify(videoUrls || []),
                description, targetAmount || 0, startDate, endDate,
                isPublic !== false, razorpayEnabled !== false, createdBy
            ]
        );
        return result.insertId;
    }

    // Find campaign by ID
    static async findById(campaignId) {
        const [rows] = await db.execute(
            `SELECT c.*,
                    p.ProjectName,
                    u.FullName as CreatedByName,
                    (SELECT COUNT(*) FROM donations WHERE CampaignId = c.CampaignId AND Status = 'Completed' AND IsDeleted = FALSE) as DonationCount
             FROM campaigns c
             LEFT JOIN projects p ON c.ProjectId = p.ProjectId
             LEFT JOIN users u ON c.CreatedBy = u.UserId
             WHERE c.CampaignId = ? AND c.IsDeleted = FALSE`,
            [campaignId]
        );
        if (rows[0]) {
            rows[0].ImageUrls = JSON.parse(rows[0].ImageUrls || '[]');
            rows[0].VideoUrls = JSON.parse(rows[0].VideoUrls || '[]');
        }
        return rows[0];
    }

    // Find by campaign code
    static async findByCode(campaignCode) {
        const [rows] = await db.execute(
            `SELECT c.*, p.ProjectName
             FROM campaigns c
             LEFT JOIN projects p ON c.ProjectId = p.ProjectId
             WHERE c.CampaignCode = ? AND c.IsDeleted = FALSE`,
            [campaignCode]
        );
        if (rows[0]) {
            rows[0].ImageUrls = JSON.parse(rows[0].ImageUrls || '[]');
            rows[0].VideoUrls = JSON.parse(rows[0].VideoUrls || '[]');
        }
        return rows[0];
    }

    // Find all campaigns with filters
    static async findAll(filters = {}) {
        let query = `
            SELECT c.*,
                   p.ProjectName,
                   (SELECT COUNT(*) FROM donations WHERE CampaignId = c.CampaignId AND Status = 'Completed' AND IsDeleted = FALSE) as DonationCount
            FROM campaigns c
            LEFT JOIN projects p ON c.ProjectId = p.ProjectId
            WHERE c.IsDeleted = FALSE
        `;
        const params = [];

        if (filters.projectId) {
            query += ' AND c.ProjectId = ?';
            params.push(filters.projectId);
        }

        if (filters.campaignType) {
            query += ' AND c.CampaignType = ?';
            params.push(filters.campaignType);
        }

        if (filters.campaignStatus) {
            query += ' AND c.CampaignStatus = ?';
            params.push(filters.campaignStatus);
        }

        if (filters.isPublic !== undefined) {
            query += ' AND c.IsPublic = ?';
            params.push(filters.isPublic);
        }

        if (filters.search) {
            query += ' AND (c.CampaignName LIKE ? OR c.CampaignCode LIKE ? OR c.Description LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY c.CreatedDate DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(parseInt(filters.offset));
            }
        }

        const [rows] = await db.execute(query, params);
        return rows.map(row => ({
            ...row,
            ImageUrls: JSON.parse(row.ImageUrls || '[]'),
            VideoUrls: JSON.parse(row.VideoUrls || '[]')
        }));
    }

    // Get public campaigns (for donation page)
    static async getPublicCampaigns(filters = {}) {
        return this.findAll({ ...filters, isPublic: true, campaignStatus: 'Active' });
    }

    // Update campaign
    static async update(campaignId, updateData, updatedBy) {
        const allowedFields = [
            'CampaignName', 'CampaignType', 'ImageUrls', 'VideoUrls',
            'Description', 'TargetAmount', 'StartDate', 'EndDate',
            'CampaignStatus', 'IsPublic', 'RazorpayEnabled'
        ];

        const updates = [];
        const params = [];

        for (const [key, value] of Object.entries(updateData)) {
            const dbField = key.charAt(0).toUpperCase() + key.slice(1);
            if (allowedFields.includes(dbField) && value !== undefined) {
                updates.push(`${dbField} = ?`);
                if (dbField === 'ImageUrls' || dbField === 'VideoUrls') {
                    params.push(JSON.stringify(value));
                } else {
                    params.push(value);
                }
            }
        }

        if (updates.length === 0) return false;

        updates.push('UpdatedBy = ?');
        params.push(updatedBy);
        params.push(campaignId);

        const [result] = await db.execute(
            `UPDATE campaigns SET ${updates.join(', ')} WHERE CampaignId = ? AND IsDeleted = FALSE`,
            params
        );
        return result.affectedRows > 0;
    }

    // Update collected amount
    static async updateCollectedAmount(campaignId, amount) {
        const [result] = await db.execute(
            `UPDATE campaigns SET CollectedAmount = CollectedAmount + ? WHERE CampaignId = ?`,
            [amount, campaignId]
        );
        return result.affectedRows > 0;
    }

    // Soft delete
    static async delete(campaignId, deletedBy) {
        const [result] = await db.execute(
            `UPDATE campaigns SET IsDeleted = TRUE, UpdatedBy = ? WHERE CampaignId = ?`,
            [deletedBy, campaignId]
        );
        return result.affectedRows > 0;
    }

    // Get campaign statistics
    static async getStats(campaignId) {
        const [rows] = await db.execute(
            `SELECT 
                COUNT(*) as totalDonations,
                COALESCE(SUM(CASE WHEN Status = 'Completed' THEN Amount ELSE 0 END), 0) as totalCollected,
                COALESCE(SUM(CASE WHEN DonationType = 'RAZORPAY' AND Status = 'Completed' THEN Amount ELSE 0 END), 0) as onlineAmount,
                COALESCE(SUM(CASE WHEN DonationType != 'RAZORPAY' AND Status = 'Completed' THEN Amount ELSE 0 END), 0) as offlineAmount,
                COUNT(DISTINCT DonorName) as uniqueDonors
             FROM donations
             WHERE CampaignId = ? AND IsDeleted = FALSE`,
            [campaignId]
        );
        return rows[0];
    }
}

module.exports = Campaign;
