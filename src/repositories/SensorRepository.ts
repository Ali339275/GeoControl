import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { SensorDAO } from "@models/dao/SensorDAO";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
export class SensorRepository {
  private repo: Repository<SensorDAO>;
  private gatewayRepo = new GatewayRepository();

  constructor() {
    this.repo = AppDataSource.getRepository(SensorDAO);
  }

  async getAllSensors(
    networkCode: string,
    gatewayMac: string
  ): Promise<SensorDAO[]> {
    await this.gatewayRepo.getGateway(networkCode, gatewayMac);
    return this.repo.find({ where: { gatewayId: gatewayMac } });
  }

  async getSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string
  ): Promise<SensorDAO> {
    await this.gatewayRepo.getGateway(networkCode, gatewayMac);
    const all = await this.repo.find({ where: { gatewayId: gatewayMac } });
    return findOrThrowNotFound(
      all,
      (s) => s.macAddress === sensorMac,
      `Sensor with MAC '${sensorMac}' not found`
    );
  }

  async createSensor(
    networkCode: string,
    gatewayMac: string,
    sensor: SensorDAO
  ): Promise<SensorDAO> {
    await this.gatewayRepo.getGateway(networkCode, gatewayMac);
    const existing = await this.repo.find({ where: { gatewayId: gatewayMac } });
    throwConflictIfFound(
      existing,
      (s) => s.macAddress === sensor.macAddress,
      `Sensor with MAC '${sensor.macAddress}' already exists`
    );
    sensor.gatewayId = gatewayMac;
    return this.repo.save(sensor);
  }

  async updateSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string,
    updated: Partial<SensorDAO>
  ): Promise<SensorDAO> {
    const sensor = await this.getSensor(networkCode, gatewayMac, sensorMac);
    const oldMac = sensor.macAddress;
    if (updated.macAddress && updated.macAddress !== oldMac) {
       const allSensors = await this.repo.find({
         where: { gatewayId: gatewayMac },
       });
       const others = allSensors.filter((s) => s.macAddress !== oldMac);
       throwConflictIfFound(
         others,
         (s) => s.macAddress === updated.macAddress,
         `Sensor with MAC '${updated.macAddress}' already exists`
       );
     }
    if (updated.macAddress && updated.macAddress !== oldMac) {
      const newMac = updated.macAddress;
      await AppDataSource.getRepository("measurements")
        .createQueryBuilder()
        .update()
        .set({ sensorMacAddress: newMac })
        .where("sensorMacAddress = :oldMac", { oldMac })
        .execute();
      await this.repo
        .createQueryBuilder()
        .update(SensorDAO)
        .set({ macAddress: newMac })
        .where("macAddress = :oldMac AND gatewayId = :gatewayId", {
          oldMac,
          gatewayId: gatewayMac,
        })
        .execute();
      await this.repo
        .createQueryBuilder()
        .update(SensorDAO)
        .set({
          ...(updated.name !== undefined && { name: updated.name }),
          ...(updated.description !== undefined && { description: updated.description }),
          ...(updated.variable !== undefined && { variable: updated.variable }),
          ...(updated.unit !== undefined && { unit: updated.unit }),
        })
        .where("macAddress = :newMac AND gatewayId = :gatewayId", {
          newMac,
          gatewayId: gatewayMac,
        })
        .execute();
      return this.repo.findOneOrFail({
        where: { macAddress: newMac, gatewayId: gatewayMac },
      });
    }
    Object.assign(sensor, updated);
    return this.repo.save(sensor);
  }

  async deleteSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string
  ): Promise<void> {
    const sensor = await this.getSensor(networkCode, gatewayMac, sensorMac);
    await this.repo.remove(sensor);
  }
}
