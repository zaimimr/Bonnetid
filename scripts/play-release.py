#!/usr/bin/env python3
"""Publish several app bundles as one Google Play release.

Play serves phones and Android Automotive OS from the same track, so a release
that carries only one of the two bundles drops the other form factor. eas submit
uploads a single build per release, so multi-bundle releases go through here.

    python3 scripts/play-release.py \
        --key ~/play-service-account.json \
        --track production \
        --name 1.4.0 \
        --notes "Bønnetider i bilen." \
        build-a.aab build-b.aab
"""

import argparse
import json
import pathlib
import sys

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

PACKAGE = "no.irn.bonnetid"
BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications"
UPLOAD = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications"
SCOPE = "https://www.googleapis.com/auth/androidpublisher"


def authorize(key_path):
    credentials = service_account.Credentials.from_service_account_file(
        str(key_path), scopes=[SCOPE]
    )
    credentials.refresh(Request())
    return {"Authorization": f"Bearer {credentials.token}"}


def check(response, what):
    if response.status_code >= 400:
        sys.exit(f"{what} failed ({response.status_code}): {response.text}")
    return response.json() if response.content else {}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("bundles", nargs="+", type=pathlib.Path)
    parser.add_argument("--key", required=True, type=pathlib.Path)
    parser.add_argument("--track", default="production")
    parser.add_argument("--name", required=True)
    parser.add_argument("--notes", default="")
    parser.add_argument("--language", default="no-NO")
    parser.add_argument("--status", default="completed", choices=["completed", "draft"])
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    for bundle in args.bundles:
        if not bundle.is_file():
            sys.exit(f"No such bundle: {bundle}")

    headers = authorize(args.key)
    edit = check(
        requests.post(f"{BASE}/{PACKAGE}/edits", headers=headers, timeout=120),
        "Creating an edit",
    )
    edit_id = edit["id"]
    print(f"edit {edit_id}")

    version_codes = []
    for bundle in args.bundles:
        with bundle.open("rb") as handle:
            uploaded = check(
                requests.post(
                    f"{UPLOAD}/{PACKAGE}/edits/{edit_id}/bundles?uploadType=media",
                    headers={**headers, "Content-Type": "application/octet-stream"},
                    data=handle,
                    timeout=1800,
                ),
                f"Uploading {bundle.name}",
            )
        version_codes.append(uploaded["versionCode"])
        print(f"uploaded {bundle.name} as versionCode {uploaded['versionCode']}")

    release = {
        "name": args.name,
        "status": args.status,
        "versionCodes": [str(code) for code in version_codes],
    }
    if args.notes:
        release["releaseNotes"] = [{"language": args.language, "text": args.notes}]

    check(
        requests.put(
            f"{BASE}/{PACKAGE}/edits/{edit_id}/tracks/{args.track}",
            headers={**headers, "Content-Type": "application/json"},
            data=json.dumps({"track": args.track, "releases": [release]}),
            timeout=120,
        ),
        f"Assigning the {args.track} track",
    )
    print(f"track {args.track} -> {version_codes}")

    if not args.commit:
        print("Dry run. Nothing was sent for review; re-run with --commit to publish.")
        requests.delete(f"{BASE}/{PACKAGE}/edits/{edit_id}", headers=headers, timeout=120)
        return

    check(
        requests.post(
            f"{BASE}/{PACKAGE}/edits/{edit_id}:commit", headers=headers, timeout=300
        ),
        "Committing the edit",
    )
    print("committed")


if __name__ == "__main__":
    main()
