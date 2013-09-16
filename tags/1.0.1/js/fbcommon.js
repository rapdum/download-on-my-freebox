/**
 * This file is part of the Download on my freebox project.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Raphaël Dumontier <rdumontier@gmail.com>, (C) 2010, 2011
 */
 
 //--------------Storage related-----------------------------------

var storage = chrome.storage.local;

// !!!!!!! Never redeclare conf variable
conf = getStorageConf();

function getStorageConf()
{
	if (typeof chrome.extension.getBackgroundPage().fb_conf === "undefined")
	{
		console.log("restoring conf")
		storage.get({conf:{}}, function(items) {
		tmpconf = items.conf;
		conf = tmpconf;
		chrome.extension.getBackgroundPage().fb_conf = conf;
		if (typeof tmpconf["app_token"] === "undefined") store_conf("app_token", "");
		if (typeof tmpconf["not_done"] === "undefined") store_conf("not_done", "");
		if (typeof tmpconf["freebox_display_popup"] === "undefined") store_conf("freebox_display_popup", true);
		store_conf("use_remote", false);
		
		});
	}
	return chrome.extension.getBackgroundPage().fb_conf;
}

function store_conf(name,value)
{
	var conf = chrome.extension.getBackgroundPage().fb_conf
	conf[name] = value;
	storage.set({"conf": conf});
}

function erase_conf(cb) {
	remove_cookie();
	chrome.storage.local.clear(cb);
	conf.filter = "" ;
	conf.current_menu = "" ;
	conf.not_done = "" ;
	conf.app_token = "" ;
	conf.session_token = "" ;
	conf.freebox_url = "" ;
	conf.restore_count = 0;
	conf.track_id = "" ;
	conf.freebox_display_popup = true ;
	conf.use_remote = false;
}

//--------------  -----------------------------------

var CODE_PHRASE = "Download on my freebox is neat";

function remove_cookie()
{
	chrome.cookies.getAll({}, function(cookies) {
		for(var i=0; i<cookies.length;i++) {
			if ( cookies[i].name === "FREEBOXOS")
			{
				console.log("Remove Freebox OS cookie");
				chrome.cookies.remove({ url: "http://" + cookies[i].domain + cookies[i].path, name: cookies[i].name});
			}
		}
	});
}

function buildURL(path)
{
	if (conf.use_remote) 
	{
		store_conf("freebox_url",  conf.remote_ip + ":" + conf.remote_port);
	}
	else
	{
		store_conf("freebox_url",  "mafreebox.freebox.fr");
	}
	var freeboxUrl="http://" + conf.freebox_url;
	var api = "/api/v1/"
	return  freeboxUrl + api + path;
}

function storeToken(val)
{	
	var cipheredPass = Aes.Ctr.encrypt(val, CODE_PHRASE, 256);
	store_conf("app_token", cipheredPass);
}

function getToken()
{
	var cipheredPass = conf["app_token"];
	return Aes.Ctr.decrypt(cipheredPass, CODE_PHRASE, 256);
}

function build_remote_conf()
{
	function encode_line(conf)
	{
		var url = conf.remote_access_ip + ":" +conf.remote_access_port;
		var decrypted = url + "|domf|" + conf["app_token"];
		var encrypted = Aes.Ctr.encrypt(decrypted, CODE_PHRASE, 256);
	}
	get_config(encode_line);
}

function setFBHeader(xhr)
{
	xhr.setRequestHeader("X-Fbx-App-Auth", conf["session_token"]);
}
function get_config( callback )
{
	var xhrconf = new XMLHttpRequest();
	console.log("Checking config");
	xhrconf.open('get', buildURL("connection/config/"), true);
	setFBHeader(xhrconf);
	xhrconf.send();
	xhrconf.onreadystatechange = function () {
	if (xhrconf.readyState != 4) return;
		if (xhrconf.status == 200){
			var conf = JSON.parse( xhrconf.responseText );
			if (typeof(callback)!=='undefined')
				get_download_config(conf.result, callback);
		}  
		else
		{
			callback(false);
		}
		  
	};
}

