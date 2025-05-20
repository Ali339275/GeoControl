// src/models/dao/MeasurementDAO.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MeasurementsDAO } from './MeasurementsDAO';
import {SensorDAO} from '@dao/SensorDAO'

@Entity('measurement')
export class MeasurementDAO {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    type: 'text',
    transformer: {
      to: (value: Date) => value.toISOString(),
      from: (value: string) => new Date(value),
    },
  })
  createdAt: Date;

  @Column('float')
  value: number;

<<<<<<< HEAD
  @Column('boolean', { default: false })
  isOutlier: boolean;
  @ManyToOne(() => MeasurementsDAO, (grp) => grp.measurements, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sensorMacAddress', referencedColumnName: 'sensorMacAddress' })
  measurements: MeasurementsDAO;
}
=======
    @Column()
    isOutlier?: boolean;

    @ManyToOne(() => MeasurementsDAO, (m) => m.measurements,{
        nullable: false
    })
    @JoinColumn({ name: 'MeasurementId', referencedColumnName: 'sensorMacAddress' })
    measurements: MeasurementsDAO;
    

}
>>>>>>> a7ebddb (updating measurements)
