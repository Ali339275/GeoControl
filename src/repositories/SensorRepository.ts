import { AppDataSource } from "@database";
import { SensorDAO } from '../models/dao/SensorDAO';
import { Repository } from 'typeorm';

export class SensorRepository {
  private repository: Repository<SensorDAO>;

  constructor() {
    this.repository = AppDataSource.getRepository(SensorDAO);
  }

  findAll(): Promise<SensorDAO[]> {
    return this.repository.find({ relations: ['gateway'] });
  }

  findByMac(macAddress: string): Promise<SensorDAO | null> {
    return this.repository.findOne({ where: { macAddress }, relations: ['gateway'] });
  }

  async create(sensor: SensorDAO): Promise<SensorDAO> {
    return this.repository.save(sensor);
  }

  async update(macAddress: string, updated: Partial<SensorDAO>): Promise<SensorDAO | null> {
    const sensor = await this.findByMac(macAddress);
    if (!sensor) return null;
    Object.assign(sensor, updated);
    return this.repository.save(sensor);
  }

  async delete(macAddress: string): Promise<boolean> {
    const result = await this.repository.delete({ macAddress });
    return result.affected !== 0;
  }
}
