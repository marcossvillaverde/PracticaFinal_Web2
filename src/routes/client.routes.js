// Rutas del módulo de clientes
// Todas las rutas requieren autenticacion JWT

import { Router } from 'express';
import {
  createClient, updateClient, getClients, getArchivedClients,
  getClient, deleteClient, restoreClient,
} from '../controllers/client.controller.js';
import { validate } from '../middleware/validate.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { clientSchema, clientQuerySchema } from '../validators/client.validator.js';

const router = Router();

// Todas las rutas de clientes requieren autenticacion
router.use(authMiddleware);

router.post('/',                  validate(clientSchema),      createClient);
router.put('/:id',                validate(clientSchema),      updateClient);
router.get('/',                   validate(clientQuerySchema), getClients);
router.get('/archived',                                        getArchivedClients);
router.get('/:id',                                             getClient);
router.delete('/:id',                                          deleteClient);
router.patch('/:id/restore',                                   restoreClient);

export default router;