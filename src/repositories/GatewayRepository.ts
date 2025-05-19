import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { GatewayDAO } from "@models/dao/GatewayDAO";
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
    macAddress: string,
    updatedData: { name: string; description: string }
  ): Promise<GatewayDAO> {
    const gateway = await this.getGateway(networkCode, macAddress);
    gateway.name = updatedData.name;
    gateway.description = updatedData.description;
    return await this.repo.save(gateway);
  }

  async deleteGateway(networkCode: string, macAddress: string): Promise<void> {
    const gateway = await this.getGateway(networkCode, macAddress);
    await this.repo.remove(gateway);
  }
}
