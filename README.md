Visualizations for GRITS
=========

Candidate setup instructions for Pathognomonic decision tree

* Build virtualenv

```
mkvirtualenv tangelo
workon tangelo
```

* Setup tangelo

```
git clone https://github.com/Kitware/tangelo.git
cd tangelo
mkdir build
brew install cmake
cd build
make
```

* install dependencies

```
pip install cherrypy
pip install twisted
pip install ws4py
pip install autobahn
python bin/tangelo start
```

* Setup pathognomonic vis

```
cd ~
mkdir tangelo_html
git clone git@github.com:ecohealthalliance/grits-vis.git
cd grits-vis
make
```

* Display algorithm results

```
cat web/decision_tree.json
cat decision_tree.json | python -mjson.tool
```

## Vizualize algorithm results

```
http://localhost:8080/~USERNAME/web/
```

## License
Copyright 2016 EcoHealth Alliance

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
