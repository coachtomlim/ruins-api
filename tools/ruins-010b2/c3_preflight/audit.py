#!/usr/bin/env python3
"""RUINS 010B2/C3: OFFLINE nonsecret policy evidence checker.

No Supabase, Google Drive, Cloud Shell, network, database or subprocess access.
Passing means only READY_FOR_SEPARATE_AUTHORIZATION_REVIEW: NEVER a live grant.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

PROJECT = "qpgwqmduqtqidmhbuclw"
SCOPE = "PRE_R2_SCOPED_SQL_LOGICAL_BASELINE_ONLY"
EXPECTED = {
    "auth": 27,
    "public": 38,
    "sl_sim": 9,
    "sl_sim_basic1_hosted_poc": 12,
    "sl_sim_basic1_postpilot": 12,
    "storage": 8,
    "supabase_migrations": 1,
}
OPERATORS = ("supabase_admin", "ruins_friend_trial", "sl_sim", "deployments")
KEYWORDS = ("password", "private_key", "secret_key", "credential", "access_token", "bearer", "recovery_code", "master_passphrase")
SCHEMA_FIELDS = {"schema_name", "table_count", "readable_count", "postgres_owned"}
CATALOG_FIELDS = {"project_ref", "project_status", "database_name", "server_version", "ruins_private_present", "ruins_owner_present", "schemas", "observed_at_utc", "source"}
PLAN_FIELDS = {"scope", "maintenance", "custody", "owner_c3_authorization"}
MAINTENANCE_FIELDS = {"start_utc", "end_utc", "admin_change_hold_agreed", "operator_acknowledgements", "no_autonomous_ddl_paths_unmanaged"}
CUSTODY_FIELDS = {"bitwarden_secure_note_attested", "offline_independent_copy_attested", "offline_recovery_challenge_pass", "public_recipient_sha256", "verified_at_utc"}


def exact_keys(node: object, fields: set[str], path: str) -> bool:
    return isinstance(node, dict) and set(node) == fields


def utc(value: object) -> dt.datetime | None:
    if not isinstance(value, str):
        return None
    try:
        result = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        return result.astimezone(dt.timezone.utc) if result.tzinfo is not None else None
    except ValueError:
        return None


def evaluate(catalog: object, plan: object, *, now: dt.datetime | None = None) -> dict:
    """Return sanitized blockers; never echo input or secrets."""
    fail: list[str] = []
    def require(ok: object, problem: str) -> None:
        if ok is not True:
            fail.append(problem)

    if not exact_keys(catalog, CATALOG_FIELDS, "catalog"):
        return verdict(["catalog_shape_not_allowlisted"])
    if not exact_keys(plan, PLAN_FIELDS, "plan"):
        return verdict(["plan_shape_not_allowlisted"])
    # Reject nonsecret receipts accidentally containing sensitive material.
    raw = json.dumps([catalog, plan], sort_keys=True, ensure_ascii=False).lower()
    if "age-secret-key-" in raw or any('"'+kw+'"' in raw for kw in KEYWORDS):
        return verdict(["possible_secret_in_policy_inputs"])

    require(catalog["project_ref"] == PROJECT, "project_identity_mismatch")
    require(catalog["project_status"] == "ACTIVE_HEALTHY", "project_not_healthy")
    require(catalog["database_name"] == "postgres", "database_identity_mismatch")
    require(catalog["server_version"] == "17.6", "server_version_not_pinned")
    require(catalog["source"] == "supabase_connector_read_only_catalog", "catalog_provenance_missing")
    require(catalog["ruins_private_present"] is False and catalog["ruins_owner_present"] is False, "post_r2_detected")
    observations = catalog["schemas"]
    valid_rows = isinstance(observations, list) and len(observations) == len(EXPECTED) and all(exact_keys(r, SCHEMA_FIELDS, "row") for r in observations)
    require(valid_rows, "schema_inventory_invalid")
    if valid_rows:
        seen: dict[str, dict] = {}
        for entry in observations:
            if not isinstance(entry["schema_name"], str) or entry["schema_name"] in seen:
                fail.append("schema_names_duplicate_or_invalid")
                break
            seen[entry["schema_name"]] = entry
        require(set(seen) == set(EXPECTED), "schema_set_mismatch")
        for name, count in EXPECTED.items():
            row = seen.get(name)
            if row is not None:
                require(type(row["table_count"]) is int and row["table_count"] == count, "schema_table_count_drift_"+name)
                require(type(row["readable_count"]) is int and row["readable_count"] == count, "schema_select_rights_drift_"+name)
                require(type(row["postgres_owned"]) is int and 0 <= row["postgres_owned"] <= count, "invalid_owner_count_"+name)

    now = now or dt.datetime.now(dt.timezone.utc)
    observed = utc(catalog["observed_at_utc"])
    require(observed is not None and dt.timedelta(0) <= now - observed <= dt.timedelta(hours=1), "catalog_refresh_required_before_review")

    require(plan["scope"] == SCOPE, "incorrect_recovery_scope")
    # Actual C3 authorization must NOT be stored inside a preflight plan.
    require(plan["owner_c3_authorization"] is False, "live_authorization_cannot_be_conferred_by_audit")
    m = plan["maintenance"]
    c = plan["custody"]
    if not exact_keys(m, MAINTENANCE_FIELDS, "maintenance"):
        fail.append("maintenance_shape_not_allowlisted")
    else:
        start, end = utc(m["start_utc"]), utc(m["end_utc"])
        require(start is not None and end is not None and dt.timedelta(0) < end-start <= dt.timedelta(minutes=30), "short_freeze_window_not_pinned") if start and end else fail.append("short_freeze_window_not_pinned")
        require(m["admin_change_hold_agreed"] is True, "administrative_hold_not_agreed")
        require(m["no_autonomous_ddl_paths_unmanaged"] is True, "automatic_schema_writer_unresolved")
        ack = m["operator_acknowledgements"]
        if not isinstance(ack, dict) or set(ack) != set(OPERATORS):
            fail.append("operator_ack_list_incomplete")
        else:
            for operator in OPERATORS:
                require(ack[operator] is True, "operator_ack_missing_" + operator)
    if not exact_keys(c, CUSTODY_FIELDS, "custody"):
        fail.append("custody_shape_not_allowlisted")
    else:
        require(c["bitwarden_secure_note_attested"] is True, "bitwarden_primary_unverified")
        require(c["offline_independent_copy_attested"] is True, "independent_offline_copy_unverified")
        require(c["offline_recovery_challenge_pass"] is True, "offline_recovery_test_not_passed")
        require(isinstance(c["public_recipient_sha256"], str) and bool(re.fullmatch('[0-9a-f]{64}', c["public_recipient_sha256"])), "public_recipient_fingerprint_missing")
        cust_time = utc(c["verified_at_utc"])
        require(cust_time is not None and cust_time <= now, "custody_attestation_date_missing")
    return verdict(fail)


def verdict(blockers: list[str]) -> dict:
    return {
        "kind": "RUINS_010B2_OFFLINE_PRE_C3_POLICY_ONLY",
        "status": "C3_PREFLIGHT_HOLD" if blockers else "READY_FOR_SEPARATE_AUTHORIZATION_REVIEW",
        "blockers": sorted(set(blockers)),
        "scope": SCOPE,
        "live_export_authorized": False,
        "011A_authorized": False,
        "network_accessed": False,
        "note": "Never an execution authorization or proof of a live backup."
    }


def main() -> int:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("catalog",type=Path)
    p.add_argument("plan",type=Path)
    ns=p.parse_args()
    try:
        result=evaluate(json.loads(ns.catalog.read_text(encoding="utf-8")),json.loads(ns.plan.read_text(encoding="utf-8")))
    except (OSError, ValueError, UnicodeError):
        result=verdict(["input_unreadable_or_not_json"])
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if result["status"] == "READY_FOR_SEPARATE_AUTHORIZATION_REVIEW" else 2


if __name__ == "__main__":
    sys.exit(main())
