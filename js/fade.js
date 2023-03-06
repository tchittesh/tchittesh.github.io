$(document).ready(function() {

  /* Every time the window is scrolled ... */
  $(window).scroll( function(){

    /* Check the location of each desired element */
    $('.fade-up').each( function(){
      var top_of_object = $(this).position().top; // + $(this).outerHeight()/2;
      var bottom_of_window = $(window).scrollTop() + $(window).height();
      /* If the object is completely visible in the window, fade it it */
      if( bottom_of_window > top_of_object ){
        $(this).animate({opacity:1, top: '0px'}, 600);
      }
    });

    $('.fade-left').each( function(){
      var top_of_object = $(this).position().top; // + $(this).outerHeight();
      var bottom_of_window = $(window).scrollTop() + $(window).height();
      /* If the object is completely visible in the window, fade it it */
      if( bottom_of_window > top_of_object ){
        $(this).animate({opacity:1, left: '0px'}, 600);
      }
    });
  });

});
