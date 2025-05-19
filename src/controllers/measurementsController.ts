import { Request, Response, NextFunction } from "express";
import { MeasurementFromJSON } from "@models/dto/Measurement";
import {
    getMeasPerNetwork,
    getStatisticsPerSensorInNetwork
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