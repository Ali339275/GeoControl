// src/controllers/measurementsController.ts

import { Request, Response, NextFunction } from "express";
import {
  getMeasPerNetwork,
  getStatisticsPerSensorInNetwork,
  addMeasurements,
  getMeasurementsForSingleSensor,
  getStatisticsForSingleSensor,
  getOutliersForSingleSensor,
} from "@services/measurementsService";
import { getAllGatewaysService } from "@services/gatewayService";
import { getAllSensorsService } from "@services/SensorService";

function normalizeDateParam(param: any): string {
  if (typeof param !== "string") throw new Error("Invalid date parameter");
  return new Date(param).toISOString();
}

function normalizeSensorMacs(param: any): string[] {
  if (!param) return [];
  if (Array.isArray(param)) return param as string[];
  if (typeof param === "string") return param.split(",");
  throw new Error("Invalid sensorMacs parameter");
}

function formatWithOffset(date: Date): string {
  const tzOffsetMinutes = date.getTimezoneOffset();
  const offsetMilliseconds = -tzOffsetMinutes * 60 * 1000;
  const localDate = new Date(date.getTime() + offsetMilliseconds);
  return localDate.toISOString().replace("Z", "");
}

export async function getMeasurementsPerNetwork(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const networkCode = req.params.networkCode;
  const sensorMacs = normalizeSensorMacs(req.query.sensorMacs as any);

  const startDate =
    typeof req.query.startDate === "string"
      ? normalizeDateParam(req.query.startDate)
      : new Date(0).toISOString();

  const endDate =
    typeof req.query.endDate === "string"
      ? normalizeDateParam(req.query.endDate)
      : new Date().toISOString();

  try {
    const measurements = await getMeasPerNetwork(
      networkCode,
      sensorMacs,
      startDate,
      endDate
    );

    const formattedMeasurements = measurements.map((group) => ({
      sensorMacAddress: group.sensorMacAddress,
      stats: group.stats
        ? {
            startDate: formatWithOffset(new Date(group.stats.startDate)),
            endDate: formatWithOffset(new Date(group.stats.endDate)),
            mean: group.stats.mean,
            variance: group.stats.variance,
            upperThreshold: group.stats.upperThreshold,
            lowerThreshold: group.stats.lowerThreshold,
          }
        : undefined,
      measurements: group.measurements.map((m) => ({
        createdAt: formatWithOffset(new Date(m.createdAt)),
        value: m.value,
        isOutlier: m.isOutlier,
      })),
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

  const startDate =
    typeof req.query.startDate === "string"
      ? normalizeDateParam(req.query.startDate)
      : new Date(0).toISOString();

  const endDate =
    typeof req.query.endDate === "string"
      ? normalizeDateParam(req.query.endDate)
      : new Date().toISOString();

  try {
    const stats = await getStatisticsPerSensorInNetwork(
      networkCode,
      sensorMacs,
      startDate,
      endDate
    );

    const formatted = stats.map((grp) => ({
      sensorMacAddress: grp.sensorMac,
      stats: grp.stats
        ? {
            startDate: formatWithOffset(new Date(grp.stats.startDate)),
            endDate: formatWithOffset(new Date(grp.stats.endDate)),
            mean: grp.stats.mean,
            variance: grp.stats.variance,
            upperThreshold: grp.stats.upperThreshold,
            lowerThreshold: grp.stats.lowerThreshold,
          }
        : undefined,
    }));

    res.status(200).json(formatted);
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

  const startDate =
    typeof req.query.startDate === "string"
      ? normalizeDateParam(req.query.startDate)
      : new Date(0).toISOString();

  const endDate =
    typeof req.query.endDate === "string"
      ? normalizeDateParam(req.query.endDate)
      : new Date().toISOString();

  try {
    const gateways = await getAllGatewaysService(networkCode);

    const sensorGroups = await Promise.all(
      gateways.map((gw) =>
        getAllSensorsService(networkCode, gw.macAddress).then((sensors) => {
          return Promise.all(
            sensors.map((s) =>
              getOutliersForSingleSensor(
                networkCode,
                gw.macAddress,
                s.macAddress,
                startDate,
                endDate
              )
            )
          );
        })
      )
    );

    const flattened = sensorGroups.flat();
    const formatted = flattened.map((group) => ({
      sensorMacAddress: group.sensorMacAddress,
      measurements: group.measurements.map((m) => ({
        createdAt: formatWithOffset(new Date(m.createdAt)),
        value: m.value,
        isOutlier: m.isOutlier,
      })),
    }));

    res.status(200).json(formatted);
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
  try {
    await addMeasurements(
      networkCode,
      gatewayMac,
      sensorMac,
      req.body as any
    );
    res.status(201).end();
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
  const startDate =
    typeof req.query.startDate === "string"
      ? normalizeDateParam(req.query.startDate)
      : new Date(0).toISOString();

  const endDate =
    typeof req.query.endDate === "string"
      ? normalizeDateParam(req.query.endDate)
      : new Date().toISOString();

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
            startDate: formatWithOffset(new Date(result.stats.startDate)),
            endDate: formatWithOffset(new Date(result.stats.endDate)),
            mean: result.stats.mean,
            variance: result.stats.variance,
            upperThreshold: result.stats.upperThreshold,
            lowerThreshold: result.stats.lowerThreshold,
          }
        : undefined,
      measurements: result.measurements.map((m) => ({
        createdAt: formatWithOffset(new Date(m.createdAt)),
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
  const startDate =
    typeof req.query.startDate === "string"
      ? normalizeDateParam(req.query.startDate)
      : new Date(0).toISOString();

  const endDate =
    typeof req.query.endDate === "string"
      ? normalizeDateParam(req.query.endDate)
      : new Date().toISOString();

  try {
    const result = await getStatisticsForSingleSensor(
      networkCode,
      gatewayMac,
      sensorMac,
      startDate,
      endDate
    );
    res.status(200).json({
      sensorMacAddress: result.sensorMac,
      stats: result.stats
        ? {
            startDate: formatWithOffset(new Date(result.stats.startDate)),
            endDate: formatWithOffset(new Date(result.stats.endDate)),
            mean: result.stats.mean,
            variance: result.stats.variance,
            upperThreshold: result.stats.upperThreshold,
            lowerThreshold: result.stats.lowerThreshold,
          }
        : undefined,
    });
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
  const startDate =
    typeof req.query.startDate === "string"
      ? normalizeDateParam(req.query.startDate)
      : new Date(0).toISOString();

  const endDate =
    typeof req.query.endDate === "string"
      ? normalizeDateParam(req.query.endDate)
      : new Date().toISOString();

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
      measurements: result.measurements.map((m) => ({
        createdAt: formatWithOffset(new Date(m.createdAt)),
        value: m.value,
        isOutlier: m.isOutlier,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export default formatWithOffset;
