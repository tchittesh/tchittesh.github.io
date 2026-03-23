---
layout: page
title: understanding birdcalls
description: self-supervised learning of bird behaviors and vocalizations
img: assets/img/nature_sense/backyard_cropped.gif
importance: 1
category: research
related_publications: false
---

<video src="/assets/video/backyard_muted.mp4" autoplay loop muted playsinline style="float:right;width:min(35%,350px);margin:0 0 1rem 1.5rem;"></video>

What do birds chirp about? This used to be an idle curiosity as I would stare at my backyard bird feeder, awestruck by the complexity of their feeding, pecking, and vocalizations.
What if we could use recent advances in self-supervised learning to associate vocalizations to behaviors, revealing patterns that are otherwise imperceptible to the human eye?

This is not a new idea. Organizations like [Project CETI](https://www.projectceti.org/) and [Earth Species Project](https://www.earthspecies.org/) are making good headway in similar efforts to decode animal communication.
In this project, I attempt to do some smaller scale research in my backyard.

## Research Plan

Meaning must be grounded in the real world. As a result, to understand birdcalls, we must first collect a large multimodal dataset.

**Step 1: Capture a 4D light and sound field.** Using a synchronized camera and microphone array, I record the full spatial audio-visual scene of the backyard. The goal is to be as rich as possible at the data capture stage. The more structure we can extract from sensors, the less the model has to infer from scratch. Postprocessing extracts per-animal tracks in both image space (bounding boxes, poses) and audio space ([beamformed](https://pysdr.org/content/doa.html) source locations, separated vocalizations), building a continuous, synchronized record of _who is where, doing what, and saying what_, at each moment in time.

**Step 2: Train a self-supervised model.** With a sufficiently rich multimodal dataset, the hope is that a self-supervised model can discover structure that is invisible to human observers. I expect that two pieces will be important here: (1) training a performant self-supervised model that minimizes some form of prediction error and (2) using mechanistic interpretibility methods like [sparse autoencoders](https://transformer-circuits.pub/2023/monosemantic-features/index.html) and circuit discovery to understand what the model has learned. Could we recover concepts like "family", "squirrel", "food", and derivative higher-order meanings like "hunger = want food"?

**Goal: Discover something new.** Decoding birdcalls would be a remarkable outcome, but the model isn't necessarily limited to that. It might instead surface patterns in flock movement, social hierarchies, or territorial behavior. The goal of this project is to use the above data-driven self-supervised approach to discover any insight that is beyond the limits of current human knowledge.

## Updates

{% assign nature_posts = site.posts | where_exp: "post", "post.tags contains 'decoding-animal-communication'" %}
{% if nature_posts.size > 0 %}
{% for post in nature_posts %}

<details>
  <summary>{{ post.date | date: "%b %-d, %Y" }} — <a href="{{ post.url }}">{{ post.title }}</a></summary>
  <div style="padding: 0.75rem 0 0.5rem 1rem; border-left: 2px solid #ddd;">
    {{ post.content }}
  </div>
</details>
{% endfor %}
{% else %}
*No updates yet.*
{% endif %}
