import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Film } from './film.entity.js';

@Entity()
export class Hauptdarsteller {
    @Column('int')
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar', { unique: true, length: 30 })
    readonly rolle!: string | undefined;

    @Column('varchar', { length: 16 })
    readonly vorname: string | undefined;

    @Column('varchar', { length: 16 })
    readonly nachname: string | undefined;

    @Column('int')
    readonly alter: number | undefined;

    @OneToOne(() => Film, (film) => film.hauptdarsteller)
    @JoinColumn({ name: 'film_id' })
    film: Film | undefined;
}
