import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import formatWithOffset from "@controllers/measurementsController"
import { SensorDAO } from "@models/dao/SensorDAO";
export interface Stats {
    startDate?: Date;
    endDate?: Date;
    mean?: number;
    variance?: number;
    upperThreshold?: number;
    lowerThreshold?: number;
}



export class MeasurementsRepository{
    private repo: Repository<MeasurementsDAO>;
    private gatewayRepo = new GatewayRepository();
    private networkRepo = new NetworkRepository();
    private sensorRepo = new SensorRepository();
    private groupingRepo = AppDataSource.getRepository(MeasurementsDAO);

    constructor() {
        this.repo = AppDataSource.getRepository(MeasurementsDAO);
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

        await this.groupingRepo.save(grouping); //persist the grouping so FK is valid
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
      ): Promise<
        {
          sensorMacAddress: string;
          stats: {
            startDate: Date;
            endDate: Date;
            mean: number;
            variance: number;
            upperThreshold: number;
            lowerThreshold: number;
          };
          measurements: {
            createdAt: Date;
            value: number;
            isOutlier: boolean;
          }[];
        }[]
      > {
        await this.networkRepo.getNetworkByCode(networkCode);
      
        const groups = await this.repo
          .createQueryBuilder("m")
          .leftJoinAndSelect("m.sensor", "s")
          .leftJoin("s.gateway", "g")
          .innerJoin("g.network", "n")
          .leftJoinAndSelect("m.measurements", "meas")
          .where("n.Code = :networkCode", { networkCode })
          .andWhere(sensorMacs.length > 0 ? "s.macAddress IN (:...sensorMacs)" : "1=1", { sensorMacs })
          .getMany();
      
        const filtered = groups.map(group => {
          const mac = group.sensor.macAddress;
      
          const filteredMeasurements = group.measurements.filter(meas => {
            const createdAt = formatWithOffset(meas.createdAt);
            return createdAt >= (startDate) && createdAt <= (endDate);
          });
      
          const values = filteredMeasurements.map(m => m.value);
      
          let stats = null;
      
          if (values.length > 0) {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
            const stdDev = Math.sqrt(variance);
      
            stats = {
              startDate,
              endDate,
              mean: parseFloat(mean.toFixed(2)),
              variance: parseFloat(variance.toFixed(2)),
              upperThreshold: parseFloat((mean + 2 * stdDev).toFixed(2)),
              lowerThreshold: parseFloat((mean - 2 * stdDev).toFixed(2))
            };
          }
      
          const measurements = filteredMeasurements.map(meas => {
            const isOutlier =
              stats !== null &&
              (meas.value > stats.upperThreshold || meas.value < stats.lowerThreshold);
      
            return {
              createdAt: (meas.createdAt),
              value: parseFloat(meas.value.toFixed(4)),
              isOutlier
            };
          });
      
          return {
            sensorMacAddress: mac,
            stats,
            measurements
          };
        });
      
        return filtered;
      }


    async getStatisticsPerSensorInNetwork(
        networkCode: string,
        sensorMacs: string[],
        startDate: string,
        endDate: string
      ): Promise<
        {
          sensorMac: string;
          stats?: {
            startDate: string;
            endDate: string;
            mean: number;
            variance: number;
            upperThreshold: number;
            lowerThreshold: number;
          };
        }[]
      > {
        await this.networkRepo.getNetworkByCode(networkCode);
      
        const measurementsGroups = await this.getMeasPerNetwork(
          networkCode,
          sensorMacs,
          startDate,
          endDate
        );
      
        const results: {
          sensorMac: string;
          stats?: {
            startDate: Date;
            endDate: Date;
            mean: number;
            variance: number;
            upperThreshold: number;
            lowerThreshold: number;
          };
        }[] = [];
        
        for (const group of measurementsGroups) {
          const values = group.measurements
            .filter((m) => {
              const createdAt =formatWithOffset(m.createdAt);
              return createdAt >= (startDate) && createdAt <= (endDate);
            })
            .map((m) => m.value);
      
          if (values.length === 0) continue;
      
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
          const stdDev = Math.sqrt(variance);
      
          const stats = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            mean: parseFloat(mean.toFixed(2)),
            variance: parseFloat(variance.toFixed(2)),
            upperThreshold: parseFloat((mean + 2 * stdDev).toFixed(2)),
            lowerThreshold: parseFloat((mean - 2 * stdDev).toFixed(2)),
          };
      
          group.stats = stats;

          // await this.repo.save(group); // Save updated entity with stats
      

          results.push({
            sensorMac: group.sensorMacAddress,
            stats,
          });
        }

        const formattedResults = results.map(r => ({
          sensorMac: r.sensorMac,
          stats: r.stats
            ? {
                startDate: formatWithOffset(r.stats.startDate),
                endDate: formatWithOffset(r.stats.endDate),
                mean: r.stats.mean,
                variance: r.stats.variance,
                upperThreshold: r.stats.upperThreshold,
                lowerThreshold: r.stats.lowerThreshold
              }
            : undefined
        }));
        
        return formattedResults;
      
    }
}
