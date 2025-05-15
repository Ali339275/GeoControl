import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GatewayDAO } from './GatewayDAO';

@Entity('sensor')
export class SensorDAO {
  @PrimaryColumn()
  macAddress: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  variable: string;

  @Column()
  unit: string;

  // store the gateway's macAddress as a foreign key
  @Column()
  gatewayId: string;

  // set up the relation for proper JOINs
  @ManyToOne(() => GatewayDAO, (gateway) => gateway.sensors, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gatewayId', referencedColumnName: 'macAddress' })
  gateway: GatewayDAO;
}
