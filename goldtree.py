import copy
import csv

class Symptoms(object):
    def __init__(self, filename):
        with open(filename) as f:
            reader = csv.reader(f, delimiter="\t")
            data = list(reader)

        self.diseases = data[0][1:]
        self.symptoms = [x[0] for x in data[1:]]
        self.matrix = [x[1:] for x in data[1:]]

        def convert(s):
            if s == "1":
                return True
            elif s == "0":
                return False
            elif s == "":
                return None
            else:
                raise ValueError("matrix contains bad data: %s" % (s))

        for i, row in enumerate(self.matrix):
            if row[0] not in ["0", "1", ""]:
                row = row[1:] + [""]
            self.matrix[i] = map(convert, row)

        self.disease_map = {v: i for i, v in enumerate(self.diseases)}
        self.symptom_map = {v: i for i, v in enumerate(self.symptoms)}

    def __call__(self, disease=None, symptom=None):
        if disease is None and symptom is None:
            raise TypeError("must specify either disease or symptom or both")
        elif disease is None:
            return copy.deepcopy(self.matrix[self.symptom_map[symptom]])
        elif symptom is None:
            return [x[self.disease_map[disease]] for x in self.matrix]
        else:
            return self.matrix[self.symptom_map[symptom]][self.disease_map[disease]]

if __name__ == "__main__":
    s = Symptoms("Matrix_symp_dis_v4_KIT.csv")

    print s(symptom="Otitis")
    print s(disease="AIDS")
    print s(disease="AIDS", symptom="Diarrhea")
