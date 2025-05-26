import { NetworkDAO } from "@models/dao/NetworkDAO";
import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { Gateway } from "@models/dto/Gateway";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import {Network as NetworkDTO} from "@dto/Network"


export class NetworkRepository {
  private repo: Repository<NetworkDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(NetworkDAO);
  }

  getAllNetworks(): Promise<NetworkDAO[]> {
    return this.repo.find({
    relations: ["gateways", "gateways.sensors"],
  });
  }

  async getNetworkByCode(code: string): Promise<NetworkDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { code: code }, relations: ["gateways", "gateways.sensors"] }),
      () => true,
      `Network with code '${code}' not found`
    );
  }

  async createNetwork(
    code: string,
    name: string,
    description: string,
    gateways: Array<Gateway>
  ): Promise<NetworkDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { code: code } }),
      () => true,
      `Network with code '${code}' already exists`
    );

    return this.repo.save({
        code: code,
        name: name,
        description: description,
        gateways: gateways
    });
  }



  async updateNetwork(oldCode: string, updatedNetwork: NetworkDTO): Promise<void> {
    if (!updatedNetwork.code || !updatedNetwork.name || !updatedNetwork.description) {
      throw new Error("All fields (code, name, and description) must be provided.");
    }

    const existingNetwork = await this.getNetworkByCode(oldCode);


    const newNetwork = new NetworkDAO();
    newNetwork.code = updatedNetwork.code;
    newNetwork.name = updatedNetwork.name;
    newNetwork.description = updatedNetwork.description;
    newNetwork.gateways = [];


    for (const oldGateway of existingNetwork.gateways) {
      const newGateway = new GatewayDAO();
      newGateway.macAddress = oldGateway.macAddress;
      newGateway.name = oldGateway.name;
      newGateway.description = oldGateway.description;
      newGateway.network = newNetwork;

      newGateway.sensors = (oldGateway.sensors || []).map(oldSensor => {
        const newSensor = new SensorDAO();
        newSensor.macAddress = oldSensor.macAddress;
        newSensor.name = oldSensor.name;
        newSensor.description = oldSensor.description;
        newSensor.variable = oldSensor.variable;
        newSensor.unit = oldSensor.unit;
        newSensor.gateway = newGateway;
        newSensor.networkCode = updatedNetwork.code;
        return newSensor;
      });

      newNetwork.gateways.push(newGateway);
    }


    await this.repo.save(newNetwork);

    await this.repo.delete(oldCode);
  }


  async deleteNetwork(code: string): Promise<void> {
    await this.repo.remove(await this.getNetworkByCode(code));
  }
}