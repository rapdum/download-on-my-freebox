var imgok = "img/ok.png";
var imgnok = "img/nok.png";
var encrypt = 'Download on my freebox is neat';
var track_id;
var fb_config;

function check_freebox(ok)
{
	var select = document.getElementById("Check");
	if (ok)
	{
		select.src = imgok;
		document.getElementById("register_div").style.display = "none";
		get_config(check_remote_config);
	}
	else
	{
		document.getElementById("register_div").style.display = "block";
		document.getElementById("freebox_status").style.display = "none";
		document.getElementById("generate_div").style.display = "none";
		
		select.src = imgnok;
		document.getElementById("remoteCheck").src = imgnok;
	}
}

function check_remote_config(config)
{
	var select = document.getElementById("remoteCheck");
	fb_config = config;
	
	store_conf( "remote_ip", config.remote_access_ip );
	store_conf( "remote_port", config.remote_access_port );
	
	var status="<table style=' background-color: #000000; color:#E8DC05; font-family: Verdana, Arial, Helvetica, sans-serif;font-size: 10px;'>";
	
	status += "<tr style=' background-color: #E8DC05; color:#000000;'><td colspan='2'> G&eacute;n&eacute;ral</td></tr>";
	
	status += "<tr><td>IP : </td><td>" +  config.remote_access_ip + "</td></tr>";
	status += "<tr><td>Acc&egrave;s distant : </td><td>";
	status += config.remote_access ? "Autoris&eacute;" : "Interdit";
	status += "</td></tr>";
	status += "<tr><td>Mot de passe : </td><td>";
	status += config.is_secure_pass ? "S&eacute;curis&eacute;" : "Ne respecte pas les regles pour l'acces distant";
	status += "</td></tr>";
	status += "<tr><td>Utilisation des api : </td><td>";
	status += config.api_remote_access ? "Autoris&eacute;" : "Interdit";
	status += "</td></tr>";
	status += "<tr><td>URL distant : </td><td>" + config.remote_access_ip + ":"+config.remote_access_port + "</td></tr>";
	
	status += "<tr style=' background-color: #E8DC05; color:#000000;'><td colspan='2'> Downloads</td></tr>";
	status += "<tr><td>R&eacute;pertoire par d&eacute;faut : </td><td>" +  decode_dir( config.download.download_dir ) + "</td></tr>";
	status += "<tr><td>Nb t&acirc;ches max: </td><td>" +  config.download.max_downloading_tasks + "</td></tr>";
	var surv = config.download.use_watch_dir ? decode_dir( config.download.watch_dir ) : "Inactif";
	status += "<tr><td>R&eacute;pertoire surveill&eacute;: </td><td>" + surv  + "</td></tr>";
	status += "</table>";
	document.getElementById("freebox_status").style.display = "block";
	document.getElementById("generate_div").style.display = "block";
	document.getElementById("freebox_status").innerHTML = status;
		
	if (config.is_secure_pass && config.remote_access && config.api_remote_access)
	{
		select.src = imgok;
	}
	else
	{
		select.src = imgnok;
	}
}

function genrate_remote_conf()
{
	var url = fb_config.remote_access_ip + ":" +fb_config.remote_access_port;
	var decrypted = url + "|domf|" + conf["app_token"];
	var pass = document.getElementById('password').value;
	var encrypted = (pass == "") ? "" : Aes.Ctr.encrypt(decrypted, pass, 256);
	
	document.getElementById("generated_key").style.display = (pass == "") ? "none" : "block";
	document.getElementById('generated_key').innerText = encrypted;
}

function save_remote()
{
	var encrypted = document.getElementById("remote_key").value;
	var pass = document.getElementById("remote_password").value;
	if (encrypted == ""|| pass =="")
	{
		return;
	}
	var decrypted = Aes.Ctr.decrypt(encrypted, pass, 256);
	var dsplit = decrypted.split('|domf|');
	var app_token=dsplit[1];
	store_conf("app_token", app_token);
	var urlandport = dsplit[0].split(":");
	store_conf("remote_ip", urlandport[0]);
	store_conf("remote_port", urlandport[1]);
	check_plugin_configuration();
}

