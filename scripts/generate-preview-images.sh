#!/usr/bin/env bash

# Script to generate preview images from newsletter PDFs
# Uses poppler's pdftoppm to convert first page to JPG

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
NEWSLETTERS_DIR="$PROJECT_DIR/public/newsletters"
QUALITY=85

printf "Generating preview images for newsletters...\n"

# Check if pdftoppm is available
if ! command -v pdftoppm >/dev/null 2>&1; then
    printf "Error: pdftoppm not found. Install Poppler first.\n"
    printf "On macOS: brew install poppler\n"
    exit 1
fi

# Check if newsletters directory exists
if [ ! -d "$NEWSLETTERS_DIR" ]; then
    printf "Error: newsletters directory not found at %s\n" "$NEWSLETTERS_DIR"
    exit 1
fi

shopt -s nullglob
pdfs=("$NEWSLETTERS_DIR"/curated-*.pdf)

if [ "${#pdfs[@]}" -eq 0 ]; then
    printf "No curated-*.pdf files found in %s\n" "$NEWSLETTERS_DIR"
    exit 0
fi

for pdf_path in "${pdfs[@]}"; do
    pdf_name="$(basename "$pdf_path")"
    issue_number="$(printf "%s" "$pdf_name" | sed -n 's/curated-\([0-9][0-9]*\)\.pdf/\1/p')"

    if [ -z "$issue_number" ]; then
        printf "Skipping %s (could not extract issue number)\n" "$pdf_name"
        continue
    fi

    output_prefix="$NEWSLETTERS_DIR/curated-${issue_number}-preview"
    output_file="${output_prefix}.jpg"
    printf "Processing %s -> %s\n" "$pdf_name" "$(basename "$output_file")"

    pdftoppm \
        -f 1 \
        -l 1 \
        -singlefile \
        -jpeg \
        -jpegopt "quality=$QUALITY" \
        -scale-to-x 1200 \
        -scale-to-y -1 \
        "$pdf_path" \
        "$output_prefix"

    if [ -f "$output_file" ]; then
        printf "  Created %s\n" "$(basename "$output_file")"
    else
        printf "  Failed to create preview for %s\n" "$pdf_name"
        exit 1
    fi
done

printf "\nDone. Preview images generated in %s\n" "$NEWSLETTERS_DIR"
