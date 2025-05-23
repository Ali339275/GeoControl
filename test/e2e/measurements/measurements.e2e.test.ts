import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Measurements E2E", () => {
  let token: string;
  const gatewayMac = "AA:BB:CC:DD:EE:FF";
  const sensorMac = "11:22:33:44:55:66";

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);


    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "NET_TEST",
        name: "Test Network",
        description: "Network for measurement store test"
      });

    await request(app)
      .post("/api/v1/networks/NET_TEST/gateways")
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: gatewayMac,
        name: "Gateway 1",
        description: "Test Gateway"
      });

    await request(app)
      .post("/api/v1/networks/NET_TEST/gateways/AA:BB:CC:DD:EE:FF/sensors")
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: sensorMac,
        name: "Sensor 1",
        description: "Test Sensor",
        variable: "test_variable",
        unit: "test_unit"
      });
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  const measurementTimestamp = new Date().toISOString();

  it("should store a measurement for a sensor", async () => {

    

    const response = await request(app)
      .post("/api/v1/networks/NET_TEST/gateways/AA:BB:CC:DD:EE:FF/sensors/11:22:33:44:55:66/measurements")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send([
        {
          createdAt: measurementTimestamp,
          value: 42.5
        }
      ]);

    expect(response.status).toBe(201);
    expect(Array.isArray(response.body)).toBe(false);
    expect(response.body).toHaveProperty("message", "Measurement created");
  });

  it("should retrieve measurements for a specific network", async () => {
    const startDate = new Date().toISOString();
    const endDate = new Date().toISOString();

    const res = await request(app)
      .get("/api/v1/networks/NET_TEST/measurements")
      .query({ startDate, endDate })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should retrieve statistics for a specific sensor", async () => {
    const startDate = new Date(new Date(measurementTimestamp).getTime() - 1000).toISOString();
    const endDate   = new Date(new Date(measurementTimestamp).getTime() + 1000).toISOString();  

    const res = await request(app)
        .get("/api/v1/networks/NET_TEST/stats")
        .query({ startDate, endDate })
        .set("Authorization", `Bearer ${token}`);

    console.log(res.body)

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  
    const first = res.body[0];
    expect(first).toHaveProperty("sensorMac", sensorMac);
    expect(first).toHaveProperty("stats");
    expect(first.stats).toHaveProperty("mean");
    expect(first.stats).toHaveProperty("variance");
  });
});