import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { Gateway } from "@dto/Gateway";

export class GatewayRepository {
  private repo: Repository<GatewayDAO>;
  private networkRepo: Repository<NetworkDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(GatewayDAO);
    this.networkRepo = AppDataSource.getRepository(NetworkDAO);
  }

  async getAllGateways(networkCode: string): Promise<GatewayDAO[]> {
    const network = await this.networkRepo.findOne({
      where: { code: networkCode },
      relations: ["gateways", "gateways.sensors"]
    });

    if (!network) {
      throw new Error(`Network with code '${networkCode}' not found`);
    }

    return network.gateways;
  }

  async getGateway(networkCode: string, macAddress: string): Promise<GatewayDAO> {
    const network = await this.networkRepo.findOne({
      where: { code: networkCode },
      relations: ["gateways", "gateways.sensors"]
    });

    if (!network) {
      throw new Error(`Network with code '${networkCode}' not found`);
    }

    return findOrThrowNotFound(
      network.gateways,
      (gw) => gw.macAddress === macAddress,
      `Gateway with MAC address '${macAddress}' not found`
    );
  }

  async createGateway(
    networkCode: string,
    gatewayData: { macAddress: string; name: string; description: string }
  ): Promise<GatewayDAO> {
    const network = await this.networkRepo.findOne({
      where: { code: networkCode }
    });

    if (!network) {
      throw new Error(`Network with code '${networkCode}' not found`);
    }

    // Conflict check
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress: gatewayData.macAddress } }),
      () => true,
      `Gateway with MAC address '${gatewayData.macAddress}' already exists`
    );

    const gateway = new GatewayDAO();
    gateway.macAddress = gatewayData.macAddress;
    gateway.name = gatewayData.name;
    gateway.description = gatewayData.description;
    gateway.network = network;

    return await this.repo.save(gateway);
  }

  async updateGateway(
  networkCode: string,
  oldMacAddress: string,
  updatedData: { macAddress: string; name: string; description: string }
): Promise<GatewayDAO> {
  const gateway = await this.getGateway(networkCode, oldMacAddress);

  // Ensure the network still exists
  const network = await this.networkRepo.findOne({ where: { code: networkCode } });
  if (!network) {
    throw new Error(`Network with code '${networkCode}' not found`);
  }

  // Check for conflict with new macAddress
  if (updatedData.macAddress !== oldMacAddress) {
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress: updatedData.macAddress } }),
      () => true,
      `Gateway with MAC address '${updatedData.macAddress}' already exists`
    );
  }

  // Backup associated sensors
  const sensors = gateway.sensors || [];

  // Remove old gateway (cascades delete to sensors)
  await this.repo.remove(gateway);

  // Create new gateway
  const newGateway = new GatewayDAO();
  newGateway.macAddress = updatedData.macAddress;
  newGateway.name = updatedData.name;
  newGateway.description = updatedData.description;
  newGateway.network = network;
  newGateway.sensors = sensors.map(sensor => {
    const newSensor = new SensorDAO();
    newSensor.macAddress = sensor.macAddress;
    newSensor.name = sensor.name;
    newSensor.description = sensor.description;
    newSensor.variable = sensor.variable;
    newSensor.unit = sensor.unit;
    return newSensor;
  });

  return await this.repo.save(newGateway);
}


  async deleteGateway(networkCode: string, macAddress: string): Promise<void> {
    const gateway = await this.getGateway(networkCode, macAddress);
    await this.repo.remove(gateway);
  }
}
