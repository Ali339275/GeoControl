import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { GatewayDAO } from './GatewayDAO';

@Entity('sensor')
export class SensorDAO {
  @PrimaryColumn()
  macAddress: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  type: string;

  @ManyToOne(() => GatewayDAO, (gateway) => gateway.sensors, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gatewayId' })
  gateway: GatewayDAO;

  @Column()
  gatewayId: string;
}
