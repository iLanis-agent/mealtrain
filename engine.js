/* MealTrain engine - pure meal-coordination logic, shared by app.html and node tests. */
(function(root, factory){
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MealTrainEngine = factory();
})(typeof self !== 'undefined' ? self : this, function(){

  var DAY = 86400000;

  function normDish(dish){
    return dish.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function displayDish(dish){
    var d = dish.trim().replace(/\s+/g, ' ');
    return d.charAt(0).toUpperCase() + d.slice(1);
  }

  /* date string N days after start (YYYY-MM-DD, noon to avoid DST edges) */
  function dateAt(startStr, offset){
    return new Date(new Date(startStr + 'T12:00:00').getTime() + offset * DAY).toISOString().slice(0, 10);
  }

  function fmtDate(str){
    return new Date(str + 'T12:00:00').toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
  }

  /* claims: [{date, person, dish}]; returns {claims, ok, why} */
  function claim(claims, date, person, dish){
    if (!person.trim()) return {claims:claims, ok:false, why:'name required'};
    if (!dish.trim()) return {claims:claims, ok:false, why:'dish required'};
    if (claims.some(function(c){ return c.date === date; })) return {claims:claims, ok:false, why:'night already covered'};
    return {claims:claims.concat([{date:date, person:person.trim(), dish:displayDish(dish)}]), ok:true};
  }

  function release(claims, date){
    return claims.filter(function(c){ return c.date !== date; });
  }

  /* coverage over the train window */
  function coverage(claims, startStr, days){
    var covered = {}, gaps = [];
    claims.forEach(function(c){ covered[c.date] = true; });
    for (var i = 0; i < days; i++){
      var d = dateAt(startStr, i);
      if (!covered[d]) gaps.push(d);
    }
    return {total:days, covered:days - gaps.length, gaps:gaps};
  }

  /* same normalized dish on 2+ nights -> variety warning */
  function duplicates(claims){
    var seen = {}, dups = [];
    claims.forEach(function(c){
      var k = normDish(c.dish);
      if (seen[k]) dups.push({dish:c.dish, dates:[seen[k], c.date]});
      else seen[k] = c.date;
    });
    return dups;
  }

  function nextGap(cov){
    return cov.gaps.length ? cov.gaps[0] : null;
  }

  return {DAY:DAY, normDish:normDish, displayDish:displayDish, dateAt:dateAt, fmtDate:fmtDate, claim:claim, release:release, coverage:coverage, duplicates:duplicates, nextGap:nextGap};
});
