#!/bin/bash
# Patch gif-encoder-2 implicit globals for bun compile compatibility
LZWFILE="node_modules/gif-encoder-2/src/LZWEncoder.js"
if [ -f "$LZWFILE" ] && ! grep -q "var remaining" "$LZWFILE"; then
  sed -i '/var maxcode$/a\  var remaining = 0\n  var curPixel = 0\n  var clear_flg, n_bits, g_init_bits, ClearCode, EOFCode, ent, hshift, hsize_reg, fcode, i, c, disp' "$LZWFILE"
  echo "Patched gif-encoder-2 for bun compile compatibility"
fi
