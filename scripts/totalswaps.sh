#!/bin/bash

# Get the total number of swaps by parsing the JSON file
total_swaps=$(cat file.json | jq -r '.[] | .info | .Total swaps')

# Initialize a variable to keep track of the total swaps
count=0

# Iterate through the total swaps and add them up
for swap in $total_swaps; do
  count=$((count+swap))
done

# Print the total number of swaps
echo "Total swaps: $count"
