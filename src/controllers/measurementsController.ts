// src/controllers/measurementsController.ts

import { Request, Response, NextFunction } from "express";
import {
  getMeasPerNetwork,
  getStatisticsPerSensorInNetwork,
  addMeasurements,
  fetchOutliers,
  getMeasurementsForSingleSensor,
  getStatisticsForSingleSensor,
  getOutliersForSingleSensor,
} from "@services/measurementsService";
import { toZonedTime, format } from "date-fns-tz";
import { getAllGatewaysService } from "@services/gatewayService";
import { getAllSensorsService }  from "@services/SensorService"; 
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
    res.status(201).json({ message: "Measurement created" });
  } catch (err) {
    next(err);
  }
}

export async function getOutlierMeasurements(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { networkCode } = req.params;
  const requestedMacs = normalizeSensorMacs(req.query.sensorMacs as any);
  const startDate     = normalizeDateParam(req.query.startDate);
  const endDate       = normalizeDateParam(req.query.endDate);

  try {
    const gateways = await getAllGatewaysService(networkCode);

    const sensorGroups = await Promise.all(
      gateways.map((gw) =>
        getAllSensorsService(networkCode, gw.macAddress)
          .then((daos) =>
            daos.map((s) => ({
              macAddress: s.macAddress,
              gatewayMac: gw.macAddress,
            }))
          )
      )
    );

    let sensors = sensorGroups.flat();

    if (requestedMacs.length) {
      sensors = sensors.filter((s) =>
        requestedMacs.includes(s.macAddress)
      );
    }

    const results = await Promise.all(
      sensors.map((s) =>
        getOutliersForSingleSensor(
          networkCode,
          s.gatewayMac,
          s.macAddress,
          startDate,
          endDate
        )
      )
    );

    const payload = results.map((r) => ({
      sensorMacAddress: r.sensorMacAddress,
      stats:            r.stats,
      measurements: r.measurements.map((m) => ({
        createdAt: formatWithOffset(m.createdAt),
        value:     m.value,
        isOutlier: m.isOutlier,
      })),
    }));

    res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
}
export async function getMeasurementsForSensor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { networkCode, gatewayMac, sensorMac } = req.params;
  const startDate = normalizeDateParam(req.query.startDate);
  const endDate = normalizeDateParam(req.query.endDate);

  try {
    const result = await getMeasurementsForSingleSensor(
      networkCode,
      gatewayMac,
      sensorMac,
      startDate,
      endDate
    );

    res.status(200).json({
      sensorMacAddress: result.sensorMacAddress,
      stats: result.stats
        ? {
            startDate: formatWithOffset(result.stats.startDate),
            endDate: formatWithOffset(result.stats.endDate),
            mean: result.stats.mean,
            variance: result.stats.variance,
            upperThreshold: result.stats.upperThreshold,
            lowerThreshold: result.stats.lowerThreshold,
          }
        : undefined,
      measurements: result.measurements.map((m) => ({
        createdAt: formatWithOffset(m.createdAt),
        value: m.value,
        isOutlier: m.isOutlier,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getStatisticsForSensor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { networkCode, gatewayMac, sensorMac } = req.params;
  const startDate = normalizeDateParam(req.query.startDate);
  const endDate = normalizeDateParam(req.query.endDate);

  try {
    const result = await getStatisticsForSingleSensor(
      networkCode,
      gatewayMac,
      sensorMac,
      startDate,
      endDate
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOutliersForSensor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { networkCode, gatewayMac, sensorMac } = req.params;
  const startDate = normalizeDateParam(req.query.startDate);
  const endDate = normalizeDateParam(req.query.endDate);

  try {
    const result = await getOutliersForSingleSensor(
      networkCode,
      gatewayMac,
      sensorMac,
      startDate,
      endDate
    );

    res.status(200).json({
      sensorMacAddress: result.sensorMacAddress,
      stats: result.stats,
      measurements: result.measurements.map((m) => ({
        createdAt: formatWithOffset(m.createdAt),
        value: m.value,
        isOutlier: m.isOutlier,
      })),
    });
  } catch (err) {
    next(err);
  }
}
export default formatWithOffset
