'use strict';

import type { MetricInput, MetricResult } from '../utils/Types';

export default ( a : MetricInput, b : MetricInput ) : MetricResult => {

    return {
        metric: 'levenshtein', a, b, similarity: 0,
        raw: {}
    };

};