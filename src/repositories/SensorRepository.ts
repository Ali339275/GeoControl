import { AppDataSource } from "@database";
import { Sensor } from "@dao/Sensor";

export const SensorRepository = AppDataSource.getRepository(Sensor);
