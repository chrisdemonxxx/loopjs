const express = require('express');
const templateController = require('../controllers/template.controller');
const { protect } = require('../middleware/security');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Template CRUD routes
router.get('/templates', templateController.getAllTemplates);
router.post('/templates', templateController.createTemplate);
router.get('/templates/:templateId', templateController.getTemplate);
router.put('/templates/:templateId', templateController.updateTemplate);
router.delete('/templates/:templateId', templateController.deleteTemplate);
router.post('/templates/:templateId/use', templateController.useTemplate);

module.exports = router;

