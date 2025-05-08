import { Request, Response } from "express";
import { SensorService } from "@services/SensorService";

export class SensorController {
  static async getAll(req: Request, res: Response) {
    const gatewayMac = req.params.gatewayMac;
    const sensors = await SensorService.getAll(gatewayMac);
    res.json(sensors);
  }

  static async getByMac(req: Request, res: Response) {
    const sensor = await SensorService.getByMac(req.params.sensorMac);
    if (!sensor) return res.status(404).json({ message: "Sensor not found" });
    res.json(sensor);
  }

  static async create(req: Request, res: Response) {
    const gatewayMac = req.params.gatewayMac;
    const data = {
      ...req.body,
      gatewayMacAddress: gatewayMac
    };
    const sensor = await SensorService.create(data);
    res.status(201).json(sensor);
  }

  static async update(req: Request, res: Response) {
    await SensorService.update(req.params.sensorMac, req.body);
    res.status(204).send();
  }

  static async delete(req: Request, res: Response) {
    await SensorService.delete(req.params.sensorMac);
    res.status(204).send();
  }
}
