import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { GatewayDAO } from './GatewayDAO';
import { MeasurementsDAO } from './MeasurementsDAO';

@Entity('sensor')
export class SensorDAO {
  [x: string]: any;
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

  @OneToMany(() => MeasurementsDAO, (grp) => grp.sensor)
  measurementsGroup: MeasurementsDAO[];

}
