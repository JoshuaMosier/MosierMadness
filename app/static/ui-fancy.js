$(window).scroll(
    {
        previousTop: 0
    }, 
    function () {
    var currentTop = $(window).scrollTop();
    if ((currentTop)< this.previousTop) {
        if($(window).scrollTop()<15){
        	$(".score-ticker").show();
        }
        if($(window).scrollTop()<150){
        	$(".navbar").show();
        }
    } else {
    	if($(window).scrollTop()>15){
        $(".score-ticker").hide();
      }
      if($(window).scrollTop()>150){
        $(".navbar").hide();
      }
    }
    this.previousTop = currentTop;
});

function horizAnim(event) {
	event.preventDefault();
  $('.box').animate({
    scrollLeft: $(this.hash).offset().left
  }, 'slow');
}

$("a").on("click", horizAnim);