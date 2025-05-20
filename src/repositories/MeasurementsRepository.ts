import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@models/dao/SensorDAO";


export class MeasurementsRepository{
    private repo: Repository<MeasurementDAO>;
    private gatewayRepo = new GatewayRepository();
    private networkRepo = new NetworkRepository();
    private sensorRepo = new SensorRepository();
    private groupingRepo = AppDataSource.getRepository(MeasurementsDAO);

    constructor() {
        this.repo = AppDataSource.getRepository(MeasurementDAO);
    }


async storeMeasurements(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  measurements: Array<{ createdAt: Date; value: number; isOutlier?: boolean }>
): Promise<void> {
  // 1) validate hierarchy exists
  await this.networkRepo.getNetworkByCode(networkCode);
  await this.gatewayRepo.getGateway(networkCode, gatewayMac);
  await this.sensorRepo.getSensor(networkCode, gatewayMac, sensorMac);

  // 2) fetch-or-create the grouping row
  let grouping = await this.groupingRepo.findOne({
    where: { sensorMacAddress: sensorMac },
    relations: ["measurements"]
  });

  if (!grouping) {
    grouping = new MeasurementsDAO();
    grouping.sensorMacAddress = sensorMac;
    grouping.measurements = [];
  }

  // 3) append each measurement
  for (const m of measurements) {
    const mdao = new MeasurementDAO();
    mdao.createdAt = m.createdAt;
    mdao.value = m.value;
    mdao.isOutlier = m.isOutlier ?? false;
    mdao.measurements = grouping;
    grouping.measurements.push(mdao);
  }

  // 4) save with cascade
  await this.groupingRepo.save(grouping);
}


    async getMeasPerNetwork(
    networkCode: string,
    sensorMacs: string[],
    startDate: string,
    endDate: string
): Promise<MeasurementDAO[]> {
    // ensure the network exists
    await this.networkRepo.getNetworkByCode(networkCode);

    const query = this.repo
        .createQueryBuilder("m")
        // join into the grouping table (MeasurementsDAO) via the "measurements" relation on MeasurementDAO
        .innerJoin("m.measurements", "grp")
        // now join SensorDAO by matching grp.sensorMacAddress → s.macAddress
        .innerJoin(
          SensorDAO,
          "s",
          "s.macAddress = grp.sensorMacAddress"
        )
        .innerJoin("s.gateway", "g")
        .innerJoin("g.network", "n")
        .where("n.code = :networkCode", { networkCode })
        .andWhere("m.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate });

    if (sensorMacs && sensorMacs.length > 0) {
        query.andWhere("s.macAddress IN (:...sensorMacs)", { sensorMacs });
    }

    return query.getMany();
}


    async getStatisticsPerSensorInNetwork(
        networkCode: string,
        sensorMacs: string[],
        startDate: string,
        endDate: string
    ): Promise<MeasurementDAO[]>{

        const network = await this.networkRepo.getNetworkByCode(networkCode)

        const measurements = await this.getMeasPerNetwork(networkCode, sensorMacs, startDate, endDate);

        const grouped: { [sensorMac: string]: number[] } = {};

        for (const m of measurements) {
            const mac = m.measurements.sensorMacAddress;
            if (!grouped[mac]) grouped[mac] = [];
            grouped[mac].push(m.value);
        }

        const results: any[] = [];

        for (const [sensorMac, values] of Object.entries(grouped)) {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
            const stdDev = Math.sqrt(variance);

            results.push({
                sensorMac,
                stats: {
                    startDate,
                    endDate,
                    mean: parseFloat(mean.toFixed(2)),
                    variance: parseFloat(variance.toFixed(2)),
                    upperThreshold: parseFloat((mean + 2 * stdDev).toFixed(2)),
                    lowerThreshold: parseFloat((mean - 2 * stdDev).toFixed(2))
                }
            });
        }

        return results;
    }
}

