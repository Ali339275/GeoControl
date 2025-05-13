import AppError from "@models/errors/AppError";
import { Router } from "express";
import {
  getAllGateways,
  createGateway,
  getGateway,
  updateGateway,
  deleteGateway
} from "@controllers/gatewayController";

const router = Router({ mergeParams: true });

// Get all gateways (Any authenticated user)
router.get("", async (req, res, next) => {
  try {
    await getAllGateways(req, res, next);
  } catch (err) {
    // Fallback (can remove this after full testing)
    next(new AppError("Method not implemented", 500));
  }
});

// Create a new gateway (Admin & Operator)
router.post("", async (req, res, next) => {
  try {
    await createGateway(req, res, next);
  } catch (err) {
    next(new AppError("Method not implemented", 500));
  }
});

// Get a specific gateway (Any authenticated user)
router.get("/:macAddress", async (req, res, next) => {
  try {
    await getGateway(req, res, next);
  } catch (err) {
    next(new AppError("Method not implemented", 500));
  }
});

// Update a gateway (Admin & Operator)
router.patch("/:macAddress", async (req, res, next) => {
  try {
    await updateGateway(req, res, next);
  } catch (err) {
    next(new AppError("Method not implemented", 500));
  }
});

// Delete a gateway (Admin & Operator)
router.delete("/:macAddress", async (req, res, next) => {
  try {
    await deleteGateway(req, res, next);
  } catch (err) {
    next(new AppError("Method not implemented", 500));
  }
});

export default router;
