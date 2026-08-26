#!/usr/bin/env bash
#
# Put the latest released extension where the browser can load it.
#
# A browser loading an extension unpacked never auto-updates: it reads the
# folder once at startup and never checks again. There is no store account and
# no policy file involved here, so updating is *this* — fetch the release,
# replace the folder, and tell the browser to look again.
#
#   ./scripts/install-unpacked.sh                 # latest release
#   ./scripts/install-unpacked.sh v0.3.3          # a specific tag
#   ./scripts/install-unpacked.sh latest ~/where  # somewhere else
#
set -euo pipefail

REPO="rueckblick/rueckblick-extension-chrome"
TAG="${1:-latest}"
TARGET="${2:-$HOME/rueckblick-extension}"

need() { command -v "$1" >/dev/null || { echo "need $1" >&2; exit 1; }; }
need curl
need unzip

api="https://api.github.com/repos/$REPO/releases/latest"
[ "$TAG" = "latest" ] || api="https://api.github.com/repos/$REPO/releases/tags/$TAG"

echo "looking up $TAG…"
# The asset name carries the version, so it is read rather than assumed: a
# guessed filename breaks silently the first time the naming changes.
url=$(curl -fsSL "$api" | grep -o '"browser_download_url": *"[^"]*rueckblick-chrome-[^"]*\.zip"' |
  head -1 | cut -d'"' -f4)
[ -n "$url" ] || { echo "no chrome zip on that release" >&2; exit 1; }

zip_name="${url##*/}"
echo "downloading $zip_name"

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
curl -fsSL "$url" -o "$work/ext.zip"
unzip -q "$work/ext.zip" -d "$work/unpacked"

# Proof it is an extension before anything is replaced. Half-swapping a live
# folder for a bad download would leave the browser with nothing to load.
[ -f "$work/unpacked/manifest.json" ] || { echo "no manifest.json in the zip" >&2; exit 1; }
version=$(grep -o '"version"[^,]*' "$work/unpacked/manifest.json" | head -1 | cut -d'"' -f4)

# Swapped rather than unpacked over the top: the browser may have this folder
# open right now, and a half-written extension is worse than an old one. The
# old copy is moved aside first so the window where nothing exists is a rename.
if [ -e "$TARGET" ]; then
  old="$TARGET.previous"
  rm -rf "$old"
  mv "$TARGET" "$old"
fi
mkdir -p "$(dirname "$TARGET")"
mv "$work/unpacked" "$TARGET"

echo
echo "Rueckblick $version is now in $TARGET"
echo
echo "The browser will not notice on its own. Either:"
echo "  - open brave://extensions (or chrome://extensions) and press Reload, in every profile, or"
echo "  - restart the browser, which reloads unpacked extensions anyway."
echo
echo "Then check Settings -> Browser extension in Rueckblick: each paired"
echo "browser shows the version it is running."
