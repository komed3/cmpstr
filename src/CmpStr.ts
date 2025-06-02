'use strict';

import type {} from './utils/Types';

import { Normalizer } from './utils/Normalizer';
import { Filter } from './utils/Filter';
import { TextAnalyzer } from './utils/TextAnalyzer';
import { DiffChecker } from './utils/DiffChecker';

import { METRICS } from './metric/index';
import { PHONETICS } from './phonetic/index';

export default class CmpStr {};