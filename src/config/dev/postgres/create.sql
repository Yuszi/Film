CREATE SCHEMA IF NOT EXISTS AUTHORIZATION film;

ALTER ROLE film SET search_path = 'film';

DROP TYPE IF EXISTS filmart;
CREATE TYPE filmart AS ENUM ('ACTION', 'DRAMA', 'ROMANCE');

CREATE TABLE IF NOT EXISTS film (
    id                  integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE filmspace,
    version             integer NOT NULL DEFAULT 0,
    name                varchar(128) NOT NULL UNIQUE USING INDEX TABLESPACE filmspace,
    sprache             char(5),
    genre               filmart,
    rating              integer NOT NULL DEFAULT 0,
    erscheinungsjahr    date,
    schlagwoerter       varchar(64),
    erzeugt             timestamp NOT NULL DEFAULT NOW(),
    aktualisiert        timestamp NOT NULL DEFAULT NOW()
) TABLESPACE filmspace;


CREATE TABLE IF NOT EXISTS hauptdarsteller (
    id          integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE filmspace,
    rolle       varchar(40) NOT NULL,
    vorname     varchar(40),
    nachname    varchar(40),
    alter       integer NOT NULL DEFAULT 0,
    film_id     integer NOT NULL REFERENCES film(id)
) TABLESPACE filmspace;
