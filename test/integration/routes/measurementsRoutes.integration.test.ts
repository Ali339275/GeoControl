import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as measurementsController from "@controllers/measurementsController";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";

jest.mock("@services/authService");
jest.mock("@controllers/measurementsController");

describe("MeasurementsRoutes integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/v1/networks/:networkCode/measurements - should return measurements", async () => {
    const networkCode = "NET123";
    const mockMeasurements = [
      {
        sensorMacAddress: "MAC1",
        stats: {
          startDate: "2024-01-01T00:00:00+01:00",
          endDate: "2024-01-31T23:59:59+01:00",
          mean: 20,
          variance: 5,
          upperThreshold: 30,
          lowerThreshold: 10
        },
        measurements: [
          { createdAt: "2024-01-10T12:00:00+01:00", value: 22, isOutlier: false }
        ]
      }
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementsController.getMeasurementsPerNetwork as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json(mockMeasurements)
    );

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}/measurements`)
      .query({ sensorMacs: "MAC1", startDate: "2024-01-01", endDate: "2024-01-31" })
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockMeasurements);
    expect(measurementsController.getMeasurementsPerNetwork).toHaveBeenCalled();
  });

  it("GET /api/v1/networks/:networkCode/stats - should return statistics", async () => {
    const networkCode = "NET123";
    const mockStats = [
      {
        sensorMac: "MAC1",
        stats: {
          startDate: "2024-01-01T00:00:00+01:00",
          endDate: "2024-01-31T23:59:59+01:00",
          mean: 25,
          variance: 4,
          upperThreshold: 30,
          lowerThreshold: 20
        }
      }
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementsController.getStatistics as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json(mockStats)
    );

    const response = await request(app)
      .get(`/api/v1/networks/${networkCode}/stats`)
      .query({ sensorMacs: "MAC1", startDate: "2024-01-01", endDate: "2024-01-31" })
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockStats);
    expect(measurementsController.getStatistics).toHaveBeenCalled();
  });

  it("POST /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements - should store measurements", async () => {
    const payload = [
      {
        createdAt: "2024-01-10T12:00:00Z",
        value: 24,
        isOutlier: false
      }
    ];

    (authService.processToken as jest.Mock).mockResolvedValue({ type: UserType.Operator });
    (measurementsController.storeMeasurements as jest.Mock).mockImplementation((req, res) =>
      res.status(201).json({ message: "Measurement created" })
    );

    const response = await request(app)
      .post("/api/v1/networks/NET123/gateways/GW1/sensors/MAC1/measurements")
      .set("Authorization", token)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: "Measurement created" });
    expect(measurementsController.storeMeasurements).toHaveBeenCalled();
  });

  it("GET /api/v1/networks/:networkCode/measurements - 401 Unauthorized", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized");
    });

    const response = await request(app)
      .get("/api/v1/networks/NET123/measurements")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("POST /api/v1/networks/.../measurements - 403 Forbidden", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden");
    });

    const response = await request(app)
      .post("/api/v1/networks/NET123/gateways/GW1/sensors/MAC1/measurements")
      .set("Authorization", token)
      .send([
        { createdAt: "2024-01-01T00:00:00Z", value: 20, isOutlier: false }
      ]);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });
});