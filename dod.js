function oncityclick(data){
    if (data.state != zoomedidx){
        var statedata;
        for (var i=0;i<us_lowres.length;i++){
            if (us_lowres[i].name==states[data.state-1]){
                statedata = us_lowres[i];
                break;
            }
        }
        zoomState(statedata);
    }

    var loc = data.Location;
    var names = loc.split(", ");
    $(".city-state").html(loc);
}