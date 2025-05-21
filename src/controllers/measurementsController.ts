// src/controllers/measurementsController.ts

import { Request, Response, NextFunction } from "express";
import {
  getMeasPerNetwork,
  getStatisticsPerSensorInNetwork,
  addMeasurements,
  fetchOutliers,
} from "@services/measurementsService";
import { toZonedTime, format } from "date-fns-tz";

const TIME_ZONE = "Europe/Rome";

function formatWithOffset(date: Date): string {
  const zoned = toZonedTime(date, TIME_ZONE);
  return format(zoned, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: TIME_ZONE });
}

function normalizeSensorMacs(raw: string | string[] | undefined): string[] {
  if (typeof raw === 'string') return [raw];
  if (Array.isArray(raw)) return raw;
  return [];
}

function normalizeDateParam(param: any): string {
  if (typeof param !== 'string') throw new Error('Invalid date parameter');
  return new Date(param).toISOString();
}

export async function getMeasurementsPerNetwork(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const networkCode = req.params.networkCode;
  const sensorMacs = normalizeSensorMacs(req.query.sensorMacs as any);
  const startDate = normalizeDateParam(req.query.startDate);
  const endDate = normalizeDateParam(req.query.endDate);

  try {
    const measurements = await getMeasPerNetwork(
      networkCode,
      sensorMacs,
      startDate,
      endDate
    );

    const formattedMeasurements = measurements.map(group => ({
      sensorMacAddress: group.sensorMacAddress,
      stats: group.stats
        ? {
            startDate: formatWithOffset(group.stats.startDate),
            endDate: formatWithOffset(group.stats.endDate),
            mean: group.stats.mean,
            variance: group.stats.variance,
            upperThreshold: group.stats.upperThreshold,
            lowerThreshold: group.stats.lowerThreshold
          }
        : undefined,
      measurements: group.measurements.map(m => ({
        createdAt: formatWithOffset(m.createdAt),
        value: m.value,
        isOutlier: m.isOutlier,
      }))
    }));

    res.status(200).json(formattedMeasurements);
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
  const sensorMacs = normalizeSensorMacs(req.query.sensorMacs as any);
  const startDate = normalizeDateParam(req.query.startDate);
  const endDate = normalizeDateParam(req.query.endDate);

  try {
    const stats = await getStatisticsPerSensorInNetwork(
      networkCode,
      sensorMacs,
      startDate,
      endDate
    );

    
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function storeMeasurements(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { networkCode, gatewayMac, sensorMac } = req.params;
  const payload = (req.body as any[]).map((m) => ({
    createdAt: new Date(m.createdAt),
    value: m.value,
    isOutlier: m.isOutlier,
  }));

  try {
    await addMeasurements(networkCode, gatewayMac, sensorMac, payload);
    res.status(201).send();
  } catch (err) {
    next(err);
  }
}

export async function getOutlierMeasurements(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const networkCode = req.params.networkCode;
  const sensorMacs = normalizeSensorMacs(req.query.sensorMacs as any);
  const startDate = normalizeDateParam(req.query.startDate);
  const endDate = normalizeDateParam(req.query.endDate);

  try {
    const raw = await fetchOutliers(
      networkCode,
      sensorMacs,
      startDate,
      endDate
    );

    const formatted = raw.map((sensor) => ({
      sensorMacAddress: sensor.sensorMacAddress,
      stats: sensor.stats,
      measurements: sensor.measurements.map((m) => ({
        createdAt: formatWithOffset(m.createdAt),
        value: m.value,
        isOutlier: m.isOutlier,
      })),
    }));

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
}

export default formatWithOffset
