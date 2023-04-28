CREATE SCHEMA IF NOT EXISTS AUTHORIZATION film;

ALTER ROLE film SET search_path = 'film';

DROP TYPE IF EXISTS filmart;
CREATE TYPE filmart AS ENUM ('DRUCKAUSGABE', 'KINDLE');

CREATE TABLE IF NOT EXISTS hauptdarsteller (
    id          integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE filmspace,
    rolle       varchar(40) NOT NULL,
    vorname     varchar(40),
    nachname    varchar(40),
    alter       integer NOT NULL DEFAULT 0
) TABLESPACE filmspace;

CREATE TABLE IF NOT EXISTS film (
    id                  integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE filmspace,
    version             integer NOT NULL DEFAULT 0,
    name                varchar(17) NOT NULL UNIQUE USING INDEX TABLESPACE filmspace,
    sprache             varchar(40),
    genre               filmart,
    rating              integer NOT NULL DEFAULT 0,
    lieferbar           boolean NOT NULL DEFAULT FALSE,
    erscheinungsjahr    date,
    schlagwoerter       varchar(64),
    hauptdarsteller_id  integer NOT NULL REFERENCES hauptdarsteller(id),
    erzeugt             timestamp NOT NULL DEFAULT NOW(),
    aktualisiert        timestamp NOT NULL DEFAULT NOW()
) TABLESPACE filmspace;
