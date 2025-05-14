import { SensorRepository } from '@repositories/SensorRepository';
import { SensorDAO } from '@models/dao/SensorDAO';

const sensorRepo = new SensorRepository();

export async function getAllSensorsService(): Promise<SensorDAO[]> {
  return await sensorRepo.findAll();
}

export async function getSensorService(macAddress: string): Promise<SensorDAO> {
  const sensor = await sensorRepo.findByMac(macAddress);
  if (!sensor) {
    throw new Error('Sensor not found');
  }
  return sensor;
}

export async function createSensorService(sensorData: Omit<SensorDAO, 'gatewayId'> & { gatewayMac: string }): Promise<SensorDAO> {
  const sensor: SensorDAO = {
    ...sensorData,
    gatewayId: sensorData.gatewayMac 
  };
  delete (sensor as any).gatewayMac;

  return await sensorRepo.create(sensor);
}

export async function updateSensorService(macAddress: string, updateData: Partial<SensorDAO>): Promise<SensorDAO> {
  const updated = await sensorRepo.update(macAddress, updateData);
  if (!updated) {
    throw new Error('Sensor not found');
  }
  return updated;
}

export async function deleteSensorService(macAddress: string): Promise<void> {
  const success = await sensorRepo.delete(macAddress);
  if (!success) {
    throw new Error('Sensor not found');
  }
}
