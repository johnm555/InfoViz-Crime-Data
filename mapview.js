var w = 1000,
    h = 500,
    rScale = 1 / 170;
var statecrime=[];
var maxvc;
var zoomed=null;
var zoomedidx=-1;
var zoomscalefactor=2.5;
var zoomscale = function(width,height){
    return pv.Geo.scale()
        .domain({lng: -128, lat: 24}, {lng: -64, lat: 50})
        .range({x: 0, y: 0}, {x: width, y: height});
}; 
var scale = zoomscale(w,h);

var crange = pv.Scale.linear(0, .4, 1).range("#FAF8CC", "red", "#C11B17");
var cdotrange = pv.Scale.linear(0, .4, 1).range("#E0FFFF", "blue", "#151B54");
var countrydotrange = pv.Scale.linear(0, .4, 1).range("#CCFFCC", "green", "#003300");

var filters = {
    'medinc': {
        label: 'Medium Income',
        min: 100000,
        max: 0,
        range: [0,0]
    }   
}

function setupMap(){
    processData();
    initFilters();
    createVisualization();
}

function processData(){
    // Find the average violent crimes for each state, used in state's color
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

function initFilters(){
    for (var i=0;i<vcdata;i++){
        var d = vcdata[i];
        if (d.medIncome<filters['medinc'].min){
            filters['medinc'].min = d.medIncome;
        }
        if (d.medIncome>filters['medinc'].max){
            filters['medinc'].max = d.medIncome;
        }
    }
    filters['medinc'].range = [filters['medinc'].min,filters['medinc'].max];
    $( "#medinc-range" ).slider({
        range: true,
        min: filters['medinc'].min,
        max: filters['medinc'].max,
        values: [ filters['medinc'].range[0], filters['medinc'].range[1] ],
        slide: function( event, ui ) {
            //$( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
        }
    });
    //$( "#amount" ).val( "$" + $( "#slider-range" ).slider( "values", 0 ) +
    //    " - $" + $( "#slider-range" ).slider( "values", 1 ) );
}   
function normalFillStyle(d, l, c) {
    var sc = statecrime[states.indexOf(c.name)];
    if (sc){
        return crange(sc.vc);
    }
    else {//We have no data for cities in this state, so it was not created
        return crange(0);
    }
}
function createVisualization(){
    // Add the main panel
    var vis = new pv.Panel()
        .width(w)
        .height(h)
        .top(30)
        .bottom(20);

    //Draw all of the states.
    //Set the fill color to be based on the violent crimes
    addState(vis, us_lowres, scale, 0, 0,
        normalFillStyle,
        function normalstateclick(c) {
            console.log("Name: "+c.name+" idx: "+states.indexOf(c.name));
            zoomState(c);
        }
    );

    //Add a dot for each city we have data for
    //Encode the violent crimes rate in the size and color of each dot
    //Add the click even listener to show details on demand
    var pie = vis.add(pv.Dot)
        .data(vcdata)
        .left(function(c) {return scale(c).x})
        .top(function(c) {return scale(c).y})
        .size(function(c) {return c.ViolentCrimesPerPop * 30})
        .fillStyle(function(c) {return cdotrange(c.ViolentCrimesPerPop)})
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
            //console.log("x: "+x+" y: "+y);
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
    }
    $("#overlay-container").show();
    $("#overlay-shade").fadeOut(0).fadeTo(1000,.5);
    $("#overlay").fadeOut(0).fadeIn(1000);
    
    zoomedidx = states.indexOf(statedata.name)+1;
    var zsc = zoomscale(w*zoomscalefactor,h*zoomscalefactor);
    
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
    
    /*
    zoomed = addState(ovis,[statedata],zsc, offsetx, offsety,
        function(){
            return "gray";
        },
        function(c){
            console.log("Namee: "+c.name+" idx: "+states.indexOf(c.name));
        });
    */
    zoomed = animateState(ovis,[statedata], offsetx, offsety,
        normalFillStyle,
        function(c){
            console.log("Namee: "+c.name+" idx: "+states.indexOf(c.name));
        },
        function acallback(){
            drawCloseButton(ovis,bnds,offsetx,offsety);
            ovis.render();
        });
    
}
function hideoverlay(){
    $("#overlay").empty();
    $("#overlay-container").hide();
    $("#dod").fadeOut('fast');
}
function drawCloseButton(ovis,bnds,offsetx,offsety){
    //Draw close button
    var closesize=150,closesize2=15;
    
    var close = ovis.add(pv.Dot)
        .left(function(){return bnds.minx+offsetx;})
        .top(function(){return bnds.miny+offsety;})
        .size(function(){return closesize})
        .fillStyle(function(){return "orange";})
        .strokeStyle("white")
        .event("click",hideoverlay).add(pv.Line)
            .data([[bnds.minx+offsetx-closesize2/2,bnds.miny+offsety-closesize2/2],
                   [bnds.minx+offsetx+closesize2/2,bnds.miny+offsety+closesize2/2]])
            .top(function(d) {return d[1]})
            .left(function(d) {return d[0]})
            .event("click",hideoverlay)
        .add(pv.Line)
            .data([[bnds.minx+offsetx+closesize2/2,bnds.miny+offsety-closesize2/2],
                   [bnds.minx+offsetx-closesize2/2,bnds.miny+offsety+closesize2/2]])
            .top(function(d) {return d[1]})
            .left(function(d) {return d[0]})
            .event("click",hideoverlay);
}
function animateState(rootvis, data, endoffsetx, endoffsety, fill,onclick,callback){
    var scaler, offsetx=0, offsety=0;
    
    scaler = zoomscale(w,h);
    function zc(){
        return scaler;
    }
    // Add a panel for each state
    var state = rootvis.add(pv.Panel)
        .data(data)
        .event("click", onclick);
    
    var steps = 12;
    var curw=w, curh=h, maxw=zoomscalefactor*w, maxh=zoomscalefactor*h;
    var wstep = (maxw-curw)/steps;
    var hstep = (maxh-curh)/steps;
    var offsetxstep = (endoffsetx-offsetx)/steps;
    var offsetystep = (endoffsety-offsety)/steps;
    
    console.log("steps set");
    
    // Add a panel for each state land mass
    state.add(pv.Panel)
        .data(function(c) {return c.borders;})
      .add(pv.Line)
        .data(function(l) {return l;})
        .left(function(l){return zc().x(l)+offsetx})
        .top(function(l){return zc().y(l)+offsety})
        .fillStyle(fill)
        .lineWidth(1)
        .strokeStyle("white")
        .antialias(false);
        
        // Add a label with the state code in the middle of every state
    rootvis.add(pv.Label)
        .data(data)
        .left(function(c) {return zc()(c.centLatLon).x+offsetx})
        .top(function(c) {return zc()(c.centLatLon).y+offsety})
        .text(function(c) {return c.code})
        .textAlign("center")
        .textBaseline("middle");
            
    //Draw dots for each city
    var scdata = [];
    for (var i=0;i<vcdata.length;i++){
        //console.log("zidx: "+zoomedidx+" state: "+vcdata[i].state);
        if (vcdata[i].state == zoomedidx)
            scdata.push(vcdata[i]);
    }
    var pie = rootvis.add(pv.Dot)
        .data(scdata)
        .left(function(c) {return zc().x(c)+offsetx})
        .top(function(c) {return zc().y(c)+offsety})
        .size(function(c) {return c.ViolentCrimesPerPop * 30 * 3})
        .fillStyle(function(c) {return cdotrange(c.ViolentCrimesPerPop)})
        .strokeStyle("black")
        .title(function(c) {return c.name})
        .event("click",oncityclick);
        
    function animate(){
        curw+=wstep; curh+=hstep;
        offsetx+=offsetxstep;
        offsety+=offsetystep;
        scaler = zoomscale(curw,curh);
    
        rootvis.render();
        if (curw<maxw){
            setTimeout(animate,50);
        } else {
            callback();
        }
    }
    animate();
    return state;
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
    $("#overlay-container").hide();
},false);