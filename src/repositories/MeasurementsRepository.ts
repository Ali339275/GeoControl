import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";


export class MeasurementsRepository{
    private repo: Repository<MeasurementDAO>;
    private gatewayRepo = new GatewayRepository();
    private networkRepo = new NetworkRepository();
    private sensorRepo = new SensorRepository();

    constructor() {
        this.repo = AppDataSource.getRepository(MeasurementDAO);
    }

    async getMeasPerNetwork(
        networkCode: string,
        sensorMacs: string[],
        startDate: string,
        endDate: string
    ): Promise<MeasurementDAO[]> {

        const network = await this.networkRepo.getNetworkByCode(networkCode)
    

        const query = this.repo
            .createQueryBuilder("m")
            .leftJoinAndSelect("m.sensor", "s")
            .leftJoin("s.gateway", "g")
            .innerJoin("g.network", "n")
            .where("n.networkCode = :networkCode", {networkCode})
            .andWhere("m.createdAt BETWEEN :startDate AND :endDate", {startDate, endDate})
            ;
        if(sensorMacs && sensorMacs.length>0){
            query.andWhere("s.sensorMac IN (:...sensorMacs)", {sensorMacs});
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