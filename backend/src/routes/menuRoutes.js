const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
  getTonightMenu
} = require('../controllers/menuController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');

// Public routes
router.get('/', optionalProtect, getMenuItems);
router.get('/tonight', getTonightMenu);
router.get('/:id', getMenuItem);

// Admin-only routes
router.post('/', protect, authorize('admin'), createMenuItem);
router.put('/:id', protect, authorize('admin'), updateMenuItem);
router.patch('/:id/toggle', protect, authorize('admin'), toggleAvailability);
router.delete('/:id', protect, authorize('admin'), deleteMenuItem);

module.exports = router;
