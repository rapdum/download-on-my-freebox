
function handleContextMenu(event) {
	
	console.log(event.target.href);
	if (!event.target.href) {
		console.log('dfrtyeftz');
    }
    else

    safari.self.tab.setContextMenuEventUserInfo(event, event.target.href);

}

document.addEventListener("contextmenu", handleContextMenu, false);