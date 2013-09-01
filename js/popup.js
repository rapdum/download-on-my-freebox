
// --------------------------------------- helper ------------------------------------
var xhInfo;

function update()
{
	console.log("updating info");
	xhInfo = new XMLHttpRequest();
	xhInfo.open("GET", buildURL("downloads/"), true);  
	setFBHeader(xhInfo);
	xhInfo.onreadystatechange = buildInfo;
	xhInfo.send();
}
function sendControl(action, id, type) {
	var xhControl = new XMLHttpRequest();
	if (action == "remove")
	{
		xhControl.open("DELETE", buildURL("downloads/" + id), false);  
		setFBHeader(xhControl);
		xhControl.send();
	}
	else
	{
		var params = '{"status": "' + action +'"}';
		xhControl.open("PUT", buildURL("downloads/" + id), false);  
		setFBHeader(xhControl);
		xhControl.send(params);
	}
	update();
}

//------------------------------------------------------------- call from html ------------------------------

function show(status)
{
	console.log(status);
	store_conf("filter", status, buildInfo);
}

function show_encours()
{
	store_conf("current_menu", "encours");
	show("downloading,stopping,stopped,error");
}

function show_termines()
{
	store_conf("current_menu", "termines");
	show("done,seeding");
}

function on_login_result(loggedin)
{
	if (loggedin) update();
}

function onload()
{	
	document.getElementById("encours").addEventListener("click",show_encours);
	document.getElementById("termines").addEventListener("click",show_termines);
	var select = document.getElementById("options");
	url = chrome.extension.getURL("options.html");
	msg = "<a target='_blank' href='"+ url +"'>Options</a>" ;
	select.innerHTML = msg;
	if (!conf.filter) show("done,seeding");
	get_session(update);
	setInterval(update,3000);
}



//---------------------------------------------- Presentation ------------------------------------------------

function buildControl(file, listeners){
	//listeners will store parameter needed for future callbacks
	var cmd = "";
	var img = "";
	if (file.status == "downloading"){
		cmd="stopped";
		img="img/stop.png";
	}
	else if (file.status == "seeding"){
		cmd="stopped";
		img="img/stop.png";
	}
	else if (file.status == "stopped"){
		cmd="downloading";
		img="img/start.png";
	}
	else if (file.status == "error"){
		cmd="retry";
		img="img/retry.png";
	}
	else if (file.status == "done" && file.rx_pct==10000){
		cmd="seeding";
		img="img/retry.png";
	}
	else{
		cmd="remove";
		img="img/remove.png";
	}
	var html =''
	if ("stopping".indexOf(file.status)<0 && (file.tx_pct< 10000 || file.rx_pct< 10000) ){
		id = cmd + file.id;
		html += '<a href="" id="' + id + '">';
		listeners.push([id, cmd, file.id, file.type] );
		html +=  "<img src='" + img + "' /></a>";
	}
	id = "remove" + file.id;
	html += '<a href="" id="' + id + '">';
	html +=  "<img src='img/remove.png' /></a>";
	listeners.push([id, "remove", file.id, file.type] );
	
	return html;
}

function buildInfo(){
	
	//var selectseed = document.getElementById("seedbox");
	//selectseed.href=buildURL("/download.php");
	var listeners = [];
	if (xhInfo.readyState != 4) 
			{return;}
	   if (xhInfo.status == 200) 
	    {
		var res = JSON.parse( xhInfo.responseText );
		var size = 0;
		var activeCount = 0;
		var downloadCount = 0;
		var active = "";
		for (i in res.result){
			var file = res.result[i];
			
			if (conf.filter.indexOf(file.status)>=0){
				//console.log(file);
				if (file.name.length > size) size = file.name.length;
				var finished = 0;
				if (file.size != 0){
					finished = file.rx_pct / 100;
				}
				var finished_up = 0;
				if (file.size != 0){
					finished_up = file.tx_pct / 100;
				}
				var temps = "";
				if(file.rx_rate > 0) {
					temps = secondsToTime(file.eta);
				} 
				var filePath = "file://FREEBOX/" + decode_dir( file.download_dir ) + file.name;
				
				if ( file.rx_rate > 1000000 ){
					speed = Math.round(100 * file.rx_rate / 1000000) / 100 + " Mo/s";
				}else{
					speed = Math.round(file.rx_rate / 1000) + " Ko/s";
				}
				if ( file.tx_rate > 1000000 ){
					speed_up = Math.round(100 * file.tx_rate / 1000000) / 100 + " Mo/s";
				}else{
					speed_up = Math.round(file.tx_rate / 1000) + " Ko/s";
				}
				active += "<tr>";
					active += "<td><a class='titre_dl' title=\"" + file.name + "\">" + file.name + "</a> </td>";
				active += '</tr>';
				active += "<tr>";
				
				active += "<td><a class='path_dl' >" + filePath + "</a> </td>";
				active += '</tr>';
				active += '<tr>';
				if (file.status === "error"){
					active += '<td align="left"> Erreur : ' + file.error +"</td>";
				}
				else
				{
					active += '<td align="left"> D: ';
					if (file.rx_pct == 10000)
					{
						active += "Termin&eacute;";
					}
					else
					{
						active += finished + "% "
						if (file.status != "stopped"){
							active += "(" + speed + ") " + temps;
						}
						else{
							active += "(pause)";
						}
					}
					active +="  -  U: ";
					if (file.tx_pct >= 10000 )
					{
						active += "Termin&eacute;";
					}
					else
					{
						active += finished_up + "%"
						if (file.tx_rate != 0){
							active += "(" + speed_up + ")" ;
						}
						if (file.status == "done")
						{
							active += "(pause)" ;
						}
					}
					active += "</td>";
				}
				active += '<td align="right" width="35">' + buildControl(file, listeners) + '</td>';
				active += '</tr>';
				active += '<tr>';
					active += "<td colspan='5' class='td_dl_bas'><div class='dl_fond'><div class='dl_bar' style='width: "+finished+"%;'></div></div><div class='dl_fond'><div class='dl_bar_up' style='width: "+finished_up+"%;'></div></div></td>";
				active += '</tr>';
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
		document.getElementById(conf["current_menu"]).className = "menu_actif";
		
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
	if (xhInfo.status == 403){
		var select = document.getElementById("bots");
		url = chrome.extension.getURL("options.html");
		msg = "Veuillez v&eacute;rifier les parametres de configurations:";
		msg += "<br>"
		msg += "<a target='_blank' href='"+ url +"'>Options</a>" ;
		select.innerHTML = msg;
		}
}
window.addEventListener("load", onload);