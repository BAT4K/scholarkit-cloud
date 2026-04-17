const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

router.get('/schools/:schoolId/groups', shopController.getSchoolGroups);

router.get('/catalog', shopController.getGroupCatalog);

module.exports = router;