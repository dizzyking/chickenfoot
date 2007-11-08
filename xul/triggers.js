/**
 *  triggers.js -- (c) .........
 */
var thisSidebarSaved = false;

function loadTriggersPane() {
  // load trigger list
  loadTriggers();

  // set ignoreAllTriggersCheckbox
  updateIgnoreAllTriggersUI();
  
  // watch for changes to TriggerManager
  Chickenfoot.gTriggerManager.addListener(triggerManagerChanged);  
}
  
function unloadTriggersPane() {
  Chickenfoot.gTriggerManager.removeListener(triggerManagerChanged);
}

function triggerManagerChanged(event) {
  if (event.type == "ignoreAllTriggers") {
    updateIgnoreAllTriggersUI();    
  } else {
    /* event.type == "saveTriggers" */
    if (!thisSidebarSaved) {
      loadTriggers();
    }
  }
}

function loadTriggers() {
  var listbox = document.getElementById("CF_TRIGGERS_PANE");
  
  // clear out the previous triggers
  while (listbox.getRowCount() > 0) {
    listbox.removeItemAt(0)
  }

  var triggers = Chickenfoot.gTriggerManager.triggers;  
  
  for (var i = 0; i < triggers.length; ++i) {
    var trigger = triggers[i];
    addTriggerToListbox(trigger);
  }
}

function saveTriggers() {
  try {
    thisSidebarSaved = true;
    Chickenfoot.gTriggerManager.saveTriggers();
  } finally { 
    thisSidebarSaved = false;
  }
}
 
function clickedIgnoreAllTriggersCheckbox() {
  var cbox = document.getElementById('ignoreAllTriggersCheckbox');
  var checked = cbox.checked; 
  Chickenfoot.gTriggerManager.setIgnoringTriggers(checked);
  updateIgnoreAllTriggersUI();
}

function updateIgnoreAllTriggersUI() {
  var checked = Chickenfoot.gTriggerManager.isIgnoringTriggers();
  var cbox = document.getElementById('ignoreAllTriggersCheckbox');
  cbox.checked = checked;
  document.getElementById("CF_TRIGGERS_PANE").setAttribute("ignoreAllTriggers", checked);
}


function addTriggerToListbox(/*Trigger*/ trigger) {
  var item = document.createElement("listitem");
  item.setAttribute("allowevents", "true");

  var enabled = document.createElement("checkbox");
  enabled.setAttribute("checked", trigger.enabled);
  enabled.setAttribute("observes", "requiresTriggersEnabled");
  item.appendChild(enabled);
  
  var name = document.createElement("label");
  name.setAttribute("value", trigger.name);
  item.appendChild(name);
  
  // add "when to trigger" information to the list box
  var includes = document.createElement("label");
  if (trigger.when == 'Pages Match'){
    includes.setAttribute("value", patternArrayToString(trigger.includes, trigger.excludes));
  }else if(trigger.when == 'Firefox Starts'){
    includes.setAttribute("value", "Firefox starts");
  }else if(trigger.when == 'New Window'){
    includes.setAttribute("value", "New window opens");
  }
  item.appendChild(includes);
  
  item._trigger = trigger;

  var listbox = document.getElementById("CF_TRIGGERS_PANE");
  listbox.appendChild(item);

  // now that the new widgets are in the UI, add event listeners to them
  enabled.addEventListener("command",
    function(event) {
      trigger.enabled = enabled.checked;
      saveTriggers();
    }, false);
}

function updateTriggerInListbox(index) {
  var listbox = document.getElementById("CF_TRIGGERS_PANE");
  var item = listbox.getItemAtIndex(index);
  var trigger = item._trigger;

  var enabled = item.firstChild;
  //TODO - enabled.checked = trigger.enabled
  enabled.setAttribute("checked", trigger.enabled);
  //TODO - get rid of this saveTriggers
  Chickenfoot.gTriggerManager.saveTriggers();

  //TODO - change the property instead of the attribute for next two
  var includes = enabled.nextSibling;
  
  // add "when to trigger" information to the list box
  if (trigger.when == 'Pages Match'){
    includes.setAttribute("value", patternArrayToString(trigger.includes, trigger.excludes));
  }else if(trigger.when == 'Firefox Starts'){
    includes.setAttribute("value", "Firefox starts");
  }else if(trigger.when == 'New Window'){
    includes.setAttribute("value", "New window opens");
  }
}

