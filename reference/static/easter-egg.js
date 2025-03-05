window.onload = function() {
	if (localStorage.getItem("hasCodeRunBefore") === null) {
    var egg = document.getElementById("easter_egg");
	  setTimeout(function(){
	    egg.classList.add('load_spin');
		},10);
    localStorage.setItem("hasCodeRunBefore", true);
  }
};

function myFunc() {
  console.log('hek')
  var egg = document.getElementById("easter_egg");
  if (egg.classList.contains('load_spin')) {
    egg.classList.remove('load_spin');
  }
  setTimeout(function(){
    egg.classList.add('load_spin');
	},5);
}