#!/bin/bash

# Script to generate preview images from newsletter PDFs
# Uses poppler's pdftoppm to convert first page to JPG

NEWSLETTERS_DIR="../public/newsletters"
QUALITY=85
SCALE=2

echo "Generating preview images for newsletters..."

# Check if pdftoppm is available
if ! command -v pdftoppm &> /dev/null; then
    echo "Error: pdftoppm not found. Please install poppler-utils."
    echo "On macOS: brew install poppler"
    exit 1
fi

# Check if newsletters directory exists
if [ ! -d "$NEWSLETTERS_DIR" ]; then
    echo "Error: Newsletters directory not found at $NEWSLETTERS_DIR"
    exit 1
fi

# Find all curated-*.pdf files and generate previews
cd "$NEWSLETTERS_DIR" || exit 1

for pdf in curated-*.pdf; do
    if [ -f "$pdf" ]; then
        # Extract issue number from filename (e.g., curated-001.pdf -> 001)
        issue_number=$(echo "$pdf" | sed -n 's/curated-\([0-9]*\)\.pdf/\1/p')
        
        if [ -z "$issue_number" ]; then
            echo "Skipping $pdf (could not extract issue number)"
            continue
        fi
        
        output_file="curated-${issue_number}-preview.jpg"
        
        echo "Processing $pdf -> $output_file"
        
        # Convert first page to JPG
        # -f 1 -l 1: only first page
        # -jpeg: output as JPEG
        # -scale-to-x and -scale-to-y: scale for better quality
        pdftoppm -f 1 -l 1 -jpeg -jpegopt quality=$QUALITY -scale-to-x 1200 -scale-to-y -1 "$pdf" "curated-${issue_number}-preview" 2>/dev/null
        
        # Rename the output file (pdftoppm creates curated-XXX-preview-1.jpg)
        if [ -f "curated-${issue_number}-preview-1.jpg" ]; then
            mv "curated-${issue_number}-preview-1.jpg" "$output_file"
            echo "  ✓ Created $output_file"
        else
            echo "  ✗ Failed to create preview for $pdf"
        fi
    fi
done

echo ""
echo "Done! Preview images generated in $NEWSLETTERS_DIR"

