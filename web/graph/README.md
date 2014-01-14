Usage
-----

1. Place the data file ``graph_export_2.json`` in this directory.
2. Navigate to http://localhost:8000/grits-vis/web/graph/ .

Data format
-----------

Here is some preliminary data. Our team of epidemiologists is working on tagging symptoms in the reports so most of them don't have any yet. We'll send an update when we have more. Hopefully this is enough to get started.

The format is similar to what we used for the network visualization before:

nodes, with fields promed_id, title, lat, lon, symptoms array.

edges, with source and target like before, but now there is an edge for every pair of nodes.
Each edge has:
* info_link: true/false - whether the source report has a reference to the target report
* matching_symptoms:count of the number of matching symptoms
* geo_distance: great circle distance in km

