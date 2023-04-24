/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
    VersionColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Hauptdarsteller } from './hauptdarsteller.entity';

/**
 * Gültige Strings für die Art des Films.
 */
export type FilmArt = 'ACTION' | 'DRAMA' | 'ROMANCE';

/**
 * Die Entity-Klasse zu einem relationalen Tabelle
 */

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

    @OneToOne(
        () => Hauptdarsteller,
        (hauptdarsteller: { film: any; }) => hauptdarsteller.film,
        {
            cascade: ['insert', 'remove'],
        },
    )
    readonly hauptdarsteller: Hauptdarsteller | undefined;

    readonly erzeugt: Date | undefined;

    readonly aktualisiert: Date | undefined;
}
