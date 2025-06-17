---
layout: post
title: Interactive Multi-View Stereo Simulator
date: 2025-05-30 00:00:00-0000
description: Explore how 3D reconstruction uncertainties change with varying camera parameters and configurations
tags: stereo 3d-reconstruction
categories: demo
related_posts: false
---

<div class="row justify-content-sm-center">
    <div class="col-sm-6 mt-0 mt-md-0">
        <a href="/stereo_simulator">
            {% include figure.liquid loading="eager" path="assets/img/stereo_simulator_screenshot.jpeg" class="img-fluid rounded z-depth-1" zoomable=false %}
        </a>
    </div>
</div>
<div class="caption mt-0">
    <a href="/stereo_simulator" style="font-size: 1.5rem;">Try the demo here!</a>
</div>

## Motivation

In the textbook scene with two rectified cameras (depicted below), using similar triangles $\triangle PC_1C_2 \sim \triangle C_2I_1I_2$, it follows that $\delta / f = B / D$, where $\delta$ is pixel disparity, $f$ is the focal length in pixels, $B$ is the camera baseline, and $D$ is depth to the observed world point.

<div class="row justify-content-sm-center">
    <div class="col-sm-6 mt-0 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/stereo_equation.jpeg" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption">
    Classical Stereo Equation Setup: $\delta / f = B / D$
</div>

In this case, it's simple to reason about how changes in camera parameters may affect the quality of the triangulation.
Given a disparity measurement $\delta \pm \epsilon$ with $\epsilon$ pixels of uncertainty, we're able to resolve depth to the range

$$\frac{B \cdot f}{\delta + \epsilon} \leq D \leq \frac{B \cdot f}{\delta - \epsilon}.$$

Now pin the depth of the observed point to $D$ and double the baseline $B$. The according disparity measurement will also double:

$$\frac{2B \cdot f}{2\delta + \epsilon} \leq D \leq \frac{2B \cdot f}{2\delta - \epsilon} \implies \frac{B \cdot f}{\delta + \epsilon / 2} \leq D \leq \frac{B \cdot f}{\delta - \epsilon / 2}.$$

That is, doubling the baseline $B$ has the same effect as halving the uncertainty $\epsilon$ in our disparity measurement.

Similarly, one can show that:

- doubling the focal length $f$ has the same effect as doubling the uncertainty $\epsilon$
- and doubling the depth $D$ of the observed point has the same effect as doubling the uncertainty $\epsilon$.

But what about for $N > 2$ cameras?
How does reconstruction uncertainty scale with camera positions, orientations, and intrinsics?
In the absence of nice closed form solutions for $N > 2$ cameras, can we simulate the observed uncertainty and observe how it responds?
Gain some intuition or emulate your multi-view camera setup with the tool <a href="/stereo_simulator">here</a>!
