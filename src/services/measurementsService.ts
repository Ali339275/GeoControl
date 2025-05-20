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
): Promise<Array<{
  sensorMacAddress: string;
  stats: any;
  measurements: any[];
}>> {
  // 1) compute stats per sensor
  const statsArr = await repo.getStatisticsPerSensorInNetwork(networkCode, sensorMacs, startDate, endDate);
  // 2) load all measurements in window
  const allMeas = await repo.getMeasPerNetwork(networkCode, sensorMacs, startDate, endDate);

  // build a quick map of stats
  const statsMap = new Map<string, any>(
    statsArr.map(s => [ (s as any).sensorMacAddress, (s as any).stats ])
  );

  // filter only outliers
  const grouped: Record<string, any[]> = {};
  for (const m of allMeas) {
    const mac = (m.measurements as any).sensorMacAddress;
    const st = statsMap.get(mac);
    if (!st) continue;
    if (m.value > st.upperThreshold || m.value < st.lowerThreshold) {
      (grouped[mac] ||= []).push(m);
    }
  }

  // merge into final shape
  return statsArr.map(s => {
    const mac = (s as any).sensorMacAddress;
    return {
      sensorMacAddress: mac,
      stats: (s as any).stats,
      measurements: grouped[mac] || []
    };
  });
}
