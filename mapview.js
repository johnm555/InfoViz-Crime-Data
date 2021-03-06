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

//Color ranges from 0 to 1 yielding a color between the min max specified
var crange = pv.Scale.linear(0, .6, 1).range("#FAF8CC", "red", "#660000");
//var crange = pv.Scale.linear(0, 1).range("#FF9999", "red");
var cdotrange = pv.Scale.linear(0, .4, 1).range("#E0FFFF", "blue", "#151B54");
var countrydotrange = pv.Scale.linear(0, .4, 1).range("#CCFFCC", "green", "#003300");
var countrydots,zoomeddots;

var selectedcity="";
var mapvis;
var filters = {
    'medinc': {
        label: 'Medium Income',
        min: 100000,
        max: 0,
        range: [0,0],
        includes: function(c){
            if (c.medIncome>=filters['medinc'].range[0] &&
                    c.medIncome<=filters['medinc'].range[1]){
               return true;    
            }
            return false;
        }
    },
    'pop': {
        label: 'Population',
        min: 100000,
        max: 0,
        range: [0,0],
        includes: function(c){
            if (c.population>=filters['pop'].range[0] &&
                    c.population<=filters['pop'].range[1]){
               return true;    
            }
            return false;
        }
    }
}

//Sets up filters, processes data, and creates the visualization

function setupMap(){
    initFilters();
    processData();
    createVisualization();
}

function processData(){
    /*
    vcdata.sort(function(a,b){
        if (a.ViolentCrimesPerPop>b.ViolentCrimesPerPop)
            return -1;
        else
            return 1;
    });
    */
    calculateStateCrime();
    
    // Find the centroid for each state
    us_lowres.forEach(function(c) {
      c.code = c.code.toUpperCase();
      c.centLatLon = centroid(c.borders[0]);
    });
}

//Summarizes the state crime per state based on the visible cities crime data
//This is the value that provides the color for each state.
function calculateStateCrime(){
    // Find the average violent crimes for each state, used in state's color
    statecrime = [];
    vcdata.forEach(function(item){
        if (testWithFilters(item)){//Determine if it should be visible or not
            var vc = parseFloat(item.ViolentCrimesPerPop);
            var state = item.state-1;
            if (statecrime[state]){
                statecrime[state].vc = (statecrime[state].vc*statecrime[state].tot
                    + vc)/(++statecrime[state].tot);
            } else {
                statecrime[state] = {vc: parseFloat(vc), tot: 1};
            }
        } 
    });
}

//Find min and max for value of each filter
function initFilters(){
    for (var i=0;i<vcdata.length;i++){
        var d = vcdata[i];
        d.medIncome=d.medIncome*100000;
        d.population=d.population*100000;
        if (d.medIncome<filters['medinc'].min){
            filters['medinc'].min = d.medIncome;
        }
        if (d.medIncome>filters['medinc'].max){
            filters['medinc'].max = d.medIncome;
        }
        if (d.population<filters['pop'].min){
            filters['pop'].min = d.population;
        }
        if (d.population>filters['pop'].max){
            filters['pop'].max = d.population;
        }
    }
    filters['medinc'].range = [filters['medinc'].min,filters['medinc'].max];
    filters['pop'].range = [filters['pop'].min,filters['pop'].max];

    var filterdelayed=-1;
    function createSlider(prefix,vp){
        $( "#"+prefix+"-range" ).slider({
            range: true,
            min: filters[prefix].min,
            max: filters[prefix].max,
            values: [ filters[prefix].range[0], filters[prefix].range[1] ],
            slide: function( event, ui ) {
                $( "#"+prefix ).val( vp + ui.values[ 0 ] + " - "+vp + ui.values[ 1 ] );
                filters[prefix].range[0]=ui.values[0];
                filters[prefix].range[1]=ui.values[1];
                if (filterdelayed!=-1) clearTimeout(filterdelayed);
                filterdelayed = setTimeout(function(){
                    calculateStateCrime();
                    mapvis.render();
                    //countrydots.render();
                    if (zoomedidx>-1)
                        zoomeddots.render();
                    
                },300);
            }
        });
        $( "#"+prefix ).val( $( "#"+prefix+"-range" ).slider( "values", 0 ) +
                " - " + $( "#"+prefix+"-range" ).slider( "values", 1 ) );
    }
    createSlider('medinc',"$");
    createSlider('pop',"");
	
	
}   
//Returns true if an item should be visible based on each filter
function testWithFilters(c){
    for (var f in filters){
        if (!filters[f].includes(c))
            return false;
    }
    return true;
}
//Returns a color between the min and max colors of the state's background color range
function normalFillStyle(d, l, c) {
    var sc = statecrime[states.indexOf(c.name)];
    if (sc){
        return crange(sc.vc);
    }
    else {//We have no data for cities in this state, so it was not created
        return crange(0);
    }
}
//Adds states, draws dots
function createVisualization(){
    // Add the main panel
   var vis;
   mapvis = vis = new pv.Panel()
        .width(w)
        .height(h)
        .top(30)
        .bottom(20)
        //.event("mousedown", pv.Behavior.pan())
        //.event("mousewheel", pv.Behavior.zoom())
        ;
    
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
    //console.log(pv.Behavior);
    countrydots = vis.add(pv.Dot)
        .data(vcdata)
        .left(function(c) {return scale(c).x})
        .top(function(c) {return scale(c).y})
        .size(function(c) {return c.population/100000 * 60})
        .fillStyle(function(c) {return cdotrange(c.ViolentCrimesPerPop)})
        .strokeStyle(function(c){return (c.Location==selectedcity)?"yellow":"black"})
        .event("click",oncityclick)
        .title(function(c){return c.Location})
        //.text(function(c){return c.Location+" - Crime: "+c.ViolentCrimesPerPop})
        //.event("mouseover",function(c){this.title("Toollltip");})
        //.event("mouseover", pv.Behavior.tipsy({gravity: "w", fade: true}))
        .visible(testWithFilters);

    // Add the color bars for the color legend
    var keydat = [0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1];
    vis.add(pv.Bar)
        .data(keydat)
        .bottom(function(d) {return this.index * 12})
        .height(10)
        .width(10)
        .left(5)
        .fillStyle(function(d) {return crange(d)})
        .lineWidth(null)
      .anchor("right").add(pv.Label)
        .textAlign("left")
        .text(function(d) {return d + "%"});
        
    //add some labels
    vis.add(pv.Label)
        .bottom(keydat.length*12)
        .left(5)
        .text("Average state crime Rate");
        
    vis.add(pv.Dot)
        .bottom(12)
        .left(80)
        .size(function(c) {return 60})
        .fillStyle(function(c) {return cdotrange(.5)})
        .strokeStyle(function(c){return "black"})
      .anchor("right").add(pv.Label)
        .textAlign("left")
        .text("Darker color represents higher crime rate. Dot size reflects city's population");
        
    vis.render();
}

