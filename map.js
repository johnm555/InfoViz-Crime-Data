//http://archive.ics.uci.edu/ml/machine-learning-databases/communities/communities.data
var locations = [];
var geocoder;
var map;
var myHeatmap;
var myData;
var vis;
var scale, color;

function initialize(){
    console.log("map init");
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
            //console.log(data[0]);
            var count=0;
            function process(){
                count++;
                if (count<=2||1){                
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
            //info.splice(4,0,lat,lng);
            info.splice(0,0,name);
            locations.push({"name":name,"lat":lat,"lng":lng,data: info});
            console.log("line2: "+info);
            var txt="{";
            for (var i=0;i<info.length;i++){
                txt=txt+header[i]+":"+((typeof info[i]=="string")?'"'+info[i]+'"':info[i])+",";
            }
            txt=txt.substring(0,txt.length-1)+"},";
            console.log(txt);
            $("#data-box").html($("#data-box").html()+"<br/>\n"+txt);
            
            
            //addPieChart(locations[locations.length-1]);
            
            callback();
    });
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
    //console.log("state: "+states[state-1]);
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
var header = ["Location","state","county","community","communityname","lat","lng","fold","population","householdsize","racepctblack","racePctWhite","racePctAsian","racePctHisp","agePct12t21","agePct12t29","agePct16t24","agePct65up","numbUrban","pctUrban","medIncome","pctWWage","pctWFarmSelf","pctWInvInc","pctWSocSec","pctWPubAsst","pctWRetire","medFamInc","perCapInc","whitePerCap","blackPerCap","indianPerCap","AsianPerCap","OtherPerCap","HispPerCap","NumUnderPov","PctPopUnderPov","PctLess9thGrade","PctNotHSGrad","PctBSorMore","PctUnemployed","PctEmploy","PctEmplManu","PctEmplProfServ","PctOccupManu","PctOccupMgmtProf","MalePctDivorce","MalePctNevMarr","FemalePctDiv","TotalPctDiv","PersPerFam","PctFam2Par","PctKids2Par","PctYoungKids2Par","PctTeen2Par","PctWorkMomYoungKids","PctWorkMom","NumIlleg","PctIlleg","NumImmig","PctImmigRecent","PctImmigRec5","PctImmigRec8","PctImmigRec10","PctRecentImmig","PctRecImmig5","PctRecImmig8","PctRecImmig10","PctSpeakEnglOnly","PctNotSpeakEnglWell","PctLargHouseFam","PctLargHouseOccup","PersPerOccupHous","PersPerOwnOccHous","PersPerRentOccHous","PctPersOwnOccup","PctPersDenseHous","PctHousLess3BR","MedNumBR","HousVacant","PctHousOccup","PctHousOwnOcc","PctVacantBoarded","PctVacMore6Mos","MedYrHousBuilt","PctHousNoPhone","PctWOFullPlumb","OwnOccLowQuart","OwnOccMedVal","OwnOccHiQuart","RentLowQ","RentMedian","RentHighQ","MedRent","MedRentPctHousInc","MedOwnCostPctInc","MedOwnCostPctIncNoMtg","NumInShelters","NumStreet","PctForeignBorn","PctBornSameState","PctSameHouse85","PctSameCity85","PctSameState85","LemasSwornFT","LemasSwFTPerPop","LemasSwFTFieldOps","LemasSwFTFieldPerPop","LemasTotalReq","LemasTotReqPerPop","PolicReqPerOffic","PolicPerPop","RacialMatchCommPol","PctPolicWhite","PctPolicBlack","PctPolicHisp","PctPolicAsian","PctPolicMinor","OfficAssgnDrugUnits","NumKindsDrugsSeiz","PolicAveOTWorked","LandArea","PopDens","PctUsePubTrans","PolicCars","PolicOperBudg","LemasPctPolicOnPatr","LemasGangUnitDeploy","LemasPctOfficDrugUn","PolicBudgPerPop","ViolentCrimesPerPop"];