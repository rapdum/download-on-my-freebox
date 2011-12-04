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

 


function getMethod(url){

  if( isTorrent(url))
  	return  "download.torrent_add";
  else
     return  "download.http_add";
}

function dispatchTorrent( url)
{
	function onTimeout(){
		xhr.abort();
		downloadFreeTorrent(url);
	};
	
	var xhr = new XMLHttpRequest();
	xhr.open('POST', freeboxUrl + ":9091/transmission/rpc", true, "freebox", localStorage["freebox_password"]);
	xhr.setRequestHeader('X-Transmission-Session-Id', localStorage.sessionId);
	xhr.send();
	xhr.onreadystatechange = function () {
	    if (xhr.readyState === 4) {
	    	if (xhr.status == 200){
				clearTimeout(timeout);
				downloadTransmissionTorrent( url );
        	}  
	    }
	};
	
	var timeout=setTimeout(onTimeout,1000);
}
function dispatchDownload(url){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.overrideMimeType('text/plain; charset=x-user-defined');
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 3) {
			console.log(xhr);
			if (xhr.getResponseHeader("Content-Type") == "application/x-bittorrent") {
				xhr.abort();
				dispatchTorrent(url);
				}
			else{
				xhr.abort();
				downloadFreeHTTP(url);	
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
  	
  	function cb(res){
	if (res.result == false){
  		alert(res.error);
  		
  	}else{
  	
		if( url.substr(0,7) == "magnet:")
			downloadFreeTorrent(url);
		else
			dispatchDownload(url);
	}
	}	
	login(pass,cb);
}



function downloadFree(url,method){
	var params = "url=" + encodeURIComponent(url) + "&user=freebox" + "&method=" + method;
    var xh = new XMLHttpRequest();
  	xh.open("POST", buildURL("/download.cgi"), false);  
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

function downloadFreeHTTP(url){
	downloadFree(url, "download.http_add");
}

function downloadFreeTorrent(url){
	downloadFree(url, "download.torrent_add");
}

function downloadTransmissionTorrent (url) {
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
	xhr.open('POST', freeboxUrl + ":9091/transmission/rpc", true, "freebox", localStorage["freebox_password"]);
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



  