var imgok = "img/ok.png";
var imgnok = "img/nok.png";
var encrypt = 'Download on my freebox is neat';
var track_id;

function loginCB(ok)
{
	var select = document.getElementById("Check");
	var err = document.getElementById("err");
	if (ok)
	{
		select.src = imgok;
	}
	else
	{
		select.src = imgnok;
	}
}


function checkPassword(){
	get_session( loginCB );
	build_remote_conf();
}

	

function requestAppToken(){
  
	console.log("Verification des nouvelles API");
	var xhr = new XMLHttpRequest();
	xhr.open('POST', buildURL("login/authorize/"), true);
	xhr.send('{"app_id": "fr.freebox.domf", "app_name": "Download on my freebox","app_version": "0.8.0","device_name": "Chrome"}');
	var app_token ="";
	xhr.onreadystatechange = function () {
	    if (xhr.readyState != 4) return;
	    	if (xhr.status == 200){
				var res = JSON.parse( xhr.responseText );
				app_token = res.result.app_token;
				track_id=res.result.track_id;
				console.log("Waiting to be accepted");
        	}
	    	if (xhr.status == 401){
        	}  
	};
	var refreshIntervalId;
	function checkAcceptance()
	{
		xhr = new XMLHttpRequest();
		xhr.open('get', buildURL("login/authorize/"+track_id), true);
		xhr.send();

		xhr.onreadystatechange = function () {
		if (xhr.readyState != 4) return;
			if (xhr.status == 200){
				var res = JSON.parse( xhr.responseText );
				display_registration(res.result.status);
				if ( res.result.status != "pending")
				{
					clearInterval(refreshIntervalId);
					if ( res.result.status == "granted" )
					{
						select = document.getElementById("token");
						select.value = app_token;
						localStorage["app_token"] = app_token;
						localStorage["track_id"] = track_id;
						get_session();
						
					}
					else
					{
						select = document.getElementById("token");
						select.value = "";
						localStorage["app_token"] = "";
						localStorage["track_id"] = "";
					}
					console.log("Application " + res.result.status);
				}
			}  
		};
	}
	refreshIntervalId = setInterval(checkAcceptance, 1000);
}

function display_registration(status)
{	
	select = document.getElementById("registration_status");
	if (status == "pending")
	{
		document.getElementById("btn_register").disabled = true;
		select.innerText = "Veuillez accepter sur le freebox Server...";
		return;
	}
	document.getElementById("btn_register").disabled = false;
	select.innerText = status;

}

function save_options() {
  select = document.getElementById("display_popup");
  localStorage["freebox_display_popup"] = select.checked;
  select = document.getElementById("url");
  if (select.value != "")
  {
	localStorage["freeboxUrl"] = select.value;
  }
  else 
  {
	localStorage["freeboxUrl"] = "mafreebox.freebox.fr";
  }
  console.log(localStorage["freeboxUrl"]);
  select = document.getElementById("token");
  localStorage["app_token"] = select.value;
  checkPassword();
  
  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Sauvegard&eacute;es.";
  changeReasons();
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}
function changeReasons(){
	if (!localStorage["restore count"]) {
			localStorage["restore count"]=0;
		}
	phrases = ["Aujourd'hui, je me sens l'ame g&eacute;n&eacute;reuse :",
				"Envie d'un peu de m&eacute;c&eacute;nat :",
				"J'ai trop d'argent :",
				"Parce que le d&eacute;veloppeur a besoin de changer ses fenetres :",
				"Sans raison :",
				"J'ai trop d'argent :"];
	
	count = parseInt(localStorage["restore count"]);
	document.getElementById("reasons").innerHTML = phrases[count%phrases.length];
	localStorage["restore count"] = count + 1;
}
// Restores select box state to saved value from localStorage.
function restore_options() {
    changeReasons();
	document.getElementById("btn_save").addEventListener("click",save_options);
	document.getElementById("btn_register").addEventListener("click",requestAppToken);
  
  var display_popup = localStorage["freebox_display_popup"];
  if (!display_popup) 
  {
  		//setdefault
  		localStorage["freebox_display_popup"] = true;
  		display_popup = true;
  	}
  var select = document.getElementById("display_popup");
  console.log(display_popup);
  select.checked = (display_popup === 'true');
  
  select = document.getElementById("token");
  select.value = localStorage["app_token"];
  
  
  var url = localStorage["freeboxUrl"];
  if (!url) {
    return;
  }
  var select = document.getElementById("url");
  select.value = url;
  
  
  checkPassword();
}

window.addEventListener("load", restore_options);