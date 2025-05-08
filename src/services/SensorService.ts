import { SensorRepository } from "@repositories/SensorRepository";
import { Sensor } from "@dao/Sensor";

export class SensorService {
  static async getAll(gatewayMacAddress: string): Promise<Sensor[]> {
    return SensorRepository.find({
      where: { gatewayMacAddress }
    });
  }

  static async getByMac(macAddress: string): Promise<Sensor | null> {
    return SensorRepository.findOneBy({ macAddress });
  }

  static async create(data: Partial<Sensor>): Promise<Sensor> {
    const sensor = SensorRepository.create(data);
    return SensorRepository.save(sensor);
  }

  static async update(macAddress: string, data: Partial<Sensor>): Promise<void> {
    await SensorRepository.update({ macAddress }, data);
  }

  static async delete(macAddress: string): Promise<void> {
    await SensorRepository.delete({ macAddress });
  }
}
