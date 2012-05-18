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

function translateErrorCode(code,def)
{
	if (code == 1 ) return "Veuillez saisir un mot de passe correct dans les options du plugin";
	if (code == 101) return "La freebox n'est pas joignable";
	return def;
}


function login( pass ){
  
  var params = "login=freebox&passwd=" + encodeURIComponent(pass);
  var xh = new XMLHttpRequest();
  xh.open("POST", "http://mafreebox.freebox.fr/login.php", false);
  xh.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xh.setRequestHeader("X-Requested-With","XMLHttpRequest");
  
  var result=new Object();
  result.result = false;
  
  try{
  	xh.send(params);
    if (xh.readyState == 4) 
    {
       if (xh.status == 200)
       {      
       		var jsondata=eval("("+xh.responseText+")");
       		jsondata.error = translateErrorCode(jsondata.errcode);
			return jsondata;
	   }  
	   result.error = translateErrorCode(xh.status, xh.statusText);
    }
    }
    catch(err)
    {
    	result.error=translateErrorCode(err.code,err);
    }
    return result;
}

function getMethod(url){

  if( isTorrent(url))
  	return  "download.torrent_add";
  else
     return  "download.http_add";
}

function dispatchTorrent(url, callbackTorrent, callbackHttp){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.overrideMimeType('text/plain; charset=x-user-defined');
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 3) {
			console.log(xhr);
			if (xhr.getResponseHeader("Content-Type") == "application/x-bittorrent") {
				xhr.abort();
				callbackTorrent(url);
				}
			else{
				xhr.abort();
				callbackHttp(url);	
			}
		}
	}
	xhr.send(null);
}

function getFilename(url)
{
	var arr = url.split("/");
	return arr.pop();
}

function onClick(info, tab) {
	download(info.linkUrl);
}

function download(url){

  	var pass = localStorage["freebox_password"];

  	// check if we are correctly log we need a cookie to send download request
  	res = login(pass);
  	if (res.result == false){
  		alert(res.error);
  		return;
  	}
  	
  	if( url.substr(0,7) == "magnet:")
  		downloadMagnet(url);
  	else
		dispatchTorrent(url, downloadTorrent, downloadHTTP);
		
}

function downloadMagnet(url){
	var params = "url=" + encodeURIComponent(url) + "&user=freebox" + "&method=download.torrent_add";
    var xh = new XMLHttpRequest();
  	xh.open("POST", "http://mafreebox.freebox.fr/download.cgi", false);  
  	xh.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  	xh.setRequestHeader("X-Requested-With","XMLHttpRequest");
  	xh.send(params);
	if (xh.readyState == 4){
    	if (xh.status == 200){
           	var filename = getFilename(url);
			notif('img/down.png', 'D\351marrage du torrent  :', filename, 7000);
			checkFinished();
        }
    }
}

function downloadHTTP(url){
	var params = "url=" + encodeURIComponent(url) + "&user=freebox" + "&method=download.http_add";
    var xh = new XMLHttpRequest();
  	xh.open("POST", "http://mafreebox.freebox.fr/download.cgi", false);  
  	xh.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  	xh.setRequestHeader("X-Requested-With","XMLHttpRequest");
  	xh.send(params);
	if (xh.readyState == 4){
    	if (xh.status == 200){
           	var filename = getFilename(url);
			notif('img/down.png', 'D\351marrage du fichier  :', filename, 7000);
			checkFinished();
        }
    }
}


function downloadTorrent (url) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.overrideMimeType('text/plain; charset=x-user-defined');
	xhr.responseType = "arraybuffer";
	
	xhr.onload = function(ev) {
		if(typeof(window.BlobBuilder) === "undefined")
			BlobBuilder = window.WebKitBlobBuilder;
	    var blob = new BlobBuilder();
	    blob.append(xhr.response);
	    
		encodeTorrent(blob.getBlob(), function (data, torrent) {
					uploadTorrent(data, torrent);
					})
	};
	
	xhr.send(null);
}

function parseTorrent (file, callback) {
//function that gonna parse torrent in order to build a info object
	infoReader = new FileReader();
	infoReader.onload = function (ev) {
		var delo = new Worker('js/bencode.js');
		delo.onmessage = function(event) {  
			callback(event.data);
		}; 
		delo.postMessage(infoReader.result); 
	}
	infoReader.readAsBinaryString(file);
}

function encodeTorrent (file, callback) {
	//check if everything is ok we have a torrent,
	parseTorrent(file, function (torrent) {
		if (torrent != null) {
			//encode data that gonna be transmited
			var reader = new FileReader();
			reader.onload = function (ev) {
				var data = reader.result.replace("data:application/x-bittorrent;base64,", "").replace("data:base64,", "");
				callback(data, torrent);
			}
			reader.readAsDataURL(file);
		}else{
			alert("This file isn't torrent!");
		}
	})
}

function uploadTorrent (data, torrent) {
	//send everything
	var xhr = new XMLHttpRequest();
	xhr.open('POST', "http://mafreebox.freebox.fr:9091/transmission/rpc", true, "freebox", localStorage["freebox_password"]);
	xhr.setRequestHeader('X-Transmission-Session-Id', localStorage.sessionId);
	xhr.send('{ "arguments": { "metainfo": "' + data + '" }, "method": "torrent-add" }');
	xhr.onreadystatechange = function () {
	    if (xhr.readyState === 4) {
	    	if (xhr.status == 200){
				notif('img/down.png', 'D\351marrage du t\351l\351chargement  :', torrent.info.name, 7000);
				checkFinished();
        	}  
	    }
	};

}



  