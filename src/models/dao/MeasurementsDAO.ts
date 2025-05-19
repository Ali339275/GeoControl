import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';

import type { Stats } from '@dto/Stats';

import { MeasurementDAO } from './MeasurementDAO';

@Entity('measurements')
export class MeasurementsDAO{

    @PrimaryColumn()
    sensorMacAddress: string;

    @Column('simple-json', { nullable: true })
    stats?: Stats;

    @OneToMany(() => MeasurementDAO, (measurement) => measurement.measurements,{
        cascade: true,
        eager: true,
    })
    measurements: MeasurementDAO[]

}