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

function notif(img,title,txt, timeout)
{
	if (window.webkitNotifications){
		var notification = webkitNotifications.createNotification(
			    img,  // icon url - can be relative
			    title,  // notification title
			    txt  // notification body text
				);
				// Then show the notification.
		notification.show();
			//then close it
		if (timeout!=0){
		setTimeout(function() {
    				notification.cancel();
  					},timeout);
  		}
  	}
  	else{
  		alert(title + ' ' + txt);
  	}
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


 

