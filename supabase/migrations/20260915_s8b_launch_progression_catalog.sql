-- WEB-FLARE S8B launch progression catalog activation.
-- Activates only the Owner-approved display-only launch offers.

do $$
begin
  if (select count(*) from public.progression_catalog_version) <> 0 then
    raise exception 'PROGRESSION_CATALOG_NOT_EMPTY';
  end if;
  if (select count(*) from public.progression_offer_catalog) <> 0 then
    raise exception 'PROGRESSION_OFFERS_NOT_EMPTY';
  end if;
  if (select count(*) from public.progression_purchase) <> 0 then
    raise exception 'PROGRESSION_PURCHASES_NOT_EMPTY';
  end if;
  if (select count(*) from public.runner_stat_upgrade_event) <> 0 then
    raise exception 'PROGRESSION_STAT_EVENTS_NOT_EMPTY';
  end if;
  if (
    select count(*)
    from public.runner_challengeability_envelope
    where calibration_version = 's8b-economy-calibration-001'
      and band = 'PREFERRED'
  ) <> 9 then
    raise exception 'PREFERRED_ENVELOPE_NOT_EXACT';
  end if;
  if exists (
    select 1
    from public.runner_challengeability_envelope
    where calibration_version = 's8b-economy-calibration-001'
      and band <> 'PREFERRED'
  ) then
    raise exception 'NON_PREFERRED_ENVELOPE_PRESENT';
  end if;
end;
$$;

insert into public.progression_catalog_version (
  catalog_version, calibration_version, status, activated_at
) values (
  's8b-launch-progression-001',
  's8b-economy-calibration-001',
  'ACTIVE',
  now()
);

insert into public.progression_offer_catalog (
  catalog_version, offer_id, kind, stat_key, stat_amount, item_id, gold_cost, active
) values
  ('s8b-launch-progression-001', 'endurance-i', 'STAT', 'hp',      5, null, 20, true),
  ('s8b-launch-progression-001', 'strike-i',    'STAT', 'attack',  1, null, 30, true),
  ('s8b-launch-progression-001', 'guard-i',     'STAT', 'defense', 1, null, 40, true);
