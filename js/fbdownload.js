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

// *******  call with rightclick on a URL  ****************************************
 
function onClick(info, tab) {
	download(info.linkUrl);
}

//******************** download mechanism *****************************************

function dispatchDownload(url){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.overrideMimeType('text/plain; charset=x-user-defined');
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 3) {
			console.log("Searching type of file to download"); 
			var torrentString = "d8:announce"; //in each torrent metafile
			if (xhr.response.substring(0, torrentString.length) === torrentString) {
				xhr.abort();
				downloadTorrent(url);
			}
			else{
				xhr.abort();
				downloadFile(url);	
			}
		}
	}
	xhr.send(null);
}

function getFilename(url)
{
	if( url.substr(0,7) == "magnet:")
	{
		var deb = url.indexOf("&dn=")+4;
		var fin = url.indexOf("&tr=")-deb;
		return url.substr(deb, fin);	
	}
	var arr = url.split("/");
	return arr.pop();
}


function download(url){

  	// todo : check if we are correctly log we need a cookie to send download request
	
		if( url.substr(0,7) == "magnet:")
			downloadFile(url);
		else
			dispatchDownload(url);
	
}

function downloadFile(url){
	var filename = getFilename(url);
	var params = "download_url=" + encodeURIComponent(url);
	var req = new XMLHttpRequest();
	req.open("POST", buildURL("downloads/add"), true);
	req.setRequestHeader("X-Fbx-App-Auth", localStorage["session_token"]);
  	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	
	console.log("trying to send:" + filename);
	// send url to freebox 
	req.onreadystatechange = function () {
	   if (req.readyState != 4) {return;}
	   if (req.status == 200) 
	   {
			var res = JSON.parse( req.responseText );
			if (res.success)
				notif('img/down.png', 'D\351marrage du t\351l\351chargement  :', filename, 7000);
				checkFinished();
		}
	}
	req.send(params);
}



function downloadTorrent (url) {
	
	console.log("Download Torrent");
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = "blob";
	console.log(url);
	
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4 && xhr.status === 200) {
		
			// try to get torrent filename
			
			if (xhr.getResponseHeader("Content-Disposition") != null)
			{
				header = xhr.getResponseHeader("Content-Disposition").toString();
				deb = header.indexOf("filename=");
				filename = header.substring(deb+10, header.length - 1 );
				console.log("retrieving " + filename);
			}
			else
			{
				// create a dummy name
				filename = "temp.torrent";
			}
			
			// get torrent file 
			
			blob = xhr.response;
			
			// create a form
			
			var form = new FormData();
			
			// append file to form
			
			form.append("download_file", blob, filename); 
			var req = new XMLHttpRequest();
			req.open("POST", buildURL("downloads/add"), true);
			req.setRequestHeader("X-Fbx-App-Auth", localStorage["session_token"]);
			
			// send form to freebox 
			
			req.onreadystatechange = function () {
			   if (req.readyState != 4) {return;}
			   if (req.status == 200) 
			   {
					var res = JSON.parse( req.responseText );
					if (res.success)
						notif('img/down.png', 'D\351marrage du t\351l\351chargement  :', filename, 7000);
				}
			}
			req.send(form);
		}
	};
	
	xhr.send(null);
}



  