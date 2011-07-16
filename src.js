//http://archive.ics.uci.edu/ml/machine-learning-databases/communities/communities.data
var locations = [];
var geocoder;
var map;
var myHeatmap;
var myData;
var vis;
var scale, color;

function VizOverlay(locations, map){
    this.locations = locations;
    this.map = map;
}
VizOverlay.prototype = new google.maps.OverlayView();
VizOverlay.prototype.onAdd = function(){
    var div = document.createElement("div");
    div.style.border = "none";
    div.style.borderWidth = "0px";
    div.style.position = "absolute";
    
    // Create an IMG element and attach it to the DIV.
    var img = document.createElement("img");
    img.src = this.image_;
    img.style.width = "100%";
    img.style.height = "100%";
    div.appendChild(img);
    
    // Set the overlay's div_ property to this DIV
    this.div_ = div;
    
    // We add an overlay to a map via one of the map's panes.
    // We'll add this overlay to the overlayImage pane.
    var panes = this.getPanes();
    panes.overlayLayer.appendChild(div);

}
VizOverlay.prototype.draw = function(){
  // Size and position the overlay. We use a southwest and northeast
  // position of the overlay to peg it to the correct position and size.
  // We need to retrieve the projection from this overlay to do this.
  var overlayProjection = this.getProjection();

  // Retrieve the southwest and northeast coordinates of this overlay
  // in latlngs and convert them to pixels coordinates.
  // We'll use these coordinates to resize the DIV.
  var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
  var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

  // Resize the image's DIV to fit the indicated dimensions.
  var div = this.div_;
  div.style.left = sw.x + 'px';
  div.style.top = ne.y + 'px';
  div.style.width = (ne.x - sw.x) + 'px';
  div.style.height = (sw.y - ne.y) + 'px';

  var c = this.div_, m = this.map, r = 20;

  /* Get the pixel locations of the crimes. */
  var pixels = this.crimes.map(function(d) {
      return m.fromLatLngToDivPixel(new GLatLng(d.lat, d.lon));
    });

  /* Update the canvas bounds. Note: may be large. */
  function x(p) { return p.x;} function y(p){ return p.y;}
  var x = { min: pv.min(pixels, x) - r, max: pv.max(pixels, x) + r };
  var y = { min: pv.min(pixels, y) - r, max: pv.max(pixels, y) + r };
  c.style.width = (x.max - x.min) + "px";
  c.style.height = (y.max - y.min) + "px";
  c.style.left = x.min + "px";
  c.style.top = y.min + "px";

  /* Render the visualization. */
  new pv.Panel()
      .canvas(c)
      .left(-x.min)
      .top(-y.min)
    .add(pv.Panel)
      .data(this.crimes)
    .add(pv.Dot)
      .left(function(){return pixels[this.parent.index].x;})
      .top(function() {return pixels[this.parent.index].y;})
      .strokeStyle(function(x, d) {return colors[d.code].dark;})
      .fillStyle(function(x, d) {return colors[d.code].light;})
      .size(140)
    .anchor("center").add(pv.Label)
      .textStyle("white")
      .text(function(x, d) {return d.code;})
    .root.render();
}
function initialize(){

/*
$(function() {
    //myHeatmap = new GEOHeatmap();
    myData = null;
    geocoder = new google.maps.Geocoder();
    
    console.log("geocoder init");

    // set up Google map, pass in the heatmap function
    var myLatlng = new google.maps.LatLng(38.5, -121.8);
    console.log("init lat long center");
    var myOptions = {
     zoom: 5,
     center: myLatlng,
     mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    //$("#map_canvas").hide();
    console.log("Map initialized");
    

});

loadData();
*/
}

