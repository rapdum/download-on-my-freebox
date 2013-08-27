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
 
 // ------------------------------------- ----------------------------------------------

var freeboxUrl = buildURL("");
var CODE_PHRASE = "Download on my freebox is neat";

console.log("Freebox URL :" + freeboxUrl);

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
	if (!localStorage["freeboxUrl"]) 
		localStorage["freeboxUrl"] = "mafreebox.freebox.fr";
	freeboxUrl = "http://" + localStorage["freeboxUrl"] ;
	if (freeboxUrl === "http://" ) 
		freeboxUrl="http://mafreebox.freebox.fr";
	var api = "/api/v1/"
	return  freeboxUrl + api + path;
}

function storeToken(val)
{	
	var cipheredPass = Aes.Ctr.encrypt(val, CODE_PHRASE, 256);
	localStorage["app_token"] = cipheredPass;
}

function getToken()
{
	var cipheredPass = localStorage["app_token"];
	return Aes.Ctr.decrypt(cipheredPass, CODE_PHRASE, 256);
}

function build_remote_conf()
{
	function encode_line(conf)
	{
		var url = conf.remote_access_ip + ":" +conf.remote_access_port;
		var decrypted = url + "|domf|" + localStorage["app_token"];
		var encrypted = Aes.Ctr.encrypt(decrypted, CODE_PHRASE, 256);
	}
	get_config(encode_line);
}
function get_config( callback )
{
	var xhrconf = new XMLHttpRequest();
	console.log("Checking config");
	xhrconf.open('get', buildURL("connection/config/"), true);
	xhrconf.setRequestHeader("X-Fbx-App-Auth", localStorage["session_token"]);
	xhrconf.send();
	xhrconf.onreadystatechange = function () {
	if (xhrconf.readyState != 4) return;
		if (xhrconf.status == 200){
			var conf = JSON.parse( xhrconf.responseText );
			if (typeof(callback)!=='undefined')
				callback(conf.result);
		}  
		else
		{
			callback(false);
		}
		  
	};
}
function get_session(callback)
{
	xhr = new XMLHttpRequest();
	console.log("Checking session");
	xhr.open('get', buildURL("login/"), true);
	xhr.setRequestHeader("X-Fbx-App-Auth", localStorage["session_token"]);
	xhr.send();
	var challenge;
	var retry = 2;
	xhr.onreadystatechange = function () {
	if (xhr.readyState != 4) return;
		if (xhr.status == 200){
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
		console.log("Ask for new session with : " );
		console.log("  - app_token : " + localStorage["app_token"]);
		console.log("  - challenge : " + challenge);
		
		var hash = CryptoJS.HmacSHA1(challenge, localStorage["app_token"]);
		console.log("  --> hash : " + hash);
		
						remove_cookie();
		xhr.open('POST', buildURL("login/session/"), true);
		xhr.send('{"app_id": "fr.freebox.domf", "password": "' + hash + '"}');
		xhr.onreadystatechange = function () {
			if (xhr.readyState != 4) return;
				if (xhr.status == 200){
					var res = JSON.parse( xhr.responseText );
					console.log(res);
					session_token = res.result.session_token;
					localStorage["session_token"] = session_token;
					console.log("New session_token : " + session_token);
					if (typeof(callback)!=='undefined')
					callback(true);
				}
				if (xhr.status == 403){
					var res = JSON.parse( xhr.responseText );
					challenge = res.result.challenge;
					if (retry > 0)
					{
						retry -= 1;
						remove_cookie();
						retrieve(challenge, callback);
					}
					else
					{
						callback(false);
					}
				}  
				
		};
	}
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