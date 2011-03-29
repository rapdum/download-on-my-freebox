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
 * Author: Raphaël Dumontier <rdumontier@bgmail.com>, (C) 2010, 2011
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
  console.log("POST");
  xh.open("POST", "http://mafreebox.freebox.fr/login.php", false);
  xh.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xh.setRequestHeader("X-Requested-With","XMLHttpRequest");
  
  var result=new Object();
  result.result = false;
  
  try{
  	xh.send(params);
    if (xh.readyState == 4) /* 4 : état "complete" */
    {
       if (xh.status == 200) /* 200 : code HTTP pour OK */
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

  if( url.substr(0,7) == "magnet:")
  	return  "download.torrent_add";
  if( url.substr(-7) === "torrent" ) 
     return  "download.torrent_add";
  else
     return  "download.http_add";
       
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
	downloadTorrent(url);
	return
  	var pass = localStorage["freebox_password"];
	console.log(url);
  	// check if we are correctly log we need a cookie to send download request
  	res = login(pass);
  	if (res.result == false){
  		alert(res.error);
  		return;
  	}	
  
  	
  	var params = "url=" + encodeURIComponent(url) + "&user=freebox" + "&method=" + getMethod(url);
    var xh = new XMLHttpRequest();
  	xh.open("POST", "http://mafreebox.freebox.fr/download.cgi", false);  
  	xh.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  	xh.setRequestHeader("X-Requested-With","XMLHttpRequest");
  	xh.send(params);
	if (xh.readyState == 4){
    	if (xh.status == 200){
           	var filename = getFilename(url);
			notif('img/down.png', 'D\351marrage du t\351l\351chargement  :', filename, 7000);
			checkFinished();
        }
    }
}

function downloadTorrent(url)
{
	console.log("downloading " + url);
	var xh = new XMLHttpRequest();
  	xh.open("get", url, false);  
  	//xh.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  	xh.setRequestHeader("X-Requested-With","XMLHttpRequest");
  	xh.overrideMimeType('text/plain; charset=x-user-defined');

 	 xh.send(null);

  	if (xh.status != 200) return '';
	var torrentFile = xh.responseText;
  	console.log( xh);
  	uploadFile("http://mafreebox.freebox.fr/download.cgi",torrentFile )
  	
  	
  	
}

function uploadFile( url, fileData ) {
  var boundaryString = "AaBbCcX30";
  var boundary = "--"+boundaryString;

  var postContent = boundary+"\r\n"+
          
          "Content-Disposition: form-data; name=\"url\"\r\n"+
          "\r\n"+
          "\r\n"+
          boundary+"\r\n"+
          "Content-Disposition: form-data; name=\"user\"\r\n"+
          "\r\n"+
          "freebox\r\n"+
          boundary+"\r\n"+
          "Content-Disposition: form-data; name=\"method\"\r\n"+
          "\r\n"+
          "download.torrent_add\r\n"+
          boundary+"\r\n"+
          "Content-Disposition: form-data; name=\"ajax_iform\"\r\n"+
          "\r\n"+
          "1\r\n"+
          boundary+"\r\n"+
          "Content-Disposition: form-data; name=\"data\"; filename=\"The.Kings.Speech.2010.VOSTFR.BDRiP.XviD-NIKOo.avi[www.torrent411.com].torrent\"\r\n"+
          "Content-Type: text/plain\r\n"+
          "\r\n"+
          "%FILECONTENT%\r\n"+
          boundary+"\r\n";
  postContent = postContent.replace("%FILECONTENT%", fileData);
  
  
  console.log(fileData);
  
  var formData = new FormData();
	formData.append("url", "");
	formData.append("user", "freebox");
	formData.append("method", "download.torrent_add");
	formData.append("data", fileData);
	

  var req = new XMLHttpRequest();
  req.open("POST", url, true); 
  req.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundaryString);
  req.setRequestHeader("X-Requested-With","XMLHttpRequest");
  req.onreadystatechange = function() {
    if (req.readyState == 4) {
      if (req.status == 200) {
        console.log( req.responseText );
      }
    }
  };
  req.send(postContent);
}

  