function loadData(){
//    var url = "http://archive.ics.uci.edu/ml/machine-learning-databases/communities/communities.data";
    var url = "processed.data";//"communities.data";
    $.ajax({
        url: url,
        dataType: "text",
        complete: function(){
            console.log("complete");
        },
        success: function(data, textstatus, jqxhr){
            console.log("success");
/*
var myHeatmap = new GEOHeatmap();
var myData = null;
$(function() {
// create data
myData = new Array();
for (p = 0; p < 50; p++) {
 var rLatD = Math.floor(Math.random() * 1000);
 var rLonD = Math.floor(Math.random() * 1000);
 var rValD = Math.floor(Math.random() * 10);

 myData.push(38.47 + (rLatD / 15000));
 myData.push(-121.84 + (rLonD / 15000));
 myData.push(rValD);
}

// configure HeatMapAPI
myHeatmap.Init(400, 300); // set at pixels for your map
myHeatmap.SetBoost(0.8);
myHeatmap.SetDecay(0); // see documentation
myHeatmap.SetData(myData);
myHeatmap.SetProxyURL('http://localhost/infoviz/service.php');

// set up Google map, pass in the heatmap function
var myLatlng = new google.maps.LatLng(38.5, -121.8);
var myOptions = {
 zoom: 11,
 center: myLatlng,
 mapTypeId: google.maps.MapTypeId.ROADMAP
}
var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
google.maps.event.addListener(map, 'idle', function(event) {
 myHeatmap.AddOverlay(this, myHeatmap);
});
});
*/
            
            //console.log(data[0]);
            var count=0;
            function process(){
                count++;
                if (count<=1){
                
                    lineend = data.indexOf("\r");
                    if (lineend<1)
                        lineend = data.indexOf("\n");
                    if (!(lineend<1)){
                        var line = data.substring(0,lineend);
                        data = data.substring(lineend+1);
                        if (count>=0){
                        updateData(line, function(){
                            console.log("count: "+count);
                            if (count%100==0)
                                setTimeout(process,40);//+100*Math.random()*20);
                            else
                                process();
                        });
                        }
                        return;
                    } 
                }
                
                // create data
                console.log("Finished loading data...");
                //addPieChart(locations);
                //vis.render();
                /*myData = new Array();
                for (p = 0; p < locations; p++) {
                 //var rLatD = Math.floor(Math.random() * 1000);
                 //var rLonD = Math.floor(Math.random() * 1000);
                 //var rValD = Math.floor(Math.random() * 10);
                
                 myData.push(locations[p].lat);
                 myData.push(locations[p].lng);
                 myData.push(locations[p].data[locations[p].data.length-1]);
                }
                
                //console.log("geoheatmap: "+GEOHeatmap+" my: "+myHeatmap);
                // configure HeatMapAPI
                var mapele = $("#map_canvas");
                
                myHeatmap.Init(mapele.width(), mapele.height()); // set at pixels for your map
                myHeatmap.SetBoost(0.8);
                myHeatmap.SetDecay(0); // see documentation
                myHeatmap.SetData(myData);
                //var preURL = myHeatmap.getURL();
                //console.log("preurl: "+preURL);
                //var heatmapOverlay = new HMGoogleOverlay(preURL);
                //map.addOverlay(heatmapOverlay);
                //myHeatmap.SetProxyURL('http://localhost/infoviz/service.php');
                //google.maps.event.addListener(map, 'idle', function(event) {
                // console.log("add overlay");
                // myHeatmap.AddOverlay(this, myHeatmap);
                //});
                */
            }
            process();
            
        },
        error: function(jqxhr, status, err){
            console.log("error: "+status+" - "+err);
        }
    });
}
function updateData(line, callback){
    var info = line.split(/,/);
    //if (info[0]!=55){
    //    callback();
    //    return;
    //}
    var name = parseName(info[3],info[0]);
    
    //console.log("name1: "+name);
    //lookupLatLong(name, 
    loadLatLng(info,
        function(lat,lng){
            //console.log("splice");
            info.splice(4,0,lat,lng);
            locations.push({"name":name,"lat":lat,"lng":lng,data: info});
            console.log("line2: "+info);
            $("#data-box").html($("#data-box").html()+"<br/>\n"+name);
            
            
            //addPieChart(locations[locations.length-1]);
            
            callback();
    });
}
function addPieChart(locs){
    //console.log("loc: "+loc.name+" lat: "+loc.lat+" lng: "+loc.lng);
    // Add the pie chart
    var pie = vis.add(pv.Panel)
        .data(locs)
        .left(function(c) {return scale(c).x})
        .top(function(c) {return scale(c).y})
    
      .add(pv.Wedge)
        .data(function(c) {return [
            30,30,40
            //(100 - us_stats[c.code].over[us_stats.yearIdx(year)]
            // - us_stats[c.code].obese[us_stats.yearIdx(year)]),
            //us_stats[c.code].over[us_stats.yearIdx(year)],
            //us_stats[c.code].obese[us_stats.yearIdx(year)]
          ]})
        .left(0)
        .top(0)
        .outerRadius(function(d, c) {return Math.sqrt(
            .5)*20} )//us_stats[c.code].pop[us_stats.yearIdx(year)]
        .angle(function(d) {return d /100 * 2 * Math.PI})
        .fillStyle(function() {return colors[this.index]})
        .title(function(d, c) {return c.name});
    console.log("chart added?: "+us_lowres[0].name);
}
function parseName(name,state){
    //Sommersettown
    //Humblecity
    //NewBrittentown
    //Wyckofftownship
    //console.log("nammme: "+name);
    name = name.replace(/township$/,"")
               .replace(/town$/,"")
               .replace(/city$/,"")
               .replace(/village$/,"");
    for (var i=1;i<name.length;i++){
        if (name[i]==name[i].toUpperCase()){
            name = name.substr(0,i)+" "+name.substr(i);
            i++;
        }
    }
    console.log("state: "+states[state-1]);
    if (states[state-1]){
        name = name+", "+states[state-1];
    }
    return name;
    
}
function loadLatLng(info, callback){
    var latlng = new google.maps.LatLng(info[4],info[5]);
    //map.setCenter(latlng);
    //var marker = new google.maps.Marker({
    //     map: map,
    //     title: name,
    //     position: latlng
    //});
    callback(info[4],info[5]);
}
function lookupLatLong(name, callback){
    //console.log("latlong lookup");
    geocoder.geocode( { 'address': name}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
         map.setCenter(results[0].geometry.location);
         var marker = new google.maps.Marker({
             map: map,
             title: name,
             position: results[0].geometry.location
         });
        //console.log("before parsing results");
        var loc = results[0].geometry.location;
        var lat = loc.lat();
        var lng = loc.lng();
        //console.log("lat,long: "+lat+", "+lng);
        callback(lat,lng);
      } else {
        console.log("Geocode was not successful for the following reason: " + status);
        callback(null,null);
      }
    });
}

var states = [
"Alabama",
"Alaska",
"American Samoa",
"Arizona",
"Arkansas",
"California",
"",
"Colorado",
"Connecticut",
"Delaware",
"District of Columbia",
"Florida",
"Georgia",
"Guam",
"Hawaii",
"Idaho",
"Illinois",
"Indiana",
"Iowa",
"Kansas",
"Kentucky",
"Louisiana",
"Maine",
"Maryland",
"Massachusetts",
"Michigan",
"Minnesota",
"Mississippi",
"Missouri",
"Montana",
"Nebraska",
"Nevada",
"New Hampshire",
"New Jersey",
"New Mexico",
"New York",
"North Carolina",
"North Dakota",
"Ohio",
"Oklahoma",
"Oregon",
"Pennsylvania",
"Puerto Rico",
"Rhode Island",
"South Carolina",
"South Dakota",
"Tennessee",
"Texas",
"Utah",
"Vermont",
"Virginia",
"Virgin Islands",
"Washington",
"West Virginia",
"Wisconsin",
"Wyoming"
];