---
layout: page
title: phone mount
description: custom fitted for mophie charging puck and my mini cooper
img: assets/img/car_phone_mount/thumbnail.JPG
importance: 2
category: random
related_publications: false
---

I started off with one of these Mophie wireless charging car mounts (left, middle), which was fine and all even though it never really fit into these funky MINI Cooper vents (right).

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/car_phone_mount/mophie.png" title="mophie wireless charging car mount 1" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/car_phone_mount/mophie2.png" title="mophie wireless charging car mount 2" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/car_phone_mount/mini_cooper_vent.png" title="mini cooper vents" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

And then it broke, so I decided to salvage the functioning Mophie charging puck with a custom housing specialized for my car.

What's the most overcomplicated way to do this? In my first attempt, I reconstructed my car's interior with [Polycam](https://poly.cam/) (left) and fitted a CAD model to it (middle). The reconstruction accuracy wasn't great, so it required a fair number of tweaks, and even afterwards, it just wasn't a great spot for mounting a phone. That design went in the graveyard (right).

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/car_phone_mount/3d_scan.png" title="polycam scan" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/car_phone_mount/initial_design.png" title="initial design" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/car_phone_mount/graveyard.JPG" title="graveyard of failed designs" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

In the end, I opted for a much simpler design that slots into the horizontal openings of the vent. It has been working very well! It has slipped only once in 3 months of usage, whereas the default Mophie housing used to fall off on a daily basis.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/car_phone_mount/final_pieces.JPG" title="pieces of final design" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/car_phone_mount/final_table.jpg" title="final design" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/car_phone_mount/final.JPG" title="final design in car" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

Some miscellaneous technical notes:

- I used ASA filament to prevent melting on hot days.
- ASA prints only worked after using glue stick as a build plate adhesive on my BambuLab P1S printer.
- ASA prints shrunk ~1% after printing.
