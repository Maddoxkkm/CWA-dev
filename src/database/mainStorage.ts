import Enmap from 'enmap';
import {PlayerDBEntry} from './db'

export const mainStorage = new Enmap<number,PlayerDBEntry>(`mainStorage`);