---
layout: post
title: "Understanding Birdcalls: Data Collection Prototype"
date: 2026-02-27 00:00:00-0000
description: Setting up a camera and microphone array to study backyard animal social behavior
tags: decoding-animal-communication
categories: projects
related_posts: false
---

*This is the first update for the [understanding birdcalls](/projects/understanding_birdcalls) project. See the [project page](/projects/understanding_birdcalls) for more context.*

## Progress

So far, I've built a portable data collection platform and written some initial recording and processing scripts for it.

#### Hardware

The entire platform is built around the [miniDSP UMA-16 v2](https://www.minidsp.com/products/usb-audio-interface/uma-16-microphone-array), a 16-channel microphone array in a 4x4 uniform rectangular arrangement.
It ships with a 1080p RGB camera, which lets us use the device as an acoustic camera, with images from the camera and beamformed sound from the microphones.
While this is mostly plug-and-play with a laptop, I decided to connect it to a Raspberry Pi 5 with a touchscreen and mount it on a tripod for extra portability.

Full details and costs are below:

<img src="/assets/img/nature_sense/data_collection_prototype.JPG" alt="Data collection prototype" style="float:right;width:min(45%,200px);margin:0 0 1rem 1.5rem;">

<div style="overflow:hidden;"><table class="table table-bordered table-sm" style="margin-bottom:1rem;">
  <thead><tr><th>Component</th><th>Description</th><th style="text-align:right">Price</th></tr></thead>
  <tbody>
    <tr><td><a href="https://www.minidsp.com/products/usb-audio-interface/uma-16-microphone-array">miniDSP UMA-16 v2</a></td><td>Acoustic camera with a 16-channel USB mic array and a 1080p camera.</td><td style="text-align:right">$199.99</td></tr>
    <tr><td><a href="https://www.microcenter.com/product/673711/raspberry-pi-5">Raspberry Pi 5 (8GB)</a></td><td>Main compute board responsible for running the recording pipeline. Data processing can be done offline if necessary.</td><td style="text-align:right">$89.99</td></tr>
    <tr><td><a href="https://www.microcenter.com/product/687338/product">Raspberry Pi Touch Display 2</a></td><td>Touchscreen for monitoring and controlling recording sessions in the field without needing a separate laptop.</td><td style="text-align:right">$59.99</td></tr>
    <tr><td><a href="https://www.amazon.com/dp/B09VPHVT2Z">Anker 737 Power Bank</a></td><td>140W, 24,000mAh portable battery. Powers everything outdoors for extended untethered sessions.</td><td style="text-align:right">$109.99</td></tr>
    <tr><td><a href="https://www.amazon.com/dp/B0CYPRDY9Q">GeeekPi PD Power Expansion Board</a></td><td>Sits between the power bank and RPi 5, providing USB-C PD negotiation (the RPi 5 requires an unconventional 5V-5A supply), an always-on switch, and startup/shutdown control.</td><td style="text-align:right">$29.99</td></tr>
    <tr><td><a href="https://www.microcenter.com/product/671159/samsung-256gb-pro-ultimate-microsdxc-u3-v30-a2-flash-memory-card-with-adapter">Samsung 256GB PRO Ultimate microSDXC</a></td><td>High-speed storage. Estimated to hold up to 8 hours of recording at a time.</td><td style="text-align:right">$49.99</td></tr>
    <tr><td><a href="https://www.microcenter.com/product/671930/raspberry-pi-5-active-cooler">Raspberry Pi 5 Active Cooler</a></td><td>Keeps the RPi 5 from throttling during long outdoor recording sessions.</td><td style="text-align:right">$9.99</td></tr>
    <tr><td><a href="https://www.amazon.com/dp/B0CQP9S8Q2">Amazon Basics 64-inch Tripod</a></td><td>Mounts and positions the rig in the field with adjustable height and angle.</td><td style="text-align:right">$15.19</td></tr>
    <tr><td><a href="https://www.centralcomputer.com/mc-scw-114pc-114-piece-assorted-m2-5-standoffkit-for-raspberry-pi-and-single-boards.html">M2.5 Standoff Kit (114pc)</a></td><td>Mechanical hardware for stacking and securing the boards together.</td><td style="text-align:right">$11.95</td></tr>
    <tr><th>Total</th><th></th><th style="text-align:right">$577.07</th></tr>
  </tbody>
</table></div>

With taxes, tariffs, and shipping fees, my actual out-of-pocket came out to around $862.

To case the Raspberry Pi 5 along with the touchscreen and the power delivery board, I've used variants of the models by [Chaddles McGee](https://makerworld.com/en/@ChaddlesMcGee). Unfortunately, I can't share my edits due to licensing, but huge thanks to them for making their models public.

#### Software

The code powering the device is available at [https://github.com/tchittesh/nature-sense](https://github.com/tchittesh/nature-sense).

Currently, the data collection pipeline has three stages: **calibrate**, **record**, and **reprocess**.

**Calibration** (`calibrate.py`) is best run with the acoustic camera connected to a laptop. It displays a checkerboard pattern on the laptop screen and uses it to calibrate the intrinsics and distortion of the camera.

**Recording** (`record.py`) captures synchronized 16-channel audio from the [miniDSP UMA-16](https://www.minidsp.com/products/usb-audio-interface/uma-16) at 48 kHz and video at 60 FPS. Audio is stored in HDF5; video in MP4. A `sync.csv` logs per-frame timestamps and detects sample rate drift — one early session showed ~1.5% clock slew, which sync.csv catches and corrects for in postprocessing.

**Reprocessing** (`reprocess.py`) runs time-domain acoustic beamforming over a 20×20 grid (5m × 3m at 2m depth) targeting the 4000 Hz band, which is the frequency I produce on my phone for testing purposes. There is a visualization option that overlays the heatmap on the original video with a green crosshair at the most likely sound source.

<video src="/assets/video/data_collection_prototype_visualization.mp4" autoplay loop muted playsinline style="width:100%"></video>

A first test session captured about 50 seconds of synchronized audio and video (~169 MB audio, ~241 MB video). The phone, which is producing a 4000 Hz tone, is being tracked via beamforming, although there is a fair bit of noise, presumably due to indoor reflections and the limited region we're running the beamforming search over.

## Next Steps

Here's what I want to tackle next:
- attach RPi and power bank to tripod for more portability
- collect and process actual birdcall data!

Some thoughts in the back of my mind:
- How can I calibrate the extrinsics of the camera with respect to the microphone array? Will it be important to also finetune the microphone locations (from the CAD expected values) and gains as part of calibration?
- Will reflections be a problem in my backyard? If so, how can I deal with them?
- How will acoustic beamforming for sound separation compare with learned approaches like [SAM-Audio](https://ai.meta.com/research/samaudio/), [biodenoising](https://github.com/earthspecies/biodenoising-inference), and [BioCPPNet](https://github.com/earthspecies/cocktail-party-problem)?

One thing I realized is that we don't actually need to solve the full multi-source, unknown-frequency, unknown-location sound separation problem using beamforming alone. We can instead use the camera to detect and track all bird instances visually, and then use beamforming more simply to extract the directional audio corresponding to each track. This camera-guided approach sidesteps a hard blind source separation problem and replaces it with a much more tractable targeted one.
