import { NetworkRepository } from "@repositories/NetworkRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { Gateway } from "@models/dto/Gateway";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("NetworkRepository: SQLite in-memory", () => {
  const repo = new NetworkRepository();

  it("create and retrieve network", async () => {
    const gateways: Gateway[] = [];
    const created = await repo.createNetwork("NET1", "Network 1", "Desc 1", gateways);

    expect(created).toMatchObject({
      code: "NET1",
      name: "Network 1",
      description: "Desc 1",
      gateways: []
    });

    const found = await repo.getNetworkByCode("NET1");
    expect(found.code).toBe("NET1");
    expect(found.gateways).toEqual([]);
  });

  it("create network: conflict", async () => {
    await repo.createNetwork("NET1", "Network 1", "Desc 1", []);
    await expect(
      repo.createNetwork("NET1", "Network Dup", "Desc Dup", [])
    ).rejects.toThrow(ConflictError);
  });

  it("get network by code: not found", async () => {
    await expect(repo.getNetworkByCode("UNKNOWN")).rejects.toThrow(NotFoundError);
  });

  it("delete network", async () => {
    await repo.createNetwork("NET1", "Network 1", "Desc 1", []);
    await repo.deleteNetwork("NET1");
    await expect(repo.getNetworkByCode("NET1")).rejects.toThrow(NotFoundError);
  });
});