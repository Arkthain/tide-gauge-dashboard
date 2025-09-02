import os
import requests
import json
from datetime import datetime

#----------------------------------------------------------------------------------------
#
#   Config
#
#----------------------------------------------------------------------------------------
API_BASE = "https://environment.data.gov.uk/flood-monitoring"
START_DATE = "2025-08-01"
DATA_DIR = "data"

#----------------------------------------------------------------------------------------
#
#   Functions
#
#----------------------------------------------------------------------------------------

def fetch_tide_stations():
    url = f"{API_BASE}/id/stations"
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json().get("items", [])

def fetch_tide_data(station_id, start_date):
    # end date = today in UTC
    end_date = datetime.utcnow().strftime("%Y-%m-%d")

    url = (
        f"{API_BASE}/id/stations/{station_id}/readings"
        f"?startdate={start_date}&enddate={end_date}"
    )

    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json()

def save_to_file(station_id, data):
    os.makedirs(DATA_DIR, exist_ok=True)
    filename = os.path.join(DATA_DIR, f"{station_id}.json")
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)

#----------------------------------------------------------------------------------------
#
#   Processing pipeline
#
#----------------------------------------------------------------------------------------

def main():
    print(f"[{datetime.now()}] Fetching tide stations...")
    stations = fetch_tide_stations()
    print(f"Found {len(stations)} stations.")

    for station in stations:
        station_id = station['notation']
        print(f"→ Fetching data for station {station_id}...")
        try:
            data = fetch_tide_data(station_id, START_DATE)
            save_to_file(station_id, data)
            print(f"  ✔ Saved data for {station_id}")
        except Exception as e:
            print(f"  ✖ Failed to fetch/save {station_id}: {e}")
    # Take the location from stations and create a static store of locations as an available to query JSON for the webpage dropdown.
    stations_summary = [
    {"id": station["notation"], "label": station["label"]}
    for station in stations
    ]

    with open("data/stations.json", "w") as f:
        json.dump(stations_summary, f, indent=2)

#----------------------------------------------------------------------------------------
#
#   Execute call
#
#----------------------------------------------------------------------------------------

if __name__ == "__main__":
    main()
