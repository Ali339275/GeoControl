import { Request, Response, NextFunction } from "express";
import { MeasurementFromJSON } from "@models/dto/Measurement";
import {
  getMeasPerNetwork,
  getStatisticsPerSensorInNetwork,
  addMeasurements,
  fetchOutliers
} from "@services/measurementsService";

export async function getMeasuremnetsPerNetwork(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const networkCode = req.params.networkCode;
  const sensorMacs = [].concat(req.query.sensorMacs || []);
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  try {
    const measurements = await getMeasPerNetwork(networkCode, sensorMacs, startDate, endDate);
    res.status(200).json(measurements);
  } catch (err) {
    next(err);
  }
}

export async function getStatistics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const networkCode = req.params.networkCode;
  const sensorMacs = [].concat(req.query.sensorMacs || []);
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  try {
    const stats = await getStatisticsPerSensorInNetwork(networkCode, sensorMacs, startDate, endDate);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}


// POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements
export async function storeMeasurements(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { networkCode, gatewayMac, sensorMac } = req.params;
  // parse an array of { createdAt, value, isOutlier? }
  const payload = (req.body as any[]).map(MeasurementFromJSON);

  try {
    await addMeasurements(networkCode, gatewayMac, sensorMac, payload);
    res.status(201).send();
  } catch (err) {
    next(err);
  }
}


// GET /networks/:networkCode/outliers
export async function getOutlierMeasurements(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const networkCode = req.params.networkCode;
  const sensorMacs = [].concat(req.query.sensorMacs || []);
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  try {
    const outliers = await fetchOutliers(networkCode, sensorMacs, startDate, endDate);
    res.status(200).json(outliers);
  } catch (err) {
    next(err);
  }
}
