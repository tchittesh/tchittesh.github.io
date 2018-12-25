var startedmain = false;
var startedabtme = false;
var startedexp = false;
var startedproj = false;

function typeWriter(id, txt, disptxt, i, j, speed) {
  if (i < txt.length && txt.charAt(i) != '\\') {
    disptxt += txt.charAt(i);
    document.getElementById(id).innerHTML = disptxt+'|';
    j=0;
  } else if (j % 10 < 5) {
    document.getElementById(id).innerHTML = disptxt+'|';
    j++;
  } else {
    document.getElementById(id).innerHTML = disptxt;
    j++;
  }
  i++;
  setTimeout(function() {
    typeWriter(id, txt, disptxt, i, j, speed);
  }, speed);
}

function checkAnimation() {
  if (window.pageYOffset/window.screen.height >= 0 && !startedmain) {
    startedmain = true;
    typeWriter('intro-text', 'Hi!\\\\\\\\\\\\\\\\\\\\\\\\\\ I\'m Chittesh Thavamani :) ', '', 0, 0, 80);
  }
  // if (window.pageYOffset/window.screen.height >= 0.2 && !startedabtme) {
  //   startedabtme = true;
  //   typeWriter('abtme-text', 'Here\'s a little bit about me...', '', 0, 0, 80);
  // }
  // if (window.pageYOffset/window.screen.height >= 1.2 && !startedexp) {
  //   startedexp = true;
  //   typeWriter('exp-text', 'Here\'s what I\'ve been up to...', '', 0, 0, 80);
  // }
}

$(window).scroll(function(){
    checkAnimation();
});
