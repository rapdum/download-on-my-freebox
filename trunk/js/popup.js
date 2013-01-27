
// --------------------------------------- helper ------------------------------------

function update()
{
	var path = "/download.cgi";
	var params = "method=download.list"+ "&csrf_token=" + localStorage["token"];
	
	sendRequest(path, params, "application/x-www-form-urlencoded", buildInfo);
}

function sendControl(action, id, type) {
	var path = "/download.cgi";
	var params = '{"jsonrpc":"2.0","method":"download.'+ action +'","params":["'+ type +'",' + id + '],"'+'csrf_token":"' + localStorage["token"]+'"}';
	
	function sendControlResult() { 
	   if (request.readyState == 4 && request.status == 200) {
    	console.log( request.responseText );
	}
	} 
	
	console.log(params);
	sendRequest(path, params, "application/json; charset=utf-8", sendControlResult);
	update();
}

//------------------------------------------------------------- call from html ------------------------------

function show(status)
{
	localStorage["filter"] = status;
	buildInfo();
}

function show_encours()
{
	show("running,paused");
	menu("encours");
}

function show_termines()
{
	show("done,seeding");
	menu("termines");
}

function onload()
{	
	
	document.getElementById("encours").addEventListener("click",show_encours);
	document.getElementById("termines").addEventListener("click",show_termines);
	function onLogin()
	{	
		setInterval(update,3000);
		var filter = localStorage["filter"];
		if (!filter) show("done,seeding");
		update();
		
	}
	update();
	//login(onLogin);
}



//---------------------------------------------- Presentation ------------------------------------------------

function buildControl(file, listeners){
	//listeners will store parameter needed for future callbacks
	var cmd = "";
	var img = "";
	if (file.status == "running"){
		cmd="stop";
		img="img/stop.png";
	}
	else if (file.status == "paused"){
		cmd="start";
		img="img/start.png";
	}
	else{
		cmd="remove";
		img="img/remove.png";
	}
	var html =''
	if ("done,seeding".indexOf(file.status)<0){
		id = cmd + file.id;
		html += '<a href="" id="' + id + '">';
		listeners.push([id, cmd, file.id, file.type] );
		//html += '<a href="" onclick=\'sendControl("'+ cmd + '", ' + file.id + ', "' +file.type +'");\'>';
		html +=  "<img src='" + img + "' /></a>";
	}
	id = "remove" + file.id;
	html += '<a href="" id="' + id + '">';
	html +=  "<img src='img/remove.png' /></a>";
	listeners.push([id, "remove", file.id, file.type] );
	//document.getElementById(id).addEventListener("click",sendControl,"remove",file.id, file.type);
	
	return html;
}

function buildInfo(){
	var selectseed = document.getElementById("seedbox");
	selectseed.href=buildURL("/download.php");
	var listeners = [];
	if (xh.readyState == 4 && xh.status == 200) {
		var res = JSON.parse( xh.responseText );
		var size = 0;
		var activeCount = 0;
		var downloadCount = 0;
		var active = "";
		for (i in res.result){
			var file = res.result[i];
			
			if (localStorage["filter"].indexOf(file.status)>=0){
			
				if (file.name.length > size) size = file.name.length;
				var finished = 0;
				if (file.size != 0){
					finished = Math.round(file.transferred / file.size * 100);
				}
				
				if(file.rx_rate > 0) {
					var reste_a_dl = file.size - file.transferred;
					var temps = Math.round(reste_a_dl / file.rx_rate);
					temps = secondsToTime(temps);
				}
				else {
					temps = "";
				}
				
				if (localStorage["filter"] != "done,seeding") {
				
					document.getElementById("encours").className = "menu_actif";
					if ( file.rx_rate > 1000000 ){
						speed = Math.round(100 * file.rx_rate / 1000000) / 100 + " Mo/s";
					}else{
						speed = Math.round(file.rx_rate / 1000) + " Ko/s";
					}
					active += "<tr>";
						active += "<td><a class='titre_dl' title=\"" + file.name + "\">" + file.name + "</a> </td>";
					active += '</tr>';
					active += '<tr>';
						if (file.status != "paused"){
							active += '<td align="left"> ' + finished + "% (" + speed + ") - " + temps +"</td>";
						} else {
							active += '<td align="left"> ' + finished + "% - pause</td>";
						}//active += '<td align="right" width="75"> ' + speed + "</td>";
						//active += '<td align="right" width="75"> ' + temps + "</td>";
						active += '<td align="right" width="35">' + buildControl(file, listeners) + '</td>';
					active += '</tr>';
					active += '<tr>';
						active += "<td colspan='5' class='td_dl_bas'><div class='dl_fond'><div class='dl_bar' style='width: "+finished+"%;'></div></div></td>";
					active += '</tr>';
				}
				else {
				
					document.getElementById("termines").className = "menu_actif";
					active += "<tr>";
						active += "<td class='td_dl_termine'>" + file.name + ' </td>'
						active += '<td align="right" width="20">' + buildControl(file, listeners) + '</td>';
					active += "</tr>";
				}
			}
			if ("done,seeding".indexOf(file.status)>=0)  
					downloadCount +=1;
			else
					activeCount += 1;
			
		}
		active = '<center><table width="100%">'+active;
		active += "</table></center>";
		var encours = document.getElementById("encours");
		encours.innerHTML = "En cours(" + activeCount +")";
		
		var termines = document.getElementById("termines");
		termines.innerHTML = "T&eacute;l&eacute;charg&eacute;s(" + downloadCount +")";
		
		var select = document.getElementById("bots");
		select.innerHTML=active;
		
		//register click listener
		for (var i = 0; i < listeners.length; i++) {
			params = listeners[i];
			btn = document.getElementById(params[0]);
			btn.cmd = params[1];
			btn.file = params[2];
			btn.typ = params[3];
			btn.addEventListener("click",function(e) {
				sendControl(e.currentTarget.cmd,e.currentTarget.file,e.currentTarget.typ);
			});
		};
		
	}
}
window.addEventListener("load", onload);