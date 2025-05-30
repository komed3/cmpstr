'use strict';

import LevenshteinDistance from './Levenshtein';
import DiceSorensenCoefficient from './DiceSorensen';
import CosineSimilarity from './Cosine';
import SmithWatermanDistance from './SmithWaterman';
import HammingDistance from './Hamming';

export const ALL_METRICS = {
    levenshtein: LevenshteinDistance,
    dice: DiceSorensenCoefficient,
    cosine: CosineSimilarity,
    smithWaterman: SmithWatermanDistance,
    hamming: HammingDistance
};