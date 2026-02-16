#!/bin/bash
set -euo pipefail

VERSION=$(node -e "console.log(require('./package.json').version)")
OUTDIR="dist/binaries"
mkdir -p "$OUTDIR"

echo "Building glint v${VERSION} binaries..."

TARGETS=(
  "bun-linux-x64"
  "bun-linux-arm64"
  "bun-darwin-x64"
  "bun-darwin-arm64"
)

for target in "${TARGETS[@]}"; do
  platform="${target#bun-}"  # strip "bun-" prefix
  outfile="$OUTDIR/glint-${platform}"
  echo "  Building ${platform}..."
  bun build src/cli.ts --compile --target "$target" --outfile "$outfile" 2>&1
  echo "  ✓ ${outfile} ($(du -h "$outfile" | cut -f1))"
done

echo ""
echo "Done! Binaries in ${OUTDIR}/"
ls -lh "$OUTDIR"/
