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

function onload()
{
   console.log('start listener');
   setInterval(checkFinished,10000);
}

function checkFinished(){
  var notDone = localStorage["notDone"];
  if (!notDone) notDone="";
  console.log("checking for new download");
  var freeboxUrl = "http://" + localStorage["freeboxUrl"];
  var xh = new XMLHttpRequest();
  var params = "method=download.list";
  xh.open("POST", freeboxUrl + "/download.cgi", true);  
  xh.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xh.setRequestHeader("X-Requested-With","XMLHttpRequest");
  
  xh.send(params);
  function onTimeout(){
		console.log("checkFinished timeout");
		xh.abort();
	};
	xh.onreadystatechange = function () {
	   if (xh.readyState != 4) /* 4 : état "complete" */
			{return;}
	   if (xh.status == 200) /* 200 : code HTTP pour OK */
	   {
			clearTimeout(timeout);
			console.log("checked!")
			var res = JSON.parse( xh.responseText );
			var active = ""
			newNotDone ="";
			for (i in res.result)
			{
				var file = res.result[i];
				
				if (file.status!='done' && file.status!="seeding")
				{
					newNotDone +="$"+ file.name+"$";
				}
				else
				{
					if (notDone.indexOf("$"+ file.name +"$")>=0 )
					{
						if (localStorage["freebox_display_popup"]==="true")
						notif( "img/ok.png", "T\351l\351chargement termin\351:", file.name,  0);
					}
				}
			}
			notDone = newNotDone;
			localStorage["notDone"] = notDone;
		}
		if (xh.status == 403){
			function cb(res){
			if (res.result == false){
				console.log("login failed");
				}
			}	
			login(cb);
		}         
	};
	var timeout=setTimeout(onTimeout,1000);			
    }

onload()
    