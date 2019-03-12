window.onload = function() {
	var dropdown = document.getElementById("entries_dropdown");
  $(".entries-menu").on({
    mouseenter: function () {
      dropdown.classList.add("show");
    },
    mouseleave: function () {
      dropdown.classList.remove("show");
    }
});
}