/**
 * Concatenate includes and excludes into to one string and return it back 
 *
 * @param array 1 - array of includes
 * @param array 2 - array of excludes
 */

function patternArrayToString(/*String[]*/array1, /*String[]*/array2) {
  var arrayString = '';

  // Adding Includes URLs
  for(var i=0; i<array1.length ; i++){
    arrayString = arrayString + array1[i] + " ";
  }
  
  // Adding Excludes URLs
  for(var i=0 ; i<array2.length ; i++){
    arrayString = arrayString + "-" + array2[i] + " ";
  }

  return arrayString;
}

//TODO - delete this function
function triggerClick(event) {
  var listbox = document.getElementById("CF_TRIGGERS_PANE");
  //TODO - consider changing to event.button or something more descriptive
  if (event.which == 1) { // left mouse click
    var listitem = listbox.getSelectedItem(0);
    var checked = listitem.childNodes[0].getAttribute("checked");
    checked = (checked != "true");
    listitem.childNodes[0].setAttribute("checked", checked);
    loadedScripts[listbox.getIndexOfItem(listitem)].enabled = checked;
  } else if (event.which == 3) { // right mouse click
  
  } else {
    return; // middle mouse click? ignore
  }    
  // 
  ///listbox.clearSelection();
  ///var box = document.getBoxObjectFor(event.target);
  // use box to determine if checkbox was clicked
}

function addTrigger() {
  var buffer = getSelectedBuffer();
  if (!buffer) return;
  
  var dialogArguments = {};
  openTriggerDialog(/*trigger*/ null, dialogArguments, buffer);
  
  if (dialogArguments.name == null) return;
  
  var parsedRules = {};
  
  if ((dialogArguments.when == 'Pages Match')&&(dialogArguments.rulesTxt != null)){
    // rulesParsing() returns well-classified includes and excludes arrays
	parsedRules = rulesParsing(dialogArguments.rulesTxt);
  }else{
	parsedRules.includes = [];
	parsedRules.excludes = [];
  }
  
  var includes = new Chickenfoot.SlickSet();
  includes.addAll(parsedRules.includes);
  var excludes = new Chickenfoot.SlickSet();
  excludes.addAll(parsedRules.excludes);
  var map = {
    name : dialogArguments.name,
    when : dialogArguments.when,
    description : dialogArguments.description,
    includes : includes,
    excludes : excludes
  };
  var newCode = Chickenfoot.updateAttributes(dialogArguments.source, map);
    
  //TODO - push this code into openTriggerDialog -> editDialog...
  //TODO - make this look like newTrigger
  var trigger = new Chickenfoot.Trigger(
    dialogArguments.name,
    newCode,
    dialogArguments.description,
    dialogArguments.enabled,
    parsedRules.includes, // includes Array
    parsedRules.excludes, // excludes Array
    undefined,  // path
    dialogArguments.when);    // when to enable the trigger

  addTriggerToListbox(trigger);
  //TODO - method in Chickenfoot.gTriggerManager to do this, don't manipulate the struct. directly
  Chickenfoot.gTriggerManager.triggers.push(trigger);
  saveTriggers();
  
  buffer.text = newCode;
  buffer.trigger = trigger;
  buffer.dirty = false;
}

function editTriggerScript() {
  var listbox = document.getElementById("CF_TRIGGERS_PANE");
  var itemIndex = listbox.selectedIndex;
  if (itemIndex != -1) {
	  var triggers = Chickenfoot.gTriggerManager.triggers;
	  var trigger = triggers[itemIndex];	  
	  startEditingTriggerScript(trigger);
  }
}

