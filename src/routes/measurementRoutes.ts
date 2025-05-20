import { CONFIG } from "@config";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {AppError} from "@errors/AppError"
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

// Retrieve statistics for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/stats",
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

router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements",
  (req, res, next) => {
    throw new AppError("Method not implemented", 500);
  }
);

// Retrieve statistics for a specific sensor
router.get(CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/stats", (req, res, next) => {
  throw new AppError("Method not implemented", 500);
});

// Retrieve only outliers for a specific sensor
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/outliers",
  (req, res, next) => {
    throw new AppError("Method not implemented", 500);
  }
);


export default router;
