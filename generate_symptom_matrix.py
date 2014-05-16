import contextlib
import re
from urllib import urlopen

DO_URL = 'https://svn.code.sf.net/p/diseaseontology/code/trunk/DO_logical_def.obo'

disease_symptom_map = {}
all_symptoms = set()

with contextlib.closing(urlopen(DO_URL)) as raw_obo:
  text = raw_obo.read()
  for term in text.split('\n[Typedef]')[0].split('\n[Term]\n')[1:]:
    if 'id: DOID' in term:
      name = ''
      symptoms = []
      for line in term.split('\n'):
        if line.startswith('name:'):
          name = line.split(': ')[1]
        elif line.startswith('def: '):
          symptoms = [re.compile('[\w\s]*').match(text).group(0) for text in line.split('has_symptom ')[1:]]
      disease_symptom_map[name] = symptoms
      all_symptoms.update(symptoms)

diseases = sorted(disease_symptom_map.keys())
all_symptoms = sorted(all_symptoms)
with open('matrix.csv', 'w') as f:
  header = 'Symptom'
  for disease in diseases:
    header += '\t%s' % disease
  f.write('%s\n' % header)

  for symptom in all_symptoms:
    row = symptom
    for disease in diseases:
      if symptom in disease_symptom_map[disease]:
        row += '\t1'
      else:
        row += '\t0'
    f.write('%s\n' % row)
