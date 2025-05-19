import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
  } from 'typeorm';

import { MeasurementsDAO } from './MeasurementsDAO';

@Entity('measurement')
export class MeasurementDAO{
    @Column()
    createdAt: Date;

    @Column()
    value: number;

    @Column()
    isOutlier?: boolean;

    @ManyToOne(() => MeasurementsDAO, (measurements) => measurements.measurements,{
        nullable: false
    })
    @JoinColumn({ name: 'MeasurementId', referencedColumnName: 'sensorMacAddress' })
    measurements: MeasurementsDAO;
    

}