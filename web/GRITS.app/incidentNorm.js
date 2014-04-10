/*jslint browser: true, nomen: true, unparam: true*/
(function () {

    var _p = Math.PI/180;
    function distNorm(a, b) {
        // distance between points on a sphere
        // scaled so that points on opposite sides have distance 1
        // code modified from 
        // http://www.codecodex.com/wiki/Calculate_Distance_Between_Two_Points_on_a_Globe
        var lon1 = a.geometry.coordinates[0],
            lat1 = a.geometry.coordinates[1],
            lon2 = b.geometry.coordinates[0],
            lat2 = b.geometry.coordinates[1];
        
        var dLat = (lat2-lat1)*_p/2;
        var dLon = (lon2-lon1)*_p/2; 
        var alpha = Math.sin(dLat) * Math.sin(dLat) +
                    Math.cos(lat1*_p) * Math.cos(lat2*_p) * 
                    Math.sin(dLon) * Math.sin(dLon); 
        var c = 2 * Math.asin(Math.sqrt(alpha)); 
        return c / Math.PI;

    }

    function speciesNorm(a, b) {
        // discrete norm in species name
        return a.properties.species === b.properties.species ? 1 : 0;
    }

    function symptomNorm(a, b) {
        // some norm on symptoms list, currently implemented as the Jaccard distance:
        // http://en.wikipedia.org/wiki/Jaccard_index
        var l1 = a.properties.symptoms.slice(),
            l2 = b.properties.symptoms.slice(),
            nInt = 0, nUni = 0;
        
        if (!l1.length && !l2.length) {
            // special case when both lists are empty
            return 1;
        }

        // compute the cardinality of the union and intersection
        // symptom arrays should be presorted
        while( l1.length > 0 && l2.length > 0) {
            if (l1[0] < l2[0]) {
                l1.shift();
                nUni++;
            } else if (l1[0] > l2[0]) {
                l2.shift();
                nUni++;
            } else {
                l1.shift();
                l2.shift();
                nUni++;
                nInt++;
            }
        }
        nUni += l1.length + l2.length;

        return ((nUni - nInt) / nUni);
    }

    // This function returns a function that computes the distance from the given
    // target incident.  Constants given in the argument define the weight
    // given to individual components of the norm.  All norms are scaled to 
    // return values in [0, 1].
    window.IncidentNorm = function (arg) {
        arg = arg || {};

        function norm(x) {
            // scale output to range [0,1]
            var c1 = norm.cSpecies * norm.cSpecies,
                c2 = norm.cSymptoms * norm.cSpecies,
                c3 = norm.cLocation * norm.cSpecies,
                c = Math.sqrt(c1 + c2 + c3) || 1,
                n1 = speciesNorm(norm.target, x),
                n2 = symptomNorm(norm.target, x),
                n3 = distNorm(norm.target, x);
            return Math.sqrt(
                c1 * n1 * n1 + 
                c2 * n2 * n2 +
                c3 * n3 * n3
            )/c;
        }
        norm.cSpecies = arg.cSpecies || 0;
        norm.cSymptoms = arg.cSymptoms || 0;
        norm.cLocation = arg.cLocation || 0;
        norm.target = arg.target || null;
        
        return norm;
    };
}());