function check_plugin_configuration(){
	get_session( check_freebox )
}

function erase_all()
{
	console.log("erasing conf");
	erase_conf(restore_options);
}

function requestAppToken(){
	store_conf("freebox_url",  "mafreebox.freebox.fr");
	console.log("App token retrieval");
	var xhr = new XMLHttpRequest();
	xhr.open('POST', buildURL("login/authorize/"), true);
	xhr.send('{"app_id": "fr.freebox.domf", "app_name": "Download on my freebox","app_version": "0.8.0","device_name": "Chrome"}');
	var app_token ="";
	
	var refreshIntervalId;
	xhr.onreadystatechange = function () {
	    if (xhr.readyState != 4) return;
	    	if (xhr.status == 200){
				var res = JSON.parse( xhr.responseText );
				app_token = res.result.app_token;
				track_id=res.result.track_id;
				console.log("Waiting to be accepted");
				
				refreshIntervalId = setInterval(checkAcceptance, 1000);
        	}
	    	if (xhr.status == 401){
        	}  
	};
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
						store_conf("app_token", app_token);
						store_conf("track_id", track_id);
						check_plugin_configuration( );
					}
					else
					{
						select = document.getElementById("token");
						select.value = "";
						store_conf("app_token", "");
						store_conf("track_id", "");
					}
					console.log("Application " + res.result.status);
				}
			}  
		};
	}
}

function display_registration(status)
{	
	select = document.getElementById("registration_status");
	if (status == "pending")
	{
		document.getElementById("register_div").style.display = "none";
		document.getElementById("accept_photo").style.display = "block";
		select.innerText = "Veuillez accepter sur le freebox Server...";
		return;
	}
	document.getElementById("register_div").style.display= "block";
	document.getElementById("accept_photo").style.display= "none";
	select.innerText = status;
	setTimeout(function() {
		select.innerText = "";
	  }, 10000);

}

function changeReasons(){
	if (typeof conf.restore_count === "undefined") {
			store_conf("restore_count", 0);
		}
	phrases = ["Aujourd'hui, je me sens l'ame g&eacute;n&eacute;reuse :",
				"Envie d'un peu de m&eacute;c&eacute;nat :",
				"J'ai trop d'argent :",
				"Parce que le d&eacute;veloppeur a besoin de changer ses fenetres :",
				"Sans raison :",
				"J'ai trop d'argent :"];
	
	count = parseInt(conf["restore_count"]);
	document.getElementById("reasons").innerHTML = phrases[count%phrases.length];
	store_conf("restore_count", count + 1);
}
// Restores select box state to saved value from localStorage.
function on_display_popup_clicked()
{
	store_conf('freebox_display_popup', document.getElementById("display_popup").checked);
	inform("Options Sauvegard&eacute;es.");
}

function inform(msg)
{
	// Update status to let user know options were saved.
	  var status = document.getElementById("status");
	  status.innerHTML = msg;
	  setTimeout(function() {
		status.innerHTML = "";
	  }, 750);
}

function restore_options() {
	console.log("restore");
    changeReasons();
	document.getElementById("display_popup").addEventListener("click",on_display_popup_clicked);
	document.getElementById("btn_register").addEventListener("click",requestAppToken);
	document.getElementById("btn_register_slave").addEventListener("click", save_remote);
	document.getElementById("btn_erase_all").addEventListener("click",erase_all);
	document.getElementById("password").addEventListener("input",genrate_remote_conf);
	
	var display_popup = conf["freebox_display_popup"];
  
	var select = document.getElementById("display_popup");
	select.checked = (display_popup);
	check_plugin_configuration();
}

window.addEventListener("load", restore_options);