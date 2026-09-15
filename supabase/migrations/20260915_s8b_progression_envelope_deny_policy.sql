-- Explicit deny policy for the server-only challengeability envelope.
-- Client roles retain no table privileges; this policy exists to make the RLS intent explicit.

drop policy if exists progression_envelope_deny_client on public.runner_challengeability_envelope;
create policy progression_envelope_deny_client
on public.runner_challengeability_envelope
for select
to authenticated
using (false);
