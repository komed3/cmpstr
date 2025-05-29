'use strict';

import LevenshteinDistance from './Levenshtein';
import DiceSorensenCoefficient from './DiceSorensen';
import SmithWatermanDistance from './SmithWaterman';
import HammingDistance from './Hamming';

export const ALL_METRICS = {
    levenshtein: LevenshteinDistance,
    dice: DiceSorensenCoefficient,
    smithWaterman: SmithWatermanDistance,
    hamming: HammingDistance
};