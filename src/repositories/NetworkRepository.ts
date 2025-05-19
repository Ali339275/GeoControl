import { NetworkDAO } from "@models/dao/NetworkDAO";
import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { Gateway } from "@models/dto/Gateway";
import { GatewayDAO } from "@models/dao/GatewayDAO";
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

  async updateNetwork(code: string, updatedNetwork: NetworkDTO): Promise<void> {

    if (!updatedNetwork.code || !updatedNetwork.name || !updatedNetwork.description) {
        throw new Error("All fields (code, name, and description) must be provided.");
    }

    const existingNetwork = await this.getNetworkByCode(code);

    // existingNetwork.code = updatedNetwork.code;
    existingNetwork.name = updatedNetwork.name;
    existingNetwork.description = updatedNetwork.description;

  if (updatedNetwork.gateways) {
    existingNetwork.gateways = updatedNetwork.gateways.map(gw => {
      const gatewayDAO = new GatewayDAO();
      gatewayDAO.macAddress = gw.macAddress!;
      gatewayDAO.name = gw.name!;
      gatewayDAO.description = gw.description!;
      gatewayDAO.network = existingNetwork; // This is critical

      return gatewayDAO;
    });
  } else {
    existingNetwork.gateways = [];
  }

   await this.repo.save(existingNetwork);
   
  
  }

  async deleteNetwork(code: string): Promise<void> {
    await this.repo.remove(await this.getNetworkByCode(code));
  }
}