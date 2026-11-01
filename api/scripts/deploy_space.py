"""Deploy the API to its Hugging Face Space, creating the Space if it is missing.

The Space mirrors the monorepo layout (api/, shared/) with the Dockerfile and
the Space card at its root, so the Dockerfile builds unchanged in both places.

Usage: HF_TOKEN=... uv run python scripts/deploy_space.py <owner>/<space>
"""

import argparse
import os
import shutil
import sys
import tempfile
from pathlib import Path

from huggingface_hub import HfApi

ROOT = Path(__file__).resolve().parents[2]
EXCLUDED = shutil.ignore_patterns(
    ".env", ".venv", "node_modules", "__pycache__", ".*_cache", "*.pyc"
)


def stage(target: Path) -> None:
    shutil.copytree(ROOT / "api", target / "api", ignore=EXCLUDED)
    shutil.copytree(ROOT / "shared", target / "shared", ignore=EXCLUDED)
    shutil.copy2(ROOT / "api" / "Dockerfile", target / "Dockerfile")
    shutil.copy2(ROOT / "api" / "space" / "README.md", target / "README.md")


def main() -> None:
    parser = argparse.ArgumentParser(description="Deploy the API to a Hugging Face Space.")
    parser.add_argument("space_id", help="Space repository id, for example BilalSeh/roomcraft-api")
    args = parser.parse_args()

    token = os.environ.get("HF_TOKEN")
    if not token:
        sys.exit("HF_TOKEN is not set.")

    hf = HfApi(token=token)
    hf.create_repo(args.space_id, repo_type="space", space_sdk="docker", exist_ok=True)

    revision = os.environ.get("GITHUB_SHA", "local")[:7]
    with tempfile.TemporaryDirectory() as tmp:
        stage(Path(tmp))
        commit = hf.upload_folder(
            repo_id=args.space_id,
            repo_type="space",
            folder_path=tmp,
            commit_message=f"Deploy {revision}",
            delete_patterns=["api/**", "shared/**"],
        )
    print(f"Deployed {revision} to {commit.commit_url}")


if __name__ == "__main__":
    main()
