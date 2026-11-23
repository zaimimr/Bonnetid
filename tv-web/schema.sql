create table if not exists tv_screens (
  id text primary key,
  hash text not null,
  config text,
  source text,
  updated integer not null default 0
);
