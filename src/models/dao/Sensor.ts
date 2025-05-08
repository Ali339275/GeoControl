import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
  } from "typeorm";
  import { Gateway } from "./GatewayDAO";

  
  @Entity("sensors")
  export class Sensor {
    @PrimaryColumn()
    macAddress: string;
  
    @Column()
    name: string;
  
    @Column({ nullable: true })
    description: string;
  
    @Column()
    variable: string;
  
    @Column()
    unit: string;
  
    @ManyToOne(() => Gateway, { onDelete: "CASCADE" })
    @JoinColumn({ name: "gatewayMacAddress" })
    gateway: Gateway;
  
    @Column()
    gatewayMacAddress: string;
  }
  