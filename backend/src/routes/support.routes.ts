import { Router } from 'express';
import { 
  createTicket, 
  getTenantTickets, 
  getTicketDetails, 
  addMessage,
  updateTicketStatus,
  getUnreadCount
} from '../controllers/support.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Routes for Tenant Admin (mounted under /api/support with tenant auth)
router.post('/', authenticate, requireAdmin, createTicket);
router.get('/', authenticate, requireAdmin, getTenantTickets);
router.get('/unread-count', authenticate, requireAdmin, getUnreadCount);
router.get('/:id', authenticate, requireAdmin, getTicketDetails);
router.post('/:id/messages', authenticate, requireAdmin, addMessage);
router.patch('/:id/status', authenticate, requireAdmin, updateTicketStatus);

export default router;
