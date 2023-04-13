/*eslint-disable @typescript-eslint/no-magic-numbers*/
import { ApiProperty } from '@nestjs/swagger';
import { Min } from 'class-validator';

/**
 * DTOs für Schauspieler.
 */
export class SchauspielerDTO {
    @ApiProperty({ example: 'Chuck Noland', type: String })
    readonly rolle: string | undefined;

    @ApiProperty({ example: 'Tom', type: String })
    readonly vorname: string | undefined;

    @ApiProperty({ example: 'Hanks', type: String })
    readonly nachname: string | undefined;

    @Min(10)
    @ApiProperty({ example: 19, type: Number })
    readonly alter: number | undefined;
}
/*eslint-enable @typescript-eslint/no-magic-numbers*/
