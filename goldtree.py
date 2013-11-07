import copy
import csv

class SymptomMatrix(object):
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

def transpose(mat):
    return [list(row) for row in zip(*mat)]

def separate(seq, cond):
    yes = []
    no = []

    for i in seq:
        if cond(i):
            yes.append(i)
        else:
            no.append(i)

    return (yes, no)

def information_sort(m, diseases):
    def score(row):
        trues = len(filter(None, row))
        falses = len(row) - trues
        return 1.0 - float(abs(trues - falses)) / len(row)

    dis = [m(disease=d) for d in diseases]
    dis = transpose(dis)

    return sorted(zip(m.symptoms, map(score, dis)), key=lambda x: x[1], reverse=True)

def decision_tree(m):
    def go(m, diseases):
        if not diseases:
            return (None, None)

        info = information_sort(m, diseases)
        bd = info[0]
        if bd[1] > 0.0:
            with_symptom, without_symptom = separate(diseases, lambda d: m(disease=d, symptom=bd[0]))
            return (bd, [go(m, with_symptom), go(m, without_symptom)])
        else:
            return (map(lambda x: x[0], info), [])

    return go(m, m.diseases)

def describe_tree(t):
    pass

if __name__ == "__main__":
    m = SymptomMatrix("Matrix_symp_dis_v4_KIT.csv")
    d = decision_tree(m)
