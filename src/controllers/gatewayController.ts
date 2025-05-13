import { Request, Response, NextFunction } from "express";
import { getAllGatewaysService, getGatewayService, createGatewayService, updateGatewayService, deleteGatewayService } from "@services/gatewayService";

export async function getAllGateways(req: Request, res: Response, next: NextFunction) {
  try {
    const { networkCode } = req.params;
    const gateways = await getAllGatewaysService(networkCode);
    res.status(200).json(gateways);
  } catch (error) {
    next(error);
  }
}

export async function getGateway(req: Request, res: Response, next: NextFunction) {
  try {
    const { networkCode, macAddress } = req.params;
    const gateway = await getGatewayService(networkCode, macAddress);
    res.status(200).json(gateway);
  } catch (error) {
    next(error);
  }
}

export async function createGateway(req: Request, res: Response, next: NextFunction) {
  try {
    const { networkCode } = req.params;
    const gatewayData = req.body; // Assuming body contains Gateway data
    const gateway = await createGatewayService(networkCode, gatewayData);
    res.status(201).json(gateway);
  } catch (error) {
    next(error);
  }
}

export async function updateGateway(req: Request, res: Response, next: NextFunction) {
  try {
    const { networkCode, macAddress } = req.params;
    const updatedGatewayData = req.body; // Assuming body contains updated Gateway data
    const gateway = await updateGatewayService(networkCode, macAddress, updatedGatewayData);
    res.status(200).json(gateway);
  } catch (error) {
    next(error);
  }
}

export async function deleteGateway(req: Request, res: Response, next: NextFunction) {
  try {
    const { networkCode, macAddress } = req.params;
    await deleteGatewayService(networkCode, macAddress);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
