// Rutas del módulo de albaranes
// Todas las rutas requieren autenticacion JWT

import { Router } from 'express';
import {
  createDeliveryNote, getDeliveryNotes,
  getDeliveryNote, deleteDeliveryNote,
} from '../controllers/deliverynote.controller.js';
import { validate } from '../middleware/validate.js';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  deliveryNoteSchema,
  deliveryNoteQuerySchema,
} from '../validators/deliverynote.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/',    validate(deliveryNoteSchema),      createDeliveryNote);
router.get('/',     validate(deliveryNoteQuerySchema), getDeliveryNotes);
router.get('/:id',                                     getDeliveryNote);
router.delete('/:id',                                  deleteDeliveryNote);

export default router;