function editTriggerProperties() {
  var listbox = document.getElementById("CF_TRIGGERS_PANE");
  var itemIndex = listbox.selectedIndex;
  if (itemIndex != -1) {
	  var triggers = Chickenfoot.gTriggerManager.triggers;
	  var trigger = triggers[itemIndex];
	  
	  var dialogArguments = {};
	  openTriggerDialog(trigger, dialogArguments);
	  
	  var parsedRules = {};
	  if ((dialogArguments.when == 'Pages Match')&&(dialogArguments.rulesTxt != null)){
	    // rulesParsing() returns well-classified includes and excludes arrays
	    parsedRules = rulesParsing(dialogArguments.rulesTxt);
	  }else{
	    parsedRules.includes = [];
	    parsedRules.excludes = [];
	  }
	  
	  if (dialogArguments.name != null) {
	    trigger.name = dialogArguments.name;
	    trigger.includes = parsedRules.includes;
	    trigger.excludes = parsedRules.excludes;
	    trigger.enabled = dialogArguments.enabled;
        trigger.when = dialogArguments.when;
        trigger.description = dialogArguments.description;
	    
        var includes = new Chickenfoot.SlickSet();
        includes.addAll(parsedRules.includes);
        var excludes = new Chickenfoot.SlickSet();
        excludes.addAll(parsedRules.excludes);
        var map = {
          name : dialogArguments.name,
          when : dialogArguments.when,
          description : dialogArguments.description,
          includes : includes,
          excludes : excludes
        };
	    var newCode = Chickenfoot.updateAttributes(dialogArguments.source, map);
	    trigger.setSource(newCode);
        
        //check if trigger script is open in a buffer, if yes, then change that too
        var buffers = getAllBuffers();
        try {
          var buffer;
          for (var k=0; k<buffers.length; k++) {
            buffer = buffers[k];
            if (buffer.file.path == trigger.path.path) {
              buffer.text = newCode;
              buffer.dirty = false;
            }
          }
        }
        catch(err) {}
        
        //TODO - save triggers here
	    updateTriggerInListbox(itemIndex);
	  }
  }
}

/**
 * Opens the trigger edit dialog for a trigger
 *
 * @param trigger to edit
 * @param dialogArguments
 * @param buffer open with contents for new trigger, or null if merely editing a trigger
 */
//TODO - consider returning a trigger object
function openTriggerDialog(trigger, dialogArguments, buffer) {
  return window.openDialog("chrome://chickenfoot/content/addTriggerDialog.xul",
  	"showmore",
  	"chrome,modal,centerscreen,dialog,resizable",
  	(trigger) ? "Edit Trigger" : "Add Trigger",
  	(trigger) ? trigger.name : "",
  	(trigger) ? patternArrayToString(trigger.includes, trigger.excludes) : Chickenfoot.getVisibleHtmlWindow(chromeWindow).location,
  	(trigger) ? trigger.enabled : true,
  	(trigger) ? trigger.getSource() : buffer.text,
  	(trigger) ? trigger.when : "Pages Match",
  	dialogArguments,
	(trigger) ? trigger.description : ""
  	);
}

function moveTrigger(/* 'down' | 'up' */ direction) {
  var listbox = document.getElementById("CF_TRIGGERS_PANE");
  var item = listbox.selectedItem;
  if (item == null) return;

  var triggers = Chickenfoot.gTriggerManager.triggers;  

  var itemIndex = listbox.selectedIndex;
  
  if (direction == 'up') {
    var itemAboveUs = item.previousSibling;
    // NOTE: we must also check that listbox.selectedIndex != 0
    // in case there is a DOM object above us which is the header list,
    // and we don't want to move above that
    if (itemAboveUs != null && itemIndex != 0) {
      listbox.removeChild(item);
      listbox.insertBefore(item, itemAboveUs);
           
      var t = triggers[itemIndex-1];
      triggers[itemIndex-1] = triggers[itemIndex];
      triggers[itemIndex] = t;
    }
  } else if (direction == 'down') {
    var itemBelowUs = item.nextSibling;
    if (itemBelowUs != null) {
      listbox.removeChild(itemBelowUs);
      listbox.insertBefore(itemBelowUs, item);

      var t = triggers[itemIndex+1];
      triggers[itemIndex+1] = triggers[itemIndex];
      triggers[itemIndex] = t;
    }
  } else {
    //TODO throw error/illegal argument exception
  }

  // whatever happens, let's reselect the item
  // just in case it got deselected in the moving process
  listbox.selectedIndex = listbox.getIndexOfItem(item);
  saveTriggers();
  
  // dump triggers list for debugging
  /*
  var s = "";
  for (var i = 0; i < triggers.length; ++i) {
    s += triggers[i].name + "\n";
  }
  alert(s);
  */
}