//Find the min/max x and y of the state, used for zooming
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

//Toggle fading background, find offset and bounds, animate state
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
    //console.log("minx: "+bnds.minx+" maxx: "+bnds.maxx+" miny: "+bnds.miny+" maxy: "+bnds.maxy);
    
    
    var offsetx=w/2-(bnds.maxx-bnds.minx)/2-bnds.minx;
    var offsety=h/2-(bnds.maxy-bnds.miny)/2-bnds.miny;
    
    var ovis = new pv.Panel().canvas("overlay")
        .width(w)
        .height(h)
        .top(30)
        .bottom(20);
    
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
//Hide background, clear out state variables indicating state
function hideoverlay(){
    $("#overlay").empty();
    $("#overlay-container").fadeOut('fast');
    $("#dod").fadeOut('fast');
    zoomedidx = -2;
    selectedcity = "";
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
        //Add X lines to indicate close button, attach click even to those as well
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
/*
Custom state animation.
Starts new state at original position on the map, slowly magnifies the state
and zooms it at double the size in the middle of the map.
Also enables the library's zooming feature to zoom and pan the individual state
-This was more efficient than zooming all the states in the entire map
*/
function animateState(rootvis, data, endoffsetx, endoffsety, fill,onclick,callback){
    var scaler, offsetx=0, offsety=0;
    
    scaler = zoomscale(w,h);
    function zc(){
        return scaler;
    }
    rootvis.event("mousedown", pv.Behavior.pan())
        .event("mousewheel", pv.Behavior.zoom())
    // Add a panel for each state
    var state = rootvis.add(pv.Panel)
        .data(data)
        .event("click", onclick)
        
        ;
    
    var steps = 12;
    var curw=w, curh=h, maxw=zoomscalefactor*w, maxh=zoomscalefactor*h;
    var wstep = (maxw-curw)/steps;
    var hstep = (maxh-curh)/steps;
    var offsetxstep = (endoffsetx-offsetx)/steps;
    var offsetystep = (endoffsety-offsety)/steps;
    
    
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
        .antialias(false)
        //.event("mousewheel", pv.Behavior.zoom())
        //.event("mousedown", pv.Behavior.pan())
        ;
        
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
    zoomeddots = rootvis.add(pv.Dot)
        .data(scdata)
        .left(function(c) {return zc().x(c)+offsetx})
        .top(function(c) {return zc().y(c)+offsety})
        .size(function(c) {return c.population/100000 * 30 * 3})
        .fillStyle(function(c) {return cdotrange(c.ViolentCrimesPerPop)})
        .strokeStyle(function(c){return (c.Location==selectedcity)?"yellow":"black"})
        //.title(function(c) {return c.name})
        .event("click",oncityclick)
        //.event("mouseover",function(c){this.title("Zoomed");})
        .title(function(c){return c.Location})
        //.text(function(c){return c.Location+" - Crime: "+c.ViolentCrimesPerPop})
        //.event("mouseover", pv.Behavior.tipsy({gravity: "w", fade: true, delayIn: 2000}))
        .visible(testWithFilters);
        
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

//Used to add all sstates to the map or to add the zoomed state
//Data is an array of state borders containing start and end lat,lng coordinates
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