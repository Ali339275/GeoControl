import { Measurement } from "@models/dto/Measurement";
import { MeasurementsRepository } from "@repositories/MeasurementsRepository";

const repo = new MeasurementsRepository();

export async function getMeasPerNetwork(
  networkCode: string,
  sensorMacs: string[],
  startDate: string,
  endDate: string
) {
  return repo.getMeasPerNetwork(networkCode, sensorMacs, startDate, endDate);
}

export async function getStatisticsPerSensorInNetwork(
  networkCode: string,
  sensorMacs: string[],
  startDate: string,
  endDate: string
) {
  return repo.getStatisticsPerSensorInNetwork(networkCode, sensorMacs, startDate, endDate);
}


export async function addMeasurements(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  measurements: Measurement[]
): Promise<void> {
  return repo.storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);
}


export async function fetchOutliers(
  networkCode: string,
  sensorMacs: string[],
  startDate: string,
  endDate: string
): Promise<
  Array<{
    sensorMacAddress: string;
    stats: {
      startDate: string;
      endDate: string;
      mean: number;
      variance: number;
      upperThreshold: number;
      lowerThreshold: number;
    };
    measurements: Array<{
      createdAt: Date;
      value: number;
      isOutlier: true;
    }>;
  }>
> {
  // 1) Fetch μ & σ² for each sensor
  const statsArr = await repo.getStatisticsPerSensorInNetwork(
    networkCode,
    sensorMacs,
    startDate,
    endDate
  );

  // 2) Fetch all raw measurements in the same window
  const allGroups = await repo.getMeasPerNetwork(
    networkCode,
    sensorMacs,
    startDate,
    endDate
  );

  // 3) For each sensor, compute σ, thresholds, then pick only outliers
  return statsArr.map((item: any) => {
    const mac = item.sensorMacAddress;
    const raw = item.stats!;
    const μ = raw.mean;
    const σ = Math.sqrt(raw.variance);
    const upper = μ + 2 * σ;
    const lower = μ - 2 * σ;

    // find this sensor’s measurements
    const group = allGroups.find((g: any) => g.sensorMacAddress === mac);
    const meas = Array.isArray(group?.measurements)
      ? group!.measurements
      : [];

    // filter to only true outliers
    const outliers = meas
      .filter((m: any) => m.value > upper || m.value < lower)
      .map((m: any) => ({
        createdAt: m.createdAt,
        value: m.value,
        isOutlier: true as const
      }));

    return {
      sensorMacAddress: mac,
      stats: {
        startDate: raw.startDate,
        endDate: raw.endDate,
        mean: μ,
        variance: raw.variance,
        upperThreshold: upper,
        lowerThreshold: lower
      },
      measurements: outliers
    };
  });
}