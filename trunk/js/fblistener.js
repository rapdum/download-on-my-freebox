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
  var notDone = conf["not_done"];
  console.log("Checking for new download");
  var xh = new XMLHttpRequest();
  xh.open("GET", buildURL("downloads/"), true);  
  setFBHeader(xh);
  xh.send();

  function onTimeout(){
		console.log("checkFinished timeout");
		xh.abort();
	};
	xh.onreadystatechange = function () {
	   if (xh.readyState != 4)
			{return;}
	   if (xh.status == 200)
	   {
			clearTimeout(timeout);
			var res = JSON.parse( xh.responseText );
			var active = conf["not_done"] 
			newNotDone ="";
			for (i in res.result)
			{
				var file = res.result[i];
				if (file.status != "seeding" && file.status != "done" )
				{
					newNotDone +="$"+ file.name+"$";
					if (active.indexOf("$"+ file.name +"$")==-1 )
					{
						if (conf["freebox_display_popup"])
						{
							notif('img/down.png', 'D\351marrage du t\351l\351chargement', file.name, 7000);
							console.log ("Download started : " + file.name);
						}
					}
				}
				else
				{
					if (notDone.indexOf("$"+ file.name +"$")>=0 )
					{
						if (conf["freebox_display_popup"])
						{
							notif( "img/ok.png", "T\351l\351chargement termin\351", file.name,  0);
							console.log ("Download finished : " + file.name);
						}
					}
				}
			}
			notDone = newNotDone;
			store_conf("not_done", notDone);
		}
		if (xh.status == 403){
			function cb(res){
			if (res.result == false){
				console.log("login failed");
				}
			}	
			
			clearTimeout(timeout);
			get_session(cb);
		}         
	};
	var timeout=setTimeout(onTimeout,1000);			
    }

onload()
    