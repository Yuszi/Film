/**
 * Das Modul besteht aus den Klassen für die Fehlerbehandlung bei der Verwaltung
 * von Büchern, z.B. beim DB-Zugriff.
 * @packageDocumentation
 */

/**
 * Klasse für eine bereits existierende ISBN-Nummer.
 */
export interface NameExists {
    readonly type: 'NameExists';
    readonly name: string | null | undefined;
    readonly id?: number;
}

/**
 * ggf. Union-Type für diverse Fehler beim Neuanlegen eines Films:
 * - {@linkcode NameExists}
 */
export type CreateError = NameExists;

/**
 * Klasse für eine ungültige Versionsnummer beim Ändern.
 */
export interface VersionInvalid {
    readonly type: 'VersionInvalid';
    readonly version: string | undefined;
}

/**
 * Klasse für eine veraltete Versionsnummer beim Ändern.
 */
export interface VersionOutdated {
    readonly type: 'VersionOutdated';
    readonly id: number;
    readonly version: number;
}

/**
 * Klasse für ein nicht-vorhandenen Film beim Ändern.
 */
export interface FilmNotExists {
    readonly type: 'FilmNotExists';
    readonly id: number | undefined;
}

/**
 * Union-Type für Fehler beim Ändern eines Films:
 * - {@linkcode FilmNotExists}
 * - {@linkcode ConstraintViolations}
 * - {@linkcode VersionInvalid}
 * - {@linkcode VersionOutdated}
 */
export type UpdateError = FilmNotExists | VersionInvalid | VersionOutdated;
