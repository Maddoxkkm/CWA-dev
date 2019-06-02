import Enmap = require('enmap');

import {PlayerDBEntry} from './db'
import { Snowflake } from 'discord.js';

export const mainStorage = new Enmap<Snowflake,PlayerDBEntry>(`mainStorage`);