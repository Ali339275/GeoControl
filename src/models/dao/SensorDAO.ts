import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('sensor')
export class SensorDAO {
  @PrimaryColumn()
  macAddress: string;

  @Column({ nullable: false})
  name: string;

  @Column({ nullable: false }) 
  description: string; 

  @Column({ nullable: false }) 
  variable: string;

  @Column({ nullable: false }) 
  unit: string;

  @Column({ nullable: true }) 
  type: string;

  @Column()
  gatewayId: string; // stores gateway's macAddress
}