// src/controllers/SensorController.ts
import { Request, Response } from 'express';
import {
  getAllSensorsService,
  getSensorService,
  createSensorService,
  updateSensorService,
  deleteSensorService,
} from '@services/SensorService';

export const getAllSensors = async (req: Request, res: Response) => {
  try {
    const sensors = await getAllSensorsService();
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching sensors' });
  }
};

export const getSensor = async (req: Request, res: Response) => {
  try {
    const sensor = await getSensorService(req.params.macAddress);
    res.json(sensor);
  } catch (err) {
    res.status(404).json({ error: 'Sensor not found' });
  }
};

export const createSensor = async (req: Request, res: Response) => {
  try {
    const { gatewayMac } = req.params;
    const payload = {
      ...req.body,
      gatewayMac
    };

    console.log("Create Sensor - Payload:", payload); // ✅ چک کردن داده ورودی

    const created = await createSensorService(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error("CREATE SENSOR ERROR:", err); // ✅ لاگ کامل خطا
    res.status(400).json({ error: 'Error creating sensor' });
  }
};

export const updateSensor = async (req: Request, res: Response) => {
  try {
    const updated = await updateSensorService(req.params.macAddress, req.body);
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: 'Sensor not found' });
  }
};

export const deleteSensor = async (req: Request, res: Response) => {
  try {
    await deleteSensorService(req.params.macAddress);
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: 'Sensor not found' });
  }
};
