'use strict';

import type {} from './utils/Types';

import { DiffChecker } from './utils/DiffChecker';
import { Filter } from './utils/Filter';
import { Normalizer } from './utils/Normalizer';
import { Profiler } from './utils/Profiler';
import { TextAnalyzer } from './utils/TextAnalyzer';

import { METRICS } from './metric/index';
import { PHONETICS } from './phonetic/index';

export default class CmpStr {};