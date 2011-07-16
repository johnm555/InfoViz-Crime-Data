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

    $("#dod").fadeIn('fast');
    
    var loc = data.Location;
    var names = loc.split(", ");
    $(".city-state").html(loc);
	
	var pc1Array = new Array();
	pc1Array[0] = data.racePctBlack;
	pc1Array[1] = data.racePctWhite;
	pc1Array[2] = data.racePctAsian;
	pc1Array[3] = data.racePctHisp;
	pc1Array[4] = .02;
	pc1Array=debug(pc1Array);
	pc1Array=normalize(pc1Array);
	
	$("#pie1").empty();
	var pc1=new pv.Panel().canvas(document.getElementById("pie1")).width(150).height(150);
	pc1.add(pv.Wedge)
	.data(pc1Array)
	.bottom(75)
	.left(75)
	.outerRadius(70)
	.angle(function(d) {return d * 2 *Math.PI;})
	.fillStyle(pv.colors("red", "yellow", "blue", "green", "purple"))
	.strokeStyle("black");
	pc1.render();
}

function normalize(array)
{

	var normalized = array.slice(0);
	var total = 0;
	for(i = 0; i < array.length; i++)
	{
		total += array[i];
	}
	
	var normalizer = 1 / total;
	for(i = 0; i < array.length; i++)
	{
		normalized[i] = normalizer * array[i];
	}

	return normalized;
}

function debug(array)
{
	var debugged = array.slice(0);
	var exists = false;
	for(i = 0; i < array.length; i++)
	{
		exists = false;
		for(j = 0; j < i; j++)
		{
			if(parseFloat(array[i])==parseFloat(array[j]))
			{
				exists = true;
			}
		}
		if(!exists)
		{
			debugged[i] = parseFloat(array[i]);
		}
		else
		{
			debugged[i] = parseFloat(array[i]) + .00001;
		}
	}
	return debugged;
}