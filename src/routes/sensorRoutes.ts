import { Router } from 'express';
import {
  getAllSensors,
  getSensor,
  createSensor,
  updateSensor,
  deleteSensor,
} from '@controllers/SensorController';

const router = Router({ mergeParams: true });

router.get('/', getAllSensors);
router.get('/:macAddress', getSensor);
router.post('/', createSensor);
router.put('/:macAddress', updateSensor);
router.delete('/:macAddress', deleteSensor);

export default router;
