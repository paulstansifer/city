var terrain = [];
var col_dim = 20;
var row_dim = 20;
var total_food_harvest = 0;
var total_stuff_harvest = 0;
var total_urbanity = 0;
var time_elapsed = 0;
var total_science = 0;
var construction_cost = 20;

// the initial seed
Math.seed = 0;

// source investigated here: http://programmers.stackexchange.com/questions/260969/original-source-of-seed-9301-49297-233280-random-algorithm
Math.seededRandom = function(max, min) {
    max = max || 1;
    min = min || 0;

    Math.seed = (Math.seed * 9301 + 49297) % 233280;
    var rnd = Math.seed / 233280;

    return min + rnd * (max - min);
}


function generateMap() {
  terrain = new Array(col_dim);
  for(var col = 0; col < col_dim; col++) {
    terrain[col] = new Array(row_dim);
    for(var row = 0; row < 20; row++) { 
      terrain[col][row] = makeTile(col, row);
    }
  }
  $(".map").html(terrain.map(displayRow).join(''));

  clickHex(10,10,true);
}

function makeTile(col, row) {
  return {
    food : Math.floor(Math.seededRandom() * Math.seededRandom() * 5.5 + 0.5),
    stuff : Math.floor(Math.seededRandom() * 4),
    col: col,
    row: row,
    id: 'hex' + col + '_' + row,

    /* these can change */

    construction: null,
    harvested: false,

    /* these are recalculated by `refreshTile` */
    food_harvested: 0,
    stuff_harvested: 0,
    urbanity: 0,
  }
}

function refreshTile(t) {
  if (t.harvested) {
    total_food_harvest += t.food - t.food_harvested;
    t.food_harvested = t.food;
    total_stuff_harvest += t.stuff - t.stuff_harvested;
    t.stuff_harvested = t.stuff;
  } else {
    total_food_harvest -= t.food_harvested;
    t.food_harvested = 0;
    total_stuff_harvest -= t.stuff_harvested;
    t.stuff_harvested = 0;
  }
  
  if (t.construction != null) {
    total_urbanity -= t.urbanity;
    t.urbanity = 0;
  
    var adjs = adjacentTiles(t.col, t.row);
    for(var i = 0; i < adjs.length ; i++) {
      if (adjs[i].construction != null) {
        t.urbanity++;
      }
    }

    total_urbanity += t.urbanity;
  }

  $("#" + t.id).replaceWith(displayTile(t));
}

function clickHex(col,row,free) {
  var t = terrain[col][row];

  /*var oktobuild = false;
  for (var i = 0; i < adjs.length; i++) {
    if (adjs[i].construction != null) {
      oktobuild = true;
    }
  }*/

  if (!free) {
    // proxy for adjacency
    if (!t.harvested) { return; }

    build_time = Math.floor(construction_cost / production());

    if (build_time + time_elapsed >= 100) {
        alert("In 100 years, you collected "
              + (total_science + (100 - time_elapsed)*total_urbanity).toString() 
              + " science.");
    }

    construction_cost += 20;

    time_elapsed += build_time;
    total_science += total_urbanity*build_time;
  }

  t.construction = 5;
  t.harvested = false;
  refreshTile(t);

  var adjs = adjacentTiles(t.col, t.row);
  for(var i = 0; i < adjs.length ; i++) {
    adj = adjs[i];
    adj.harvested = (adj.construction == null);
    refreshTile(adj);
  }

  $("#harvest").html(
      "Year: " + time_elapsed.toString() + " "
          + "Harvest: " + total_food_harvest.toString() + "◉+ " 
          + total_stuff_harvest.toString() + "◈%, "
          + total_urbanity.toString() + "⋆. "
          + "Construction time: " + construction_cost + "/" + production() + " = "
          + Math.floor(construction_cost / production()) + ". "
          + "Science collected: " + total_science.toString() + "⋆ ");
}

function production() { return Math.floor(total_food_harvest * (1 + 0.01 * total_stuff_harvest)); }

function adjacentTiles(col, row) {
  var retVal = [];
  var col_horiz_adj;
  if(row % 2 == 0) {
    col_horiz_adj = col-1;
  } else {
    col_horiz_adj = col+1;
  }

  if(row > 0) { 
    retVal.push(terrain[col][row-1]);
    if (col_horiz_adj >= 0 && col_horiz_adj < col_dim) {
      retVal.push(terrain[col_horiz_adj][row-1]);
    }
  }
  if(row < row_dim-1) { 
    retVal.push(terrain[col][row+1]);
    if (col_horiz_adj >= 0 && col_horiz_adj < col_dim) {
      retVal.push(terrain[col_horiz_adj][row+1]);
    }
  }
  if(col > 0) { retVal.push(terrain[col-1][row]); }
  if(col < col_dim-1) { retVal.push(terrain[col+1][row]); }

  return retVal;
}

function repeatString(str, n) {
  return new Array(n+1).join(str);
}

function displayTile(tile) {
  var interior, dispClass;
  if (tile.construction == null) {
    interior = ('<span class="counter">'
          + repeatString('◉', tile.food_harvested)
          + repeatString('○', tile.food - tile.food_harvested)
          + '</span><span class="counter">'
          + repeatString('◈', tile.stuff_harvested)
          + repeatString('◇', tile.stuff - tile.stuff_harvested)
          + '</span>');
    dispClass = 'noConstructionHex';
  } else {
    interior = '<span class="counter">' + repeatString('⋆',tile.urbanity) + '</span>'; //◌
    dispClass = 'constructionHex'
  }

  return ('<div id="' + tile.id + '" class="hex"><div class="hex-in"><div class="hex-in-in '
          + dispClass
          + '" onClick="clickHex('
          + tile.col.toString() + ',' + tile.row.toString()+',false)">'
          + interior + '</div></div></div>');
}

function displayRow(row) {
  return '<div class="row">' + row.map(displayTile).join('') + '</div>';
}
