'use strict';

import LevenshteinDistance from './Levenshtein';
import DiceSorensenCoefficient from './DiceSorensen';
import HammingDistance from './Hamming';

export const ALL_METRICS = {
    levenshtein: LevenshteinDistance,
    dice: DiceSorensenCoefficient,
    hamming: HammingDistance
};