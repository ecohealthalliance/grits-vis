grits-vis
=========

Visualizations for GRITS. Candidate setup instructions for Pathognomonic decision tree

# Build virtualenv
mkvirtualenv tangelo
workon tangelo

# Setup tangelo
git clone https://github.com/Kitware/tangelo.git
cd tangelo
mkdir build
brew install cmake
cd build
make

## install dependencies
pip install cherrypy
pip install twisted
pip install ws4py
pip install autobahn
python bin/tangelo start

# Setup pathognomonic vis
cd ~
mkdir tangelo_html
git clone git@github.com:ecohealthalliance/grits-vis.git
cd grits-vis
make

## Display algorithm results
cat web/decision_tree.json
cat decision_tree.json | python -mjson.tool

## Vizualize algorithm results
http://localhost:8080/~USERNAME/web/
