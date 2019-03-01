$(window).scroll(
    {
        previousTop: 0
    }, 
    function () {
    var currentTop = $(window).scrollTop();
    if ((currentTop)< this.previousTop) {
        if($(window).scrollTop()<25){
        	$(".score-ticker").show();
        }
        if($(window).scrollTop()<160){
        	$(".navbar").show();
        }
    } else {
    	if($(window).scrollTop()>25){
        $(".score-ticker").hide();
      }
      if($(window).scrollTop()>160){
        $(".navbar").hide();
      }
    }
    this.previousTop = currentTop;
});