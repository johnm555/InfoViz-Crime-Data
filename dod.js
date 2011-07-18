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
    selectedcity = data.Location;
    zoomeddots.render();
    
    var loc = data.Location;
    var names = loc.split(", ");
    $(".city-state").html(loc);
	
	var pc1Array = new Array();
	pc1Array[0] = data.racePctBlack;
	pc1Array[1] = data.racePctWhite;
	pc1Array[2] = data.racePctAsian;
	pc1Array[3] = data.racePctHisp;
	pc1Array[4] = .02;
	var cleared = false;
	while(!cleared)
	{
		pc1Array=debug(pc1Array);
		cleared = true;
		for(var i = 0; i < pc1Array.length; i++)
		{
			for(var j = 0; j < i; j++)
			{
				if(parseFloat(pc1Array[i])==parseFloat(pc1Array[j]))
				{
					cleared = false;
				}
			}
		}
	}
	pc1Array=normalize(pc1Array);
	
	$("#pie1").empty();
	var pc1=new pv.Panel().canvas(document.getElementById("pie1")).width(300).height(150);
	pc1.add(pv.Wedge)
	.data(pc1Array)
	.bottom(75)
	.left(75)
	.outerRadius(70)
	.angle(function(d) {return d * 2 *Math.PI;})
	.fillStyle(pv.colors("red", "yellow", "blue", "green", "purple"))
	.strokeStyle("black");

	var chartNames = ["African American","Caucasian","Asian","Hispanic","Other"];
	var chartColors = ["#ff0000","#ffff00","#0000ff","#008000","#800080"];
	
	pc1.add(pv.Dot)
	.data(chartNames)
	.right(100)
	.top(function() {return this.index * 12 + 25})
	.strokeStyle(null)
	.fillStyle(function() {return chartColors[this.index];})
	.anchor("right").add(pv.Label);
	
	var bg1Array = new Array();
	bg1Array[0] = data.racePctBlack;
	bg1Array[1] = data.racePctWhite;
	bg1Array[2] = data.racePctAsian;
	bg1Array[3] = data.racePctHisp;
	bg1Array[4] = .02;
	$("#bar1").empty();
	
	var bg1=new pv.Panel().canvas(document.getElementById("bar1")).width(300).height(150);
	bg1.add(pv.Rule)
    .data(pv.range(0, 100001, 20000))
    .bottom(function(d) {console.log(d/20000 * 25 + 1);return d/20000 * 25 + 1;})
	.width(180)
	.strokeStyle("black")
	.add(pv.Label);
	
	bg1.add(pv.Bar)
	.data(bg1Array)
	.bottom(0)
	.width(20)
	.height(function(d) {return d * 125;})
	.left(function() {return this.index *  25 + 50;})
	.fillStyle(function() {return chartColors[this.index];});
	
	bg1.add(pv.Dot)
	.data(chartNames)
	.right(100)
	.top(function() {return this.index * 12 + 25})
	.strokeStyle(null)
	.fillStyle(function() {return chartColors[this.index];})
	.anchor("right").add(pv.Label);
	
	pc1.render();
	bg1.render();
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
	for(var i = 0; i < array.length; i++)
	{
		normalized[i] = normalizer * array[i];
	}

	return normalized;
}

function debug(array)
{
	var debugged = array.slice(0);
	var exists = false;
	for(var i = 0; i < array.length; i++)
	{
		exists = false;
		for(var j = 0; j < i; j++)
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
			debugged[i] = parseFloat(array[i]) + .0001;
		}
	}
	return debugged;
}