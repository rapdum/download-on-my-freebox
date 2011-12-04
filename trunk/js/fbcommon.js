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
 * Author: Rapha�l Dumontier <rdumontier@gmail.com>, (C) 2010, 2011
 */
 
 // ------------------------------------- ----------------------------------------------
var xh = new XMLHttpRequest();
var freeboxUrl = "http://" + localStorage["freeboxUrl"];
console.log("Freebox URL :" + freeboxUrl);

function buildURL(path)
{
	freeboxUrl = "http://" + localStorage["freeboxUrl"];
	if (freeboxUrl === "") freeboxUrl="http://mafreebox.frebox.fr";
	return  freeboxUrl + path;
}

function login( pass, cb ){
  var params = "login=freebox&passwd=" + encodeURIComponent(pass);
  var xh = new XMLHttpRequest();

  xh.open("POST", buildURL("/login.php"), true);
  xh.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xh.setRequestHeader("X-Requested-With","XMLHttpRequest");
  
  function ajaxTimeout(){
	xh.abort();
	var result=new Object();
	result.result = false;
	cb(result);
	}

  
  
  xh.onreadystatechange=function(){
  var result=new Object();
  result.result = false;
   if (xh.readyState == 4) {
       if (xh.status == 200){      
       		var jsondata=eval("("+xh.responseText+")");
			
       		jsondata.error = translateErrorCode(jsondata.errcode,"Mauvais mot de passe");
			console.log(jsondata);
			cb(jsondata);
			//return jsondata;
	   }  
	   result.error = translateErrorCode(xh.status, xh.statusText);
    }
      clearTimeout(xmlHttpTimeout);
   }

  	xh.send(params);
	var xmlHttpTimeout=setTimeout(ajaxTimeout,1000);
    //return result;
	
}


function sendRequest(path, params, contentType, callback)
{
	console.log("sending : " + freeboxUrl + path + " with : " + params);
	xh.open("POST", freeboxUrl + path, false);  
	xh.setRequestHeader("Content-Type", contentType);
	xh.setRequestHeader("X-Requested-With","XMLHttpRequest");
	xh.onreadystatechange = callback;
	xh.send(params);
}

function translateErrorCode(code,def)
{
	if (code == 1 ) return "Veuillez saisir un mot de passe correct dans les options du plugin";
	if (code == 101) return "La freebox n'est pas joignable";
	return def;
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