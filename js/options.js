var imgok = "img/ok.png";
var imgnok = "img/nok.png";
var encrypt = 'Download on my freebox is neat';


function checkPassword(){
  
  var pass = getPassword();
  
  function loginCB(ok){
	  var select = document.getElementById("Check");
	  var err = document.getElementById("err");
	  if (ok.result) {
		select.src = imgok;
		err.innerText="";
	  }
	  else {
		select.src = imgnok;
		err.innerText=ok.error;
		}
	}
	console.log("Verification des params de connexion");
	login( loginCB);
	var xhr = new XMLHttpRequest();
	
    select = document.getElementById("DCheck");
	var auth = document.getElementById("auth");
	var authremote = document.getElementById("authremote");
	console.log(buildURL(":9091/transmission/rpc"));
	xhr.open('POST', buildURL(":9091/transmission/rpc"), true, "freebox", pass);
	xhr.send('{}');
	
	authremote.style.visibility ="hidden";
	function onTimeout(){
		
		select.src = imgnok;
		if (localStorage["freeboxUrl"] == "mafreebox.freebox.fr")
		{	
		    auth.style.visibility ="visible";
			authremote.style.visibility ="hidden";
		}
		else
		{
			auth.style.visibility ="hidden";
			authremote.style.visibility ="visible";
		}
		
		xhr.abort();
	};
	xhr.onreadystatechange = function () {
	    if (xhr.readyState != 4) return;
	    	if (xhr.status == 200){
			select.src = imgok;
			auth.style.visibility ="hidden";
        	}
	    	if (xhr.status == 401){
			select.src = imgnok;
			auth.style.visibility ="visible";
        	}  
			clearTimeout(timeout);
	};
	var timeout=setTimeout(onTimeout,100);
}

function save_options() {
  var select = document.getElementById("password");
  storePassword(select.value);
  select = document.getElementById("display_popup");
  localStorage["freebox_display_popup"] = select.checked;
  select = document.getElementById("url");
  if (select.value != "")
  {
	localStorage["freeboxUrl"] = select.value;
  }
  else 
  {
	localStorage["freeboxUrl"] = "mafreebox.freebox.fr";
  }
  console.log(localStorage["freeboxUrl"]);
  checkPassword();
  
  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Sauvegard&eacute;es.";
  changeReasons();
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}
function changeReasons(){
	if (!localStorage["restore count"]) {
			localStorage["restore count"]=0;
		}
	phrases = ["Aujourd'hui, je me sens l'ame g&eacute;n&eacute;reuse :",
				"Envie, d'un peu de m&eacute;c&eacute;nat :",
				"J'ai trop d'argent :",
				"Parce que le d&eacute;veloppeur &agrave; besoin de changer ces fenetres :",
				"Sans raison :",
				"J'ai trop d'argent :"];
	
	count = parseInt(localStorage["restore count"]);
	document.getElementById("reasons").innerHTML = phrases[count%phrases.length];
	localStorage["restore count"] = count + 1;
}
// Restores select box state to saved value from localStorage.
function restore_options() {
    changeReasons();
	document.getElementById("btn_save").addEventListener("click",save_options);
  
  var display_popup = localStorage["freebox_display_popup"];
  if (!display_popup) 
  {
  		//setdefault
  		localStorage["freebox_display_popup"] = true;
  		display_popup = true;
  	}
  var select = document.getElementById("display_popup");
  console.log(display_popup);
  select.checked = (display_popup === 'true');
  
  
  var url = localStorage["freeboxUrl"];
  if (!url) {
    return;
  }
  var select = document.getElementById("url");
  select.value = url;
  
  
  var pass = getPassword();
  if (!pass) {
    return;
  }
  var select = document.getElementById("password");
  select.value = pass;
  checkPassword();
}

window.addEventListener("load", restore_options);