import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("sensors")
export class Sensor {
  @PrimaryColumn()
  macAddress: string;

  @Column()
  name: string;

  @Column()
  variable: string;

  @Column()
  unit: string;

  @Column()
  gatewayMacAddress: string;
}
