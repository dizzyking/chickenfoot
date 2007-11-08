var Test = Chickenfoot.Test;

var t = new Test();

t.test("keypress:", function(){
  go("http://www.google.com");
  
  // use keypresses to write something in first textbox and see if it is there
  var x = keypress("h e l l o", "first textbox");
  Test.assert(find("first textbox").element.value == "hello");
});


t.test("onKeypress:", function(){
  go("https://webmail.mit.edu/");

  // make an onKeypress event and simulate a keypress() that will trigger it
  onKeypress("Ctrl enter", function() { enter("Username textbox", "Testing"); })
  keypress("ctrl Enter")
  Test.assert(find("Username textbox").element.value == "Testing");
});

t.test("accessKeys:", function(){
  go("http://www.cs.tut.fi/~jkorpela/forms/accesskey.html");
  
  // test using keypress() to trigger accessKey element which takes you to a new page
  keypress("alt m")
  Test.assert(document.URL == "http://www.cs.tut.fi/cgi-bin/run/~jkorpela/echo.cgi")
});


t.close();