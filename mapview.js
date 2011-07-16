var w = 810,
    h = 400,
    rScale = 1 / 170;
var statecrime=[];
var maxvc;
var zoomed=null;
var zoomedidx=-1;

var zoomscale = function(width,height){
    return pv.Geo.scale()
        .domain({lng: -128, lat: 24}, {lng: -64, lat: 50})
        .range({x: 0, y: 0}, {x: width, y: height});
}; 
var scale = zoomscale(w,h);

var crange = pv.Scale.linear(0, .4, 1).range("#FAF8CC", "red", "#C11B17");
var cdotrange = pv.Scale.linear(0, .4, 1).range("#E0FFFF", "blue", "#151B54");
var countrydotrange = pv.Scale.linear(0, .4, 1).range("#CCFFCC", "green", "#003300");

function setupMap(){
    processData();
    createVisualization();
}

function processData(){
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
}

function createVisualization(){
    // Add the main panel
    var vis = new pv.Panel()
        .width(w)
        .height(h)
        .top(30)
        .bottom(20);

    addState(vis, us_lowres, scale, 0, 0,
    function normalfillstyle(d, l, c) {
            var sc = statecrime[states.indexOf(c.name)];
            if (sc){
                //console.log("state: "+c.name+" vc: "+sc.vc);
                return crange(sc.vc);
                //return col(sc.vc*100);
            }
            else {//We have no data for cities in this state, so it was not created
                //console.log("sc undefined: "+c.name);
                return crange(0);//col(0);
            }
        },
        function normalstateclick(c) {
            console.log(c);
            console.log("Name: "+c.name+" idx: "+states.indexOf(c.name));
            zoomState(c);
        }
    );
    
    
    var pie = vis.add(pv.Dot)
        .data(vcdata)
        .left(function(c) {return scale(c).x})
        .top(function(c) {return scale(c).y})
        .size(function(c) {return c.ViolentCrimesPerPop * 30})
        .fillStyle(function(c) {return countrydotrange(c.ViolentCrimesPerPop)})
        .strokeStyle("black")
        .title(function(c) {return c.name})
        .event("click",oncityclick);
    
    vis.render();
}

function computeBounds(borders, scalers){
    var bnds = {minx: Number.MAX_VALUE, miny: Number.MAX_VALUE, maxx: 0, maxy: 0}
    for (var i=0;i<borders.length;i++){
        for (var j=0;j<borders[i].length;j++){
            //console.log("border: "+borders[i][j]);
            var b = borders[i][j];
            var x = scalers.x(b);
            var y = scalers.y(b);
            console.log("x: "+x+" y: "+y);
            if (x<bnds.minx) bnds.minx = x;
            if (y<bnds.miny) bnds.miny = y;
            if (x>bnds.maxx) bnds.maxx = x;
            if (y>bnds.maxy) bnds.maxy = y;
        }
    }
    return bnds;
}

function zoomState(statedata){
    console.log("zooooom: "+statedata);

    if (zoomed){
        $("#overlay").empty();
        $("#overlay").show();
        //zoomed.visible(false);
    }
    
    zoomedidx = states.indexOf(statedata.name)+1;
    var zsc = zoomscale(w*2,h*2);
    
    var bnds = computeBounds(statedata.borders,zsc);
    console.log("minx: "+bnds.minx+" maxx: "+bnds.maxx+" miny: "+bnds.miny+" maxy: "+bnds.maxy);
    var offsetx=w/2-(bnds.maxx-bnds.minx)/2-bnds.minx;
    var offsety=h/2-(bnds.maxy-bnds.miny)/2-bnds.miny;
    
    console.log("scaler: "+zsc+" - "+zsc.x);
    
    var ovis = new pv.Panel().canvas("overlay")
        .width(w)
        .height(h)
        .top(30)
        .bottom(20);
    
    zoomed = addState(ovis,[statedata],zsc, offsetx, offsety,
        function(){
            return "gray";
        },
        function(c){
            console.log("Namee: "+c.name+" idx: "+states.indexOf(c.name));
        });
        
    var scdata = [];
    for (var i=0;i<vcdata.length;i++){
        //console.log("zidx: "+zoomedidx+" state: "+vcdata[i].state);
        if (vcdata[i].state == zoomedidx)
            scdata.push(vcdata[i]);
    }
    var pie = ovis.add(pv.Dot)
        .data(scdata)
        .left(function(c) {return zsc.x(c)+offsetx})
        .top(function(c) {return zsc.y(c)+offsety})
        .size(function(c) {return c.ViolentCrimesPerPop * 30 * 3})
        .fillStyle(function(c) {return cdotrange(c.ViolentCrimesPerPop)})
        .strokeStyle("black")
        .title(function(c) {return c.name})
        .event("click",oncityclick);
    
    var closesize=150,closesize2=15;
    var close = ovis.add(pv.Dot)
        .left(function(){return bnds.minx+offsetx;})
        .top(function(){return bnds.miny+offsety;})
        .size(function(){return closesize})
        .fillStyle(function(){return "orange";})
        .strokeStyle("white")
        .event("click",function(){
            $("#overlay").hide().empty();
        }).add(pv.Line)
            .data([[bnds.minx+offsetx-closesize2/2,bnds.miny+offsety-closesize2/2],
                   [bnds.minx+offsetx+closesize2/2,bnds.miny+offsety+closesize2/2]])
            .top(function(d) {console.log("t: "+d);return d[1]})
            .left(function(d) {console.log("l: "+d);return d[0]})
        .add(pv.Line)
            .data([[bnds.minx+offsetx+closesize2/2,bnds.miny+offsety-closesize2/2],
                   [bnds.minx+offsetx-closesize2/2,bnds.miny+offsety+closesize2/2]])
            .top(function(d) {console.log("t: "+d);return d[1]})
            .left(function(d) {console.log("l: "+d);return d[0]});;
    
    ovis.render();
}

function addState(rootvis, data, scaler, offsetx, offsety, fill,onclick){

    // Add a panel for each state
    var state = rootvis.add(pv.Panel)
        .data(data)
        .event("click", onclick);
    
    // Add a panel for each state land mass
    state.add(pv.Panel)
        .data(function(c) {return c.borders;})
      .add(pv.Line)
        .data(function(l) {return l;})
        .left(function(l){return scaler.x(l)+offsetx})
        .top(function(l){return scaler.y(l)+offsety})
        .fillStyle(fill)
        .lineWidth(1)
        .strokeStyle("white")
        .antialias(false);
        
        // Add a label with the state code in the middle of every state
    rootvis.add(pv.Label)
        .data(data)
        .left(function(c) {return scaler(c.centLatLon).x+offsetx})
        .top(function(c) {return scaler(c.centLatLon).y+offsety})
        .text(function(c) {return c.code})
        .textAlign("center")
        .textBaseline("middle");
    
    return state;
}

setupMap();
addEventListener("load",function(){
    $("#overlay").hide();
},false);