import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      findOne: mockFindOne,
      find: mockFind,
      save: mockSave,
      remove: mockRemove,
    }),
  },
}));

describe("GatewayRepository: mocked database", () => {
  const repo = new GatewayRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllGateways: returns gateways when network exists", async () => {
    const mockGateways = [
      {
        macAddress: "GW1",
        name: "Gateway One",
        description: "Description",
        sensors: [],
      },
    ];
    mockFindOne.mockResolvedValue({
      code: "NET1",
      gateways: mockGateways,
    });

    const result = await repo.getAllGateways("NET1");

    expect(result).toBe(mockGateways);
    expect(mockFindOne).toHaveBeenCalledWith({
      where: { code: "NET1" },
      relations: ["gateways", "gateways.sensors"],
    });
  });

  it("getAllGateways: throws error if network not found", async () => {
    mockFindOne.mockResolvedValue(null);

    await expect(repo.getAllGateways("UNKNOWN")).rejects.toThrow(
      "Network with code 'UNKNOWN' not found"
    );
  });

  it("getGateway: returns gateway when found", async () => {
    const mockGateway = {
      macAddress: "GW1",
      name: "Gateway One",
      description: "Desc",
      sensors: [],
    };
    mockFindOne.mockResolvedValue({
      code: "NET1",
      gateways: [mockGateway],
    });

    const result = await repo.getGateway("NET1", "GW1");

    expect(result).toBe(mockGateway);
  });

  it("getGateway: throws error if network not found", async () => {
    mockFindOne.mockResolvedValue(null);

    await expect(repo.getGateway("NET1", "GW1")).rejects.toThrow(
      "Network with code 'NET1' not found"
    );
  });

  it("getGateway: throws error if gateway not found", async () => {
    mockFindOne.mockResolvedValue({
      code: "NET1",
      gateways: [],
    });

    await expect(repo.getGateway("NET1", "GW1")).rejects.toThrow(
      "Gateway with MAC address 'GW1' not found"
    );
  });

  it("createGateway: successfully creates gateway", async () => {
    const mockNetwork = { code: "NET1" };
    mockFindOne.mockResolvedValue(mockNetwork);
    mockFind.mockResolvedValue([]); // no conflict
   const mockSavedGateway = {
  macAddress: "GW1",
  name: "Gateway One",
  description: "Desc",
  network: mockNetwork,
  sensors: [],
};


    mockSave.mockResolvedValue(mockSavedGateway);

    const result = await repo.createGateway("NET1", {
      macAddress: "GW1",
      name: "Gateway One",
      description: "Desc",
    });

    expect(result).toBe(mockSavedGateway);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        macAddress: "GW1",
        name: "Gateway One",
        description: "Desc",
        network: mockNetwork,
      })
    );
  });

  it("createGateway: throws error if network not found", async () => {
    mockFindOne.mockResolvedValue(null);

    await expect(
      repo.createGateway("NET1", {
        macAddress: "GW1",
        name: "Gateway One",
        description: "Desc",
      })
    ).rejects.toThrow("Network with code 'NET1' not found");
  });

  it("createGateway: throws conflict error if macAddress exists", async () => {
    mockFindOne.mockResolvedValue({ code: "NET1" });
    mockFind.mockResolvedValue([new GatewayDAO()]); // simulate conflict

    await expect(
      repo.createGateway("NET1", {
        macAddress: "GW1",
        name: "Gateway One",
        description: "Desc",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("updateGateway: updates gateway successfully", async () => {
    const oldGateway = new GatewayDAO();
    oldGateway.macAddress = "GW1";
    oldGateway.name = "Old Gateway";
    oldGateway.description = "Old desc";

    const sensor = new SensorDAO();
    sensor.macAddress = "S1";
    sensor.name = "Sensor 1";
    sensor.description = "Desc";
    sensor.variable = "Temp";
    sensor.unit = "C";

    oldGateway.sensors = [sensor];

    const network = new NetworkDAO();
    network.code = "NET1";

    mockFindOne
      .mockResolvedValueOnce({ code: "NET1", gateways: [oldGateway], sensors: [] }) // getGateway
      .mockResolvedValueOnce(network); // network check

    mockFind.mockResolvedValue([]); // no conflict with new MAC
    mockRemove.mockResolvedValue(undefined);
    mockSave.mockResolvedValue({ ...oldGateway, macAddress: "GW2", name: "New Gateway", description: "New desc" });

    const updated = await repo.updateGateway("NET1", "GW1", {
      macAddress: "GW2",
      name: "New Gateway",
      description: "New desc",
    });

    expect(mockRemove).toHaveBeenCalledWith(oldGateway);
    expect(mockSave).toHaveBeenCalled();
    expect(updated.macAddress).toBe("GW2");
  });

  it("updateGateway: throws error if network not found", async () => {
    const mockNetworkWithGateways = {
      code: "NET1",
      gateways: [
        {
          macAddress: "GW1",
          name: "Old Gateway",
          description: "Old desc",
          sensors: [
            {
              macAddress: "S1",
              name: "Sensor 1",
              description: "Desc",
              variable: "Temp",
              unit: "C",
            },
          ],
        },
      ],
    };

    // 1st findOne call (getGateway) returns valid network
    // 2nd findOne call (network existence check) returns null -> triggers error
    mockFindOne
      .mockResolvedValueOnce(mockNetworkWithGateways)
      .mockResolvedValueOnce(null);

    await expect(
      repo.updateGateway("NET1", "GW1", {
        macAddress: "GW1",
        name: "Name",
        description: "Desc",
      })
    ).rejects.toThrow("Network with code 'NET1' not found");
  });

  it("updateGateway: throws conflict error if new macAddress exists", async () => {
    const oldGateway = new GatewayDAO();
    oldGateway.macAddress = "GW1";
    oldGateway.name = "Old Gateway";
    oldGateway.description = "Old desc";
    oldGateway.sensors = [];

    const network = new NetworkDAO();
    network.code = "NET1";

    mockFindOne
      .mockResolvedValueOnce({ code: "NET1", gateways: [oldGateway] }) // getGateway
      .mockResolvedValueOnce(network); // network check

    // Conflict detected because new macAddress GW2 exists
    mockFind.mockResolvedValue([new GatewayDAO()]);

    await expect(
      repo.updateGateway("NET1", "GW1", {
        macAddress: "GW2",
        name: "Name",
        description: "Desc",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("deleteGateway: deletes gateway successfully", async () => {
    const gateway = new GatewayDAO();
    gateway.macAddress = "GW1";

    mockFindOne.mockResolvedValue({
      code: "NET1",
      gateways: [gateway],
    });
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteGateway("NET1", "GW1");

    expect(mockRemove).toHaveBeenCalledWith(gateway);
  });

  it("deleteGateway: throws error if gateway not found", async () => {
    mockFindOne.mockResolvedValue({
      code: "NET1",
      gateways: [],
    });

    await expect(repo.deleteGateway("NET1", "GW1")).rejects.toThrow(
      "Gateway with MAC address 'GW1' not found"
    );
  });
});
