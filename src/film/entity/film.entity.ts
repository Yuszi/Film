/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { Abbildung } from './abbildung.entity.js';
import { ApiProperty } from '@nestjs/swagger';
import { DecimalTransformer } from './decimal-transformer.js';
import { Schauspieler } from './schauspieler.entity.js';
import { dbType } from '../../config/dbtype.js';

/**
 * Alias-Typ für gültige Strings bei der Art eines Buches.
 */
export type FilmArt = 'ACTION' | 'DRAMA' | 'ROMANCE';

/**
 * Entity-Klasse zu einem relationalen Tabelle
 */
// https://typeorm.io/entities
@Entity()
export class Film {
    @Column('int')
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar', { unique: true, length: 32 })
    @ApiProperty({ example: 'Good Doctor', type: String })
    readonly name!: string | undefined;

    @Column('varchar', { length: 32 })
    @ApiProperty({ example: 'deutsch', type: String })
    readonly sprache: string | undefined;

    @Column('varchar', { length: 10 })
    @ApiProperty({ example: 'ACTION', type: String })
    readonly genre: FilmArt | undefined;

    @Column('int')
    @ApiProperty({ example: 3, type: Number })
    readonly rating: number | undefined;

    @Column('date')
    @ApiProperty({ example: '2003-01-11 ' })
    readonly erscheinungsjahr: Date | string | undefined;

    @Column('simple-array')
    readonly schlagwoerter: string[] | undefined;

    @OneToOne(() => Schauspieler, (hauptdarsteller) => hauptdarsteller.film, {
        cascade: ['insert', 'remove'],
    })
    readonly hauptdarsteller: Schauspieler | undefined;

    readonly erzeugt: Date | undefined;

    readonly aktualisiert: Date | undefined;
}
