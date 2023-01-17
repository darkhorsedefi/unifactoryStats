import json
import datetime
import os

now = datetime.datetime.now()
filename = "stats/" + now.strftime("%d-%m-%Y") + ".md"

# Creating the stats directory if it doesn't exist
if not os.path.exists("stats"):
    os.mkdir("stats")

with open("stats.json", "r") as f:
    data = json.load(f)

total_swaps = 0
total_domains = 0

with open(filename,'w') as out:
    out.write("# Domain and Total Swaps\n")
    for domain in data:
        if "Total swaps" in domain["info"]:
            total_swaps += int(domain["info"]["Total swaps"])
            total_domains += 1
            out.write(f"- {domain['domain']} has {int(domain['info']['Total swaps'])} swaps.\n")

    out.write(f"\nTotal {total_domains} domains found with total {total_swaps} swaps.")
