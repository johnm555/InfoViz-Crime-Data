console.log("after slider creation");
var year = us_stats.maxYear;
console.log("blah");
var w = 810,
    h = 400,
    yearsMargin = 100,
    rScale = 1 / 170;
var colors = ["#008038", "#F7976B", "#ED1C23"];

var scale = pv.Geo.scale()
    .domain({lng: -128, lat: 24}, {lng: -64, lat: 50})
    .range({x: 0, y: 0}, {x: w, y: h});

var yearsScale = pv.Scale.linear()
    .domain(us_stats.minYear, us_stats.maxYear)
    .range(yearsMargin + 2, w - yearsMargin);

// Colors by ColorBrewer.org, Cynthia A. Brewer, Penn State.
var col = function(v) {
  if (v < 17) return "#008038";
  if (v < 20) return "#A3D396";
  if (v < 23) return "#FDD2AA";
  if (v < 26) return "#F7976B";
  if (v < 29) return "#F26123";
  if (v < 32) return "#E12816";
  return "#B7161E";
};

var statecrime=[];
var maxvc;
vcdata.forEach(function(item){
    var vc = parseFloat(item.ViolentCrimesPerPop);
    var state = item.state-1;
    if (statecrime[state]){
        statecrime[state].vc = (statecrime[state].vc*statecrime[state].tot
            + vc)/(++statecrime[state].tot);
    } else {
        statecrime[state] = {vc: parseFloat(vc), tot: 1};
    }
});

// Find the centroid for each state
us_lowres.forEach(function(c) {
  c.code = c.code.toUpperCase();
  c.centLatLon = centroid(c.borders[0]);
});

console.log("here");
var timer = undefined;
function playClick() {
  if (timer) {
    stop();
  } else {
    if (year == us_stats.maxYear) year = us_stats.minYear;
    $(yearSlider).slider('value', year);
    $(play).attr("src", 'stop.png');
    vis.render();
    timer = setInterval(function() {
      year++;
      if (year >= us_stats.maxYear) stop();
      $(yearSlider).slider('value', year);
      vis.render();
    }, 900);
  }
}

// Stop the animation
function stop() {
  clearInterval(timer);
  timer = undefined;
  $(play).attr("src", 'play.png');
}

// Add the main panel
var vis = new pv.Panel()
    .width(w)
    .height(h)
    .top(30)
    .bottom(20);

// Add a panel for each state
var state = vis.add(pv.Panel)
    .data(us_lowres)
    .event("click", function(c) {
        console.log(c);
        console.log("Name: "+c.name+" idx: "+states.indexOf(c.name));
    });

// Add a panel for each state land mass
state.add(pv.Panel)
    .data(function(c) {return c.borders;})
  .add(pv.Line)
    .data(function(l) {return l;})
    .left(scale.x)
    .top(scale.y)
    .fillStyle(function(d, l, c) {
        var sc = statecrime[states.indexOf(c.name)];
        if (sc){
            console.log("state: "+c.name+" vc: "+sc.vc);
            return col(sc.vc*100);
        }
        else {
            console.log("sc undefined: "+c.name);
            return col(0);
        }
    })
    .lineWidth(1)
    .strokeStyle("white")
    .antialias(false);

// Add a label with the state code in the middle of every state
vis.add(pv.Label)
    .data(us_lowres)
    .left(function(c) {return scale(c.centLatLon).x})
    .top(function(c) {return scale(c.centLatLon).y})
    .text(function(c) {return c.code})
    .textAlign("center")
    .textBaseline("middle");

console.log("locations: "+vcdata.length);
/*
var pie = vis.add(pv.Panel)
    .data(us_lowres)
    .left(function(c) {return scale(c.centLatLon).x})
    .top(function(c) {return scale(c.centLatLon).y})
  .add(pv.Wedge)
    .data(function(c) {return [
        (100 - us_stats[c.code].over[us_stats.yearIdx(year)]
         - us_stats[c.code].obese[us_stats.yearIdx(year)]),
        us_stats[c.code].over[us_stats.yearIdx(year)],
        us_stats[c.code].obese[us_stats.yearIdx(year)]
      ]})
    .left(0)
    .top(0)
    .outerRadius(function(d, c) {return Math.sqrt(us_stats[c.code].pop[us_stats.yearIdx(year)])*rScale})
    .angle(function(d) {return d /100 * 2 * Math.PI})
    .fillStyle(function() {return colors[this.index]})
    .title(function(d, c) {return c.name});
*/
var pie = vis.add(pv.Dot)
    .data(vcdata)
    .left(function(c) {return scale(c).x})
    .top(function(c) {return scale(c).y})
    .size(function(c) {return c.ViolentCrimesPerPop * 30})
    .fillStyle(function() {return colors[0]})
    .strokeStyle("black")
    .title(function(c) {return c.name});
//  .root.render();
    
// Add the color bars for the color legend
vis.add(pv.Bar)
    .data(pv.range(14, 32.1, 3))
    .bottom(function(d) {return this.index * 12})
    .height(10)
    .width(10)
    .left(5)
    .fillStyle(function(d) {return col(14 + 3 * this.index)})
    .lineWidth(null)
  .anchor("right").add(pv.Label)
    .textAlign("left")
    .text(function(d) {return d + " - " + (d + 3) + "%"});

vis.render();