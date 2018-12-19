import { shuffleRng } from './shuffleRng';

const shuffle = shuffleRng(Math.random);

shuffle.rng = shuffleRng;

export { shuffle };
