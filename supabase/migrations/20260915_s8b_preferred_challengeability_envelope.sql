-- Materialize only the launch-eligible PREFERRED states from the verified
-- s8b-economy-calibration-001 84-state matrix.
-- EDGE and OUTSIDE states are intentionally absent so progression purchase
-- remains fail-closed for them.

insert into public.runner_challengeability_envelope(
  calibration_version,
  effective_hp,
  effective_attack,
  effective_defense,
  band,
  worst_target_delta
) values
  ('s8b-economy-calibration-001',100,12,1,'PREFERRED',1.8),
  ('s8b-economy-calibration-001',100,12,2,'PREFERRED',6.5),
  ('s8b-economy-calibration-001',100,13,1,'PREFERRED',3.5),
  ('s8b-economy-calibration-001',105,12,1,'PREFERRED',0.7),
  ('s8b-economy-calibration-001',105,12,2,'PREFERRED',10.0),
  ('s8b-economy-calibration-001',105,13,1,'PREFERRED',7.1),
  ('s8b-economy-calibration-001',110,12,1,'PREFERRED',3.6),
  ('s8b-economy-calibration-001',115,12,1,'PREFERRED',7.0),
  ('s8b-economy-calibration-001',120,12,1,'PREFERRED',10.0)
on conflict (calibration_version,effective_hp,effective_attack,effective_defense)
do update set
  band=excluded.band,
  worst_target_delta=excluded.worst_target_delta;
