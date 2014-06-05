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
var notifID = 0;
function notif(img,title,txt, timeout)
{
	var opt = {
        type: "basic",
        title: title,
        message: txt,
        iconUrl: img
      }
	  
	 function cb( notificationId) 
	 {
		if (timeout!=0){
		setTimeout(function() {
    				chrome.notifications.clear(notificationId, function cb( notificationId) 
	 {});
  					},timeout*1000);
  		}
	 };
	notifID += 1;
	chrome.notifications.create("domf"+notifID, opt, cb);
}

if (typeof(window.chrome)  !== "undefined"){
	var title = "Download on my Freebox";
  	var id = chrome.contextMenus.create({"title": title, "contexts":["link"],"onclick": onClick});
}

if (typeof(window.safari)  !== "undefined"){
	function performCommand(event) {
		if (event.command === "download-fb"){
       		download(event.userInfo);
    	}
	}

	safari.application.addEventListener("command", performCommand, false);

	function settingsChanged(event) {
		if (event.key == "freebox_password"){
	   		localStorage["freebox_password"] =event.newValue;
   		}
	}
	safari.extension.settings.addEventListener("change", settingsChanged, false);
}


 

