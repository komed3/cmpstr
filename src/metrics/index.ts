'use strict';

import CosineSimilarity from './Cosine';
import DiceSorensenCoefficient from './DiceSorensen';
import HammingDistance from './Hamming';
import LevenshteinDistance from './Levenshtein';
import NeedlemanWunschDistance from './NeedlemanWunsch';
import SmithWatermanDistance from './SmithWaterman';

export const ALL_METRICS = {
    cosine: CosineSimilarity,
    dice: DiceSorensenCoefficient,
    hamming: HammingDistance,
    levenshtein: LevenshteinDistance,
    needlemanWunsch: NeedlemanWunschDistance,
    smithWaterman: SmithWatermanDistance
};