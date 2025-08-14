#!/bin/bash

# --- Configuration ---
FILE_PATH="../src/pages/index.astro"
NEW_STATUS="online"
COMMIT_MESSAGE="Update Status"

# --- Script Logic ---
echo "Updating status to '$NEW_STATUS'..."

# Use sed to find and replace the status attribute.
# This approach is safe for both GNU and BSD (macOS) sed.
sed -i.bak "s/<StatusIndicator status=\"[a-zA-Z]*\" \/>/<StatusIndicator status=\"$NEW_STATUS\" \/>/" "$FILE_PATH" && rm "$FILE_PATH.bak"

echo "Status updated in $FILE_PATH."

# --- Git Commands ---
echo "Pulling, Adding, committing, and pushing changes..."

git pull
git add "$FILE_PATH"
git commit -m "$COMMIT_MESSAGE"
git push

echo "Done! Your status is now live."