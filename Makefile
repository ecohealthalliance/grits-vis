PYTHON=python2

web/decision_tree.json:	Matrix_symp_dis_v4_KIT.csv goldtree.py
	$(PYTHON) goldtree.py web/decision_tree.json
