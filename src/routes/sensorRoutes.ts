import { Router } from "express";
import {
  getAllSensors,
  getSensor,
  createSensor,
  updateSensor,
  deleteSensor,
} from "@controllers/SensorController";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";

const router = Router({ mergeParams: true });

// List sensors (any authenticated user)
router.get("/", authenticateUser(), getAllSensors);

// Get one sensor (any authenticated user)
router.get("/:macAddress", authenticateUser(), getSensor);

// Create sensor (Admin & Operator)
router.post(
  "/",
  authenticateUser([UserType.Admin, UserType.Operator]),
  createSensor
);

// Update sensor (Admin & Operator) – full replace via PUT
router.put(
  "/:macAddress",
  authenticateUser([UserType.Admin, UserType.Operator]),
  updateSensor
);

// Update sensor (Admin & Operator) – partial update via PATCH
router.patch(
  "/:macAddress",
  authenticateUser([UserType.Admin, UserType.Operator]),
  updateSensor
);

// Delete sensor (Admin & Operator)
router.delete(
  "/:macAddress",
  authenticateUser([UserType.Admin, UserType.Operator]),
  deleteSensor
);

export default router;
