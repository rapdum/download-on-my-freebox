
// --------------------------------------- helper ------------------------------------
var xhInfo;
function update()
{
	console.log("updating info");
	xhInfo = new XMLHttpRequest();
	xhInfo.open("GET", buildURL("downloads/"), true);  
	xhInfo.setRequestHeader("X-Fbx-App-Auth", localStorage["session_token"]);
	xhInfo.onreadystatechange = buildInfo;
	xhInfo.send();
}
function sendControl(action, id, type) {
	var xhControl = new XMLHttpRequest();
	if (action == "remove")
	{
		xhControl.open("DELETE", buildURL("downloads/" + id), false);  
		xhControl.setRequestHeader("X-Fbx-App-Auth", localStorage["session_token"]);
		xhControl.send();
	}
	else
	{
		var params = '{"status": "' + action +'"}';
		xhControl.open("PUT", buildURL("downloads/" + id), false);  
		xhControl.setRequestHeader("X-Fbx-App-Auth", localStorage["session_token"]);
		xhControl.send(params);
	}
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
	show("downloading,stopped");
	menu("encours");
}

function show_termines()
{
	show("done,seeding");
	menu("termines");
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
	
	var filter = localStorage["filter"];
	if (!filter) show("done,seeding");
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
	else if (file.status == "stopped"){
		cmd="downloading";
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
	if (xhInfo.readyState != 4) /* 4 : état "complete" */
			{return;}
	   if (xhInfo.status == 200) /* 200 : code HTTP pour OK */
	    {
		var res = JSON.parse( xhInfo.responseText );
		var size = 0;
		var activeCount = 0;
		var downloadCount = 0;
		var active = "";
		for (i in res.result){
			var file = res.result[i];
			
			if (localStorage["filter"].indexOf(file.status)>=0){
				//console.log(file);
				if (file.name.length > size) size = file.name.length;
				var finished = 0;
				if (file.size != 0){
					finished = file.rx_pct / 100;
				}
				
				if(file.rx_rate > 0) {
					temps = secondsToTime(file.eta);
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