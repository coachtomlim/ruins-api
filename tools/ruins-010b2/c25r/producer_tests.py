#!/usr/bin/env python3
"""Real subprocess faults plus idempotent protocol tests, synthetic bytes only."""
import subprocess as sp,json,sys,time
from runner import IMAGE,run
from protocol import require,Rejected
checks=[]
for label,b in [('empty',b''),('partial_header',b'PGDMP\x01\x10'),('not_an_archive',b'FAKE_ONLY_TRUNCATED_DUMP')]:
 p=run(['docker','run','--rm','--network','none','--read-only',IMAGE,'pg_restore','--list'],b,ok=False)
 require(p.returncode!=0,'invalid archive accepted');checks.append(label)
p=sp.run(['bash','-o','pipefail','-c',"(printf 'FAKE_ONLY_INCOMPLETE'; exit 71) | gzip -n -c | cat >/dev/null"],capture_output=True)
require(p.returncode==71,'producer failure hidden');checks.append('pipefail_producer_rc71')
p=sp.Popen([sys.executable,'-c','import time;time.sleep(30)'],stdout=sp.PIPE,stderr=sp.PIPE);p.terminate();p.communicate(timeout=5)
require(p.returncode!=0,'aborted producer accepted');checks.append('actual_terminated_producer')
try:run([sys.executable,'-c','import time;time.sleep(30)'],timeout=.05)
except Rejected:checks.append('actual_timeout_rejected')
else:raise RuntimeError('timeout accepted')
# No raw producer stdout/stderr belongs in a public event or transition receipt.
marker='FAKE_ONLY_SECRET_CANARY_NOT_FOR_RECEIPTS'
p=sp.run([sys.executable,'-c',"import sys; print('"+marker+"'); print('"+marker+"',file=sys.stderr); sys.exit(71)"],capture_output=True)
event={'stage':'producer','rc':p.returncode,'status':'REJECTED','details':'REDACTED'}
require(marker not in json.dumps(event),'redaction failure');checks.append('receipt_stdout_stderr_redaction')
print(json.dumps({'status':'C25R_PRODUCER_FAULT_PASS','checks':checks,'count':len(checks)},sort_keys=True))
