import { CONFIG } from "@config";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  getMeasurementsPerNetwork,
  getStatistics,
  getOutlierMeasurements,
  storeMeasurements
} from "@controllers/measurementsController";

const router = Router();


// GET  /api/v1/networks/:networkCode/measurements
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/measurements",
  authenticateUser(),               // any logged-in user
  getMeasurementsPerNetwork
);

// GET  /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/stats",
  authenticateUser(),
  getStatistics
);



// POST /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements
router.post(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements",
  authenticateUser([UserType.Admin, UserType.Operator]),
  storeMeasurements
);

// GET  /api/v1/networks/:networkCode/outliers
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/outliers",
  authenticateUser(),
  getOutlierMeasurements
);

export default router;
