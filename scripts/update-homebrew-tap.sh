#!/usr/bin/env bash

set -euo pipefail

CLAWWORK_REPO="${CLAWWORK_REPO:-clawwork-ai/ClawWork}"
TAP_DIR="${TAP_DIR:-homebrew-clawwork}"
RELEASE_TAG="${RELEASE_TAG:-${GITHUB_REF_NAME:-}}"

if [[ -z "${RELEASE_TAG}" ]]; then
  echo "RELEASE_TAG is required" >&2
  exit 1
fi

if [[ ! "${RELEASE_TAG}" =~ ^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-((alpha|beta|rc)\.[1-9][0-9]*))?$ ]]; then
  echo "Invalid SemVer release tag: ${RELEASE_TAG}" >&2
  exit 1
fi

if [[ "${RELEASE_TAG}" == *-* ]]; then
  echo "Skipping stable Homebrew cask update for prerelease tag: ${RELEASE_TAG}"
  exit 0
fi

CASK_FILE="${TAP_DIR}/Casks/clawwork.rb"
if [[ ! -f "${CASK_FILE}" ]]; then
  echo "Cask file not found: ${CASK_FILE}" >&2
  exit 1
fi

version="${RELEASE_TAG#v}"

CLEANUP_DIRS=()
cleanup() {
  for dir in "${CLEANUP_DIRS[@]+"${CLEANUP_DIRS[@]}"}"; do
    rm -rf "${dir}"
  done
}
trap cleanup EXIT

fetch_sha256() {
  local arch="$1"
  local asset_json
  asset_json="$(gh release view "${RELEASE_TAG}" -R "${CLAWWORK_REPO}" --json assets --jq ".assets[] | select(.name | endswith(\"-mac-${arch}.dmg\"))" | head -n 1)"

  if [[ -z "${asset_json}" ]]; then
    echo "No macOS ${arch} DMG asset found for ${RELEASE_TAG}" >&2
    exit 1
  fi

  local asset_name asset_digest sha256
  asset_name="$(jq -r '.name' <<<"${asset_json}")"
  asset_digest="$(jq -r '.digest // empty' <<<"${asset_json}")"
  sha256="${asset_digest#sha256:}"

  if [[ -z "${sha256}" ]]; then
    local tmp_dir
    tmp_dir="$(mktemp -d)"
    CLEANUP_DIRS+=("${tmp_dir}")
    gh release download "${RELEASE_TAG}" -R "${CLAWWORK_REPO}" --pattern "${asset_name}" --dir "${tmp_dir}"
    sha256="$(shasum -a 256 "${tmp_dir}/${asset_name}" | awk '{print $1}')"
  fi

  if [[ ! "${sha256}" =~ ^[0-9a-f]{64}$ ]]; then
    echo "Invalid sha256 digest for ${arch}: ${sha256}" >&2
    exit 1
  fi

  echo "${sha256}"
}

sha256_arm64="$(fetch_sha256 arm64)"
sha256_x64="$(fetch_sha256 x64)"

node -e '
const fs = require("node:fs");
const [caskPath, nextVersion, shaArm64, shaX64, repoSlug] = process.argv.slice(1);
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(nextVersion)) {
  throw new Error(`Invalid stable Homebrew cask version: ${nextVersion}`);
}
if (!/^[0-9a-f]{64}$/.test(shaArm64) || !/^[0-9a-f]{64}$/.test(shaX64)) {
  throw new Error("Invalid sha256 digest");
}
const current = fs.readFileSync(caskPath, "utf8");
let versionUpdated = false;
let updated = current.replace(/^([ \t]*version[ \t]+)(["\x27])([^"\x27]+)\2([ \t]*)$/m, (_, prefix, quote, __, suffix) => {
  versionUpdated = true;
  return `${prefix}${quote}${nextVersion}${quote}${suffix}`;
});
if (!versionUpdated) {
  throw new Error("Could not locate cask version stanza in Casks/clawwork.rb");
}
let armUpdated = false;
let intelUpdated = false;
const shaStanzaRe = /^([ \t]*sha256\b[^\n]*(?:\n[ \t]+(?:arm|intel):[^\n]*)*)/m;
if (!shaStanzaRe.test(updated)) {
  throw new Error("Could not locate sha256 stanza in Casks/clawwork.rb");
}
updated = updated.replace(shaStanzaRe, (stanza) => {
  let nextStanza = stanza.replace(/(\barm:[ \t]*)(["\x27])[0-9a-fA-F]{64}\2/, (_, prefix, quote) => {
    armUpdated = true;
    return `${prefix}${quote}${shaArm64}${quote}`;
  });
  nextStanza = nextStanza.replace(/(\bintel:[ \t]*)(["\x27])[0-9a-fA-F]{64}\2/, (_, prefix, quote) => {
    intelUpdated = true;
    return `${prefix}${quote}${shaX64}${quote}`;
  });
  return nextStanza;
});
if (!armUpdated || !intelUpdated) {
  throw new Error("Could not update both arm and intel sha256 entries in Casks/clawwork.rb");
}
updated = updated.replace(/(https:\/\/github\.com\/)clawwork-ai\/clawwork(?=["\x27/])/g, `$1${repoSlug}`);
fs.writeFileSync(caskPath, updated, "utf8");
' "${CASK_FILE}" "${version}" "${sha256_arm64}" "${sha256_x64}" "${CLAWWORK_REPO}"
