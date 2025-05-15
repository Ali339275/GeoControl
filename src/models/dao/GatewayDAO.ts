import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { SensorDAO } from "./SensorDAO";

@Entity("gatways")
export class GatewayDAO{

    @PrimaryColumn({nullable: false})
    macAddress: string

    @Column({nullable: false})
    name: string

    @Column({nullable: false})
    description: string

    @ManyToOne(() => NetworkDAO, (network) => network.gateways, {
        nullable: false,
    })
    network: NetworkDAO;

    @OneToMany(() => SensorDAO, (sensor) => sensor.gateway)
    sensors: SensorDAO[];


}

export class Gateway {
    macAddress: string;
    name: string;
    description: string;
    sensors?: any[];
  }
  