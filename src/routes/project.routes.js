// Rutas del módulo de proyectos
// Todas las rutas requieren autenticacion JWT

import { Router } from 'express';
import {
  createProject, updateProject, getProjects, getArchivedProjects,
  getProject, deleteProject, restoreProject,
} from '../controllers/project.controller.js';
import { validate } from '../middleware/validate.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { projectSchema, projectQuerySchema } from '../validators/project.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/',               validate(projectSchema),      createProject);
router.put('/:id',             validate(projectSchema),      updateProject);
router.get('/',                validate(projectQuerySchema), getProjects);
router.get('/archived',                                      getArchivedProjects);
router.get('/:id',                                           getProject);
router.delete('/:id',                                        deleteProject);
router.patch('/:id/restore',                                 restoreProject);

export default router;