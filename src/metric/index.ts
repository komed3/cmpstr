/**
 * @fileoverview
 * 
 * This file exports various string similarity and distance metrics. Each metric
 * is implemented as a class that extends the Metric base class.
 * 
 * Included metrics:
 *  - Cosine Similarity
 *  - Damerau-Levenshtein Distance
 *  - Dice-Sorensen Coefficient
 *  - Hamming Distance
 *  - Jaccard Index
 *  - Jaro-Winkler Distance
 *  - Longest Common Subsequence
 *  - Levenshtein Distance
 *  - Needleman-Wunsch Distance
 *  - Q-Gram Similarity
 *  - Smith-Waterman Distance
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 */

'use strict';

import CosineSimilarity from './Cosine';
import DamerauLevenshteinDistance from './DamerauLevenshtein';
import DiceSorensenCoefficient from './DiceSorensen';
import HammingDistance from './Hamming';
import JaccardIndex from './Jaccard';
import JaroWinklerDistance from './JaroWinkler';
import LCSMetric from './LCS';
import LevenshteinDistance from './Levenshtein';
import NeedlemanWunschDistance from './NeedlemanWunsch';
import QGramSimilarity from './qGram';
import SmithWatermanDistance from './SmithWaterman';

export const METRICS = {
    cosine: CosineSimilarity,
    damerau: DamerauLevenshteinDistance,
    dice: DiceSorensenCoefficient,
    hamming: HammingDistance,
    jaccard: JaccardIndex,
    jaroWinkler: JaroWinklerDistance,
    lcs: LCSMetric,
    levenshtein: LevenshteinDistance,
    needlemanWunsch: NeedlemanWunschDistance,
    qGram: QGramSimilarity,
    smithWaterman: SmithWatermanDistance
};