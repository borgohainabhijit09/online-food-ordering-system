import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { 
  getRawMaterials, 
  createRawMaterial, 
  updateRawMaterial, 
  deleteRawMaterial,
  getRecipes,
  createOrUpdateRecipe,
  deleteRecipe
} from '../controllers/inventory.controller';

const router = Router();

router.use(authenticate);

// Raw Materials
router.get('/raw-materials', getRawMaterials);
router.post('/raw-materials', createRawMaterial);
router.put('/raw-materials/:id', updateRawMaterial);
router.delete('/raw-materials/:id', deleteRawMaterial);

// Recipes
router.get('/recipes', getRecipes);
router.post('/recipes', createOrUpdateRecipe);
router.delete('/recipes/:id', deleteRecipe);

export default router;
