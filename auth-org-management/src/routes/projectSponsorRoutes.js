const express = require('express');
const controller = require('../controllers/projectSponsorController');
const { authenticate } = require('../middleware/auth');
const { body, param } = require('express-validator');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/sponsors/'),
    filename: (req, file, cb) => {
        const prefix = file.mimetype.startsWith('video/') ? 'vid-' : 'img-';
        cb(null, prefix + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const imageUpload = multer({
    storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
        if (/jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('Only images allowed'));
    }
});

const videoUpload = multer({
    storage, limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
        if (/mp4|mov|avi|mkv|webm/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('Only videos allowed'));
    }
});

const validation = [
    body('projectId').isInt().withMessage('Project ID required')
];

/**
 * @swagger
 * /api/project-sponsors:
 *   post:
 *     summary: Create project sponsor
 *     tags: [Project Sponsors]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId]
 *             properties:
 *               projectId: { type: integer }
 *               sponsorType: { type: string, enum: [INDIVIDUAL, ORGANIZATION] }
 *               sponsorId: { type: integer, description: User ID for individual sponsors }
 *               organizationId: { type: integer, description: Organization ID if sponsorType is ORGANIZATION }
 *               sponsorName: { type: string }
 *               sponsorEmail: { type: string }
 *               sponsorPhone: { type: string }
 *               sponsorAddress: { type: string }
 *               sponsorWebsite: { type: string }
 *               sponsorLogo: { type: string }
 *               purpose: { type: string, description: Purpose of sponsorship }
 *               sponsorshipType: { type: string, enum: [FINANCIAL, IN_KIND, SERVICES, MATERIALS, EQUIPMENT, VENUE, MEDIA, OTHER] }
 *               amount: { type: number }
 *               currency: { type: string }
 *               description: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               status: { type: string, enum: [Pending, Active, Completed, Cancelled] }
 *               isPublic: { type: boolean }
 *               displayOrder: { type: integer }
 *     responses:
 *       201: { description: Created }
 */
router.post('/', authenticate, validation, controller.create);

/**
 * @swagger
 * /api/project-sponsors:
 *   get:
 *     summary: Get all sponsors
 *     tags: [Project Sponsors]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: projectId, schema: { type: integer } }
 *       - { in: query, name: sponsorType, schema: { type: string, enum: [INDIVIDUAL, ORGANIZATION] } }
 *       - { in: query, name: sponsorshipType, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses:
 *       200: { description: List of sponsors }
 */
router.get('/', authenticate, controller.getAll);

/**
 * @swagger
 * /api/project-sponsors/project/{projectId}/public:
 *   get:
 *     summary: Get public sponsors for a project (no auth)
 *     tags: [Project Sponsors]
 *     parameters: [{ in: path, name: projectId, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Public sponsors }
 */
router.get('/project/:projectId/public', param('projectId').isInt(), controller.getPublic);

/**
 * @swagger
 * /api/project-sponsors/project/{projectId}/summary:
 *   get:
 *     summary: Get sponsor summary for project
 *     tags: [Project Sponsors]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: projectId, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Summary }
 */
router.get('/project/:projectId/summary', authenticate, param('projectId').isInt(), controller.getSummary);

/**
 * @swagger
 * /api/project-sponsors/{id}:
 *   get:
 *     summary: Get sponsor by ID with media
 *     tags: [Project Sponsors]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Sponsor with media }
 */
router.get('/:id', authenticate, param('id').isInt(), controller.getById);

/**
 * @swagger
 * /api/project-sponsors/{id}:
 *   put:
 *     summary: Update sponsor
 *     tags: [Project Sponsors]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', authenticate, param('id').isInt(), controller.update);

/**
 * @swagger
 * /api/project-sponsors/{id}:
 *   delete:
 *     summary: Delete sponsor
 *     tags: [Project Sponsors]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/:id', authenticate, param('id').isInt(), controller.delete);

// Media endpoints
/**
 * @swagger
 * /api/project-sponsors/{id}/images:
 *   post:
 *     summary: Upload images
 *     tags: [Project Sponsors]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images: { type: array, items: { type: string, format: binary } }
 *               caption: { type: string }
 *     responses:
 *       201: { description: Uploaded }
 */
router.post('/:id/images', authenticate, imageUpload.array('images', 10), controller.uploadImages);

/**
 * @swagger
 * /api/project-sponsors/{id}/videos:
 *   post:
 *     summary: Upload videos
 *     tags: [Project Sponsors]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       201: { description: Uploaded }
 */
router.post('/:id/videos', authenticate, videoUpload.array('videos', 5), controller.uploadVideos);

/**
 * @swagger
 * /api/project-sponsors/{id}/media:
 *   get:
 *     summary: Get all media
 *     tags: [Project Sponsors]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       200: { description: Media list }
 */
router.get('/:id/media', authenticate, controller.getMedia);

/**
 * @swagger
 * /api/project-sponsors/{id}/media/{mediaId}:
 *   delete:
 *     summary: Delete media
 *     tags: [Project Sponsors]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/:id/media/:mediaId', authenticate, controller.deleteMedia);

module.exports = router;