function removeTriggers() {
  var listbox = document.getElementById("CF_TRIGGERS_PANE");
  var triggers = Chickenfoot.gTriggerManager.triggers;  
  
  for (var i = listbox.selectedCount - 1; i >= 0; --i) {
    var item = listbox.getSelectedItem(i);
    var itemIndex = listbox.getIndexOfItem(item);

    var item = listbox.getItemAtIndex(itemIndex);
    var name = item._trigger.name;
    if (!window.confirm('Are you sure you want to delete the following trigger: ' + name)) {
      continue;
    }
    
    listbox.removeItemAt(itemIndex);
    triggers.splice(itemIndex, 1);
    saveTriggers();
  }
}

/**
 * Parsing rulesTxt and save includes and excludes separately
 *
 * @param rulesTxt - rules text of the trigger
 */
function rulesParsing(rulesTxt){
  var tokenizedRules = [];
  var parsedRules = {};
  var includes = [], excludes = [];
  var includesIndex = 0, excludesIndex = 0;
  var excludesPattern = /^-/;
  
  //Based on space to tokenize the rules text
  tokenizedRules = rulesTxt.split(/\s+/);

  for(var i =0 ; i < tokenizedRules.length ; i++){
    var text = tokenizedRules[i];
    if (!text) continue;
    else if (text.match(excludesPattern)){
      // Skip the first character "-"
      excludes[excludesIndex] = text.substring(1,text.length);
      excludesIndex += 1;
    } else{
      includes[includesIndex] = text;
      includesIndex += 1;
    }
  }
  
  parsedRules.includes = includes;
  parsedRules.excludes = excludes;
    
  return parsedRules;
}

/**
 * Take the code in the currently selected trigger and
 * prompt the user to package it as an XPI
 */
function packageSelectedTriggers() {
  if (!Chickenfoot.hasJava()) {
    Chickenfoot.showNeedsJavaDialog(window)
    return;
  }
  
  var dialogArguments = {
    chickenfoot : Chickenfoot,
    createXpi : false,
    templateTags : undefined,
    outputPath : undefined,
    mutatedAttributes : undefined,
    userFiles : undefined,
    triggers : undefined,
    icon : undefined
  };
  window.openDialog("chrome://chickenfoot/content/exportDialog.xul",
    "showmore",
    "chrome,modal,centerscreen,dialog,resizable",
    dialogArguments
  );
   if (!dialogArguments.createXpi) return;
   
    var userFilesJava = new Array();
    var stringFiles = dialogArguments.userFiles;
    var toparse = stringFiles.replace(/\n/g, ";");
    var strFile = "";
    var i=0; var j=0;
    while (toparse != "") {
      while (toparse[i] != ";" && i<toparse.length) {
        strFile = strFile + toparse[i];
        i++;
      }
      userFilesJava[j] = strFile;
      if (i+1 >= toparse.length) {toparse = "";}
      else {toparse = toparse.substring(i+1, toparse.length);}
      i=0; j++; strFile = "";
    }
    
    // add trigger files to list of user files to add to jar
    for(var m=0; m<dialogArguments.triggers.length; m++) {
      var currentLength = userFilesJava.length;
      userFilesJava[currentLength] = dialogArguments.triggers[m].path.path;
    }
  
  
  try {
    var file = Chickenfoot.xpiTie(dialogArguments.triggers, dialogArguments.templateTags, dialogArguments.outputPath, 
                                   userFilesJava, dialogArguments.icon);
  } catch (e) {
    alert(e);
    return;
  }
    alert("Your new extension was created at: " + file.toString());
}