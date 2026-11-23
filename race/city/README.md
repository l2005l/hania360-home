# HaniaRace city maps

The streets, buildings, parks, coast, traffic lights, signs, crossings and places around the centres of 20 Israeli
cities, for HaniaRace's open city (race.hania360.com). Made by `tools/pbf2city.py` and `tools/osm2city.py` from the
OpenStreetMap extract for Israel (Geofabrik), with heights from `tools/elev.py`; refreshed by the "city maps" workflow (`.github/workflows/citymaps.yml`).

Map data © OpenStreetMap contributors, available under the Open Database License (ODbL):
https://www.openstreetmap.org/copyright. These files are a derived database and are offered under the same licence.

Heights ("elev"): sampled from the Terrain Tiles on the Registry of Open Data on AWS (Mapzen "Terrarium" format,
https://registry.opendata.aws/terrain-tiles/). SRTM data courtesy of the U.S. Geological Survey; other sources as
listed at https://github.com/tilezen/joerd/blob/master/docs/attribution.md.

Shops and places: independent places keep their own names; chains (OSM "brand" tags) are shown only by what they are,
and adult, tobacco and gambling shops are left out.
