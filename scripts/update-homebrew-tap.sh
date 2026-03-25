#!/usr/bin/env bash

set -euo pipefail

CLAWWORK_REPO="${CLAWWORK_REPO:-clawwork-ai/clawwork}"
TAP_DIR="${TAP_DIR:-homebrew-clawwork}"
RELEASE_TAG="${RELEASE_TAG:-${GITHUB_REF_NAME:-}}"

if [[ -z "${RELEASE_TAG}" ]]; then
  echo "RELEASE_TAG is required" >&2
  exit 1
fi

version="${RELEASE_TAG#v}"

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
    trap 'rm -rf "${tmp_dir}"' EXIT
    gh release download "${RELEASE_TAG}" -R "${CLAWWORK_REPO}" --pattern "${asset_name}" --dir "${tmp_dir}"
    sha256="$(shasum -a 256 "${tmp_dir}/${asset_name}" | awk '{print $1}')"
  fi

  echo "${sha256}"
}

sha256_arm64="$(fetch_sha256 arm64)"
sha256_x64="$(fetch_sha256 x64)"

mkdir -p "${TAP_DIR}/Casks"

cat > "${TAP_DIR}/Casks/clawwork.rb" <<EOF
cask "clawwork" do
  arch arm: "arm64", intel: "x64"

  version "${version}"
  sha256 arm:   "${sha256_arm64}",
         intel: "${sha256_x64}"

  url "https://github.com/${CLAWWORK_REPO}/releases/download/v#{version}/ClawWork-#{version}-mac-#{arch}.dmg"
  name "ClawWork"
  desc "Desktop client for OpenClaw"
  homepage "https://github.com/${CLAWWORK_REPO}"

  app "ClawWork.app"

  postflight do
    system_command "xattr", args: ["-cr", "#{appdir}/ClawWork.app"]
  end
end
EOF
