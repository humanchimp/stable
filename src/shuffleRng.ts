// The Fisher-Yates shuffle.
// Lovingly forked from a nice blog post by Mike Bostock.
// Recommended reading: https://bost.ocks.org/mike/shuffle/

function shuffleRng(rng) {
  return function shuffle(array) {
    var m = array.length,
      t,
      i;

    // While there remain elements to shuffle…
    while (m) {
      // Pick a remaining element…
      i = Math.floor(rng() * m--);

      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }

    return array;
  };
}

export { shuffleRng };
