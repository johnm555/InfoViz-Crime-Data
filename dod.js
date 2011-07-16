function oncityclick(data){
    if (data.state != zoomedidx){
        zoomState();
    }

    var loc = data.Location;
    var names = loc.split(", ");
    $(".city-state").html(loc);
}