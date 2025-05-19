import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { Measurements } from "@dto/Measurements";
import { MeasurementsRepository } from "@repositories/MeasurementsRepository";

const measurementRepo =  new MeasurementsRepository();

export async function getMeasPerNetwork(
    networkCode: string,
    sensorMacs: string[],
    startDate: string,
    endDate: string
  ): Promise<MeasurementDAO[]> {
    return measurementRepo.getMeasPerNetwork(networkCode, sensorMacs, startDate, endDate);
  }

  export async function getStatisticsPerSensorInNetwork(
    networkCode: string,
    sensorMacs: string[],
    startDate: string,
    endDate: string
  ): Promise<MeasurementDAO[]> {
    return measurementRepo.getStatisticsPerSensorInNetwork(networkCode, sensorMacs, startDate, endDate);
  }