function get_download_config( config, callback )
{
	var xhrconf = new XMLHttpRequest();
	console.log("Checking download config");
	xhrconf.open('get', buildURL("downloads/config/"), true);
	setFBHeader(xhrconf);
	xhrconf.send();
	xhrconf.onreadystatechange = function () {
	if (xhrconf.readyState != 4) return;
		if (xhrconf.status == 200){
			var conf = JSON.parse( xhrconf.responseText );
			if (typeof(callback)!=='undefined')
				config.download = conf.result 
				callback(config);
		}  
		else
		{
			callback(false);
		}
		  
	};
}
function get_session(callback, use_remote)
{
	// if(typeof(changeUrl)==='undefined') store_conf("use_remote", false);
	if (!conf.app_token)
	{	
		callback(false);
		return;
	}
	xhr = new XMLHttpRequest();
	var url = buildURL("login/");
	console.log("Checking session on " + url);
	xhr.open('get', url, true);
	setFBHeader(xhr);
	xhr.send();
	var challenge;
	//var retry = 2;
	function onTimeout(){
		console.log("checkFinished timeout");
		xhr.abort();
		store_conf("use_remote",  true);
		if (!use_remote)
			get_session(callback, true);
	};
	var timeout=setTimeout(onTimeout,1000);	
	
	xhr.onreadystatechange = function () {
	
	if (xhr.readyState != 4) return;
	if (xhr.status == 0){
			clearTimeout(timeout);
			store_conf("use_remote",  true);
			if (!use_remote)
				get_session(callback, true);
		}  
		else if (xhr.status == 200){
			clearTimeout(timeout);
			var res = JSON.parse( xhr.responseText );
			challenge = res.result.challenge;
			if ( res.result.logged_in == false)
			{
				console.log("Not loggedin.");
				retrieve(challenge, callback);
			}
			else
			{
				console.log("Already loggedin");
				if (typeof(callback)!=='undefined')
					callback(true);
			}
		}  
			
	};
	function retrieve(challenge, callback)
	{
		var xhr = new XMLHttpRequest();
		console.log("Ask for new session " );
		
		var hash = CryptoJS.HmacSHA1(challenge, conf["app_token"]);
		
		remove_cookie();
		xhr.open('POST', buildURL("login/session/"), false);
		xhr.onreadystatechange = function () {
			if (xhr.readyState != 4) return;
				if (xhr.status == 200){
					var res = JSON.parse( xhr.responseText );
					session_token = res.result.session_token;
					store_conf("session_token", session_token);
					console.log("New session_token");
					if (typeof(callback)!=='undefined')
					callback(true);
				}
				if (xhr.status == 403){
					var res = JSON.parse( xhr.responseText );
					challenge = res.result.challenge;
					/*if (retry > 0)
					{
						retry -= 1;
						remove_cookie();
						retrieve(challenge, callback);
					}
					else
					{*/
						if (conf.use_remote)
							callback(false);
						else
						{
							store_conf("use_remote",  true);
							get_session(callback, true);
						}
				}  
				
		};
		
		xhr.send('{"app_id": "fr.freebox.domf", "password": "' + hash + '"}');
	}
}

function decode_dir(hash)
{
	var path = B64.decode(hash);
	//path = path.substring(1, path.length-3);
	return path;
}
function secondsToTime(sec0)
{
	var sec =sec0;
	var hr = Math.floor(sec / 3600);
	var min = Math.floor((sec - (hr * 3600))/60);
	sec -= ((hr * 3600) + (min * 60));
	sec += ''; 
	min += '';
	hr = (hr)?hr+'h':'';
	if(sec0 < 60) {
		return sec0+"s";
	}
	else {
		return hr + min + 'mn';
	}
}