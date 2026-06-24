import { Router } from 'express';
import { 
  getTables, 
  createTable, 
  updateTable, 
  deleteTable,
  callWaiter,
  requestBill,
  getActiveEvents,
  resolveEvent
} from '../controllers/table.controller';

import { requireFeature } from '../middlewares/featureGuard';

const router = Router();

router.use(requireFeature('RESERVATIONS'));

// Admin Table Routes
router.get('/', getTables);
router.post('/', createTable);
router.patch('/:id', updateTable);
router.delete('/:id', deleteTable);

// Event Routes
router.get('/events', getActiveEvents);
router.patch('/events/:id/resolve', resolveEvent);

// Customer facing actions (Publicly accessible but validated by tenant middleware)
router.post('/call-waiter', callWaiter);
router.post('/request-bill', requestBill);

export default router;
