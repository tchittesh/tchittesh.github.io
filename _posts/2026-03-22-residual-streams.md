---
layout: post
title: A Shallow Perspective on Deep Neural Nets
date: 2026-03-22 00:00:00-0000
description: Redrawing deep residual networks to reveal their hidden shallow gradient flow
tags: deep-learning transformers
categories: explainer
related_posts: false
tikzjax: true
og_image: assets/img/posts/residual-streams-thumbnail.png
---

<style>
html[data-theme="dark"] .post-content svg {
  filter: invert(1);
}
.footnotes {
  font-size: 0.85em;
  line-height: 0.85em;
}
.footnotes ol {
  padding-left: 1.5em;
}
.footnotes li {
  margin-bottom: 0;
}
</style>

Deep neural networks are usually drawn like this — stacked layer by layer.

<script type="text/tikz">
\begin{document}
\begin{tikzpicture}[
  conv/.style={draw, rectangle, rounded corners=2pt, minimum width=1.3cm, minimum height=0.5cm, font=\scriptsize, fill=white},
  circ/.style={draw, circle, minimum size=0.42cm, inner sep=0pt, font=\footnotesize, fill=white}
]

\draw[opacity=0] (-1.5, -1) rectangle (3, 13.5);

%% Vertical spacing 3.0cm per block. Conv centers at y = block_base + 1.0 and + 2.0.

\node[circ] (L0) at (0,  0.0) {$+$};
\node[circ] (L1) at (0,  3.0) {$+$};
\node[circ] (L2) at (0,  6.0) {$+$};
\node[circ] (L3) at (0,  9.0) {$+$};
\node[circ] (L4) at (0, 12.0) {$+$};

\node[conv] (lc00) at (0,  1.0) {BN-ReLU-Conv};
\node[conv] (lc01) at (0,  2.0) {BN-ReLU-Conv};
\node[conv] (lc10) at (0,  4.0) {BN-ReLU-Conv};
\node[conv] (lc11) at (0,  5.0) {BN-ReLU-Conv};
\node[conv] (lc20) at (0,  7.0) {BN-ReLU-Conv};
\node[conv] (lc21) at (0,  8.0) {BN-ReLU-Conv};
\node[conv] (lc30) at (0, 10.0) {BN-ReLU-Conv};
\node[conv] (lc31) at (0, 11.0) {BN-ReLU-Conv};

\draw[->] (0, -0.55) -- (L0);
\node[left, font=\small] at (0, -0.55) {$\mathbf{x}_0$};

\draw[->] (L0)   -- (lc00);
\draw[->] (lc00) -- (lc01);
\draw[->] (lc01) -- (L1);

\draw[->] (L1)   -- (lc10);
\draw[->] (lc10) -- (lc11);
\draw[->] (lc11) -- (L2);

\draw[->] (L2)   -- (lc20);
\draw[->] (lc20) -- (lc21);
\draw[->] (lc21) -- (L3);

\draw[->] (L3)   -- (lc30);
\draw[->] (lc30) -- (lc31);
\draw[->] (lc31) -- (L4);

\draw[->] (L4) -- (0, 12.6);
\node[left, font=\small] at (0, 12.6) {$\mathbf{x}_L$};

%% skip arcs (right side, same-x nodes — out=0, in=0 produces a rightward bow)
\draw[->] (L0.east) to[out=0, in=0, looseness=2.5] (L1.east);
\draw[->] (L1.east) to[out=0, in=0, looseness=2.5] (L2.east);
\draw[->] (L2.east) to[out=0, in=0, looseness=2.5] (L3.east);
\draw[->] (L3.east) to[out=0, in=0, looseness=2.5] (L4.east);

\node[font=\small, align=center] at (0.75, 13.2) {"Deep" ResNet-V2};

\end{tikzpicture}
\end{document}
</script>

<script type="text/tikz">
\begin{document}
\begin{tikzpicture}[
  block/.style={draw, rectangle, rounded corners=2pt, minimum width=1.3cm, minimum height=0.5cm, font=\scriptsize, fill=white},
  circ/.style={draw, circle, minimum size=0.42cm, inner sep=0pt, font=\footnotesize, fill=white}
]

\draw[opacity=0] (-1.5, -1) rectangle (3, 13.5);

%% 7 sum nodes, spacing 2.0cm
\node[circ] (L0) at (0,  0) {$+$};
\node[circ] (L1) at (0,  2) {$+$};
\node[circ] (L2) at (0,  4) {$+$};
\node[circ] (L3) at (0,  6) {$+$};
\node[circ] (L4) at (0,  8) {$+$};
\node[circ] (L5) at (0, 10) {$+$};
\node[circ] (L6) at (0, 12) {$+$};

%% 6 sublayer boxes alternating LN-Attn / LN-MLP
\node[block] (s0) at (0,  1) {LN-Attn};
\node[block] (s1) at (0,  3) {LN-MLP};
\node[block] (s2) at (0,  5) {LN-Attn};
\node[block] (s3) at (0,  7) {LN-MLP};
\node[block] (s4) at (0,  9) {LN-Attn};
\node[block] (s5) at (0, 11) {LN-MLP};

%% Input
\draw[->] (0, -0.55) -- (L0);
\node[left, font=\small] at (0, -0.55) {$\mathbf{x}_0$};

%% Vertical connections through sublayers
\draw[->] (L0) -- (s0);
\draw[->] (s0) -- (L1);
\draw[->] (L1) -- (s1);
\draw[->] (s1) -- (L2);
\draw[->] (L2) -- (s2);
\draw[->] (s2) -- (L3);
\draw[->] (L3) -- (s3);
\draw[->] (s3) -- (L4);
\draw[->] (L4) -- (s4);
\draw[->] (s4) -- (L5);
\draw[->] (L5) -- (s5);
\draw[->] (s5) -- (L6);

%% Output
\draw[->] (L6) -- (0, 12.6);
\node[left, font=\small] at (0, 12.6) {$\mathbf{x}_L$};

%% Skip arcs (right side)
\draw[->] (L0.east) to[out=0, in=0, looseness=2.5] (L1.east);
\draw[->] (L1.east) to[out=0, in=0, looseness=2.5] (L2.east);
\draw[->] (L2.east) to[out=0, in=0, looseness=2.5] (L3.east);
\draw[->] (L3.east) to[out=0, in=0, looseness=2.5] (L4.east);
\draw[->] (L4.east) to[out=0, in=0, looseness=2.5] (L5.east);
\draw[->] (L5.east) to[out=0, in=0, looseness=2.5] (L6.east);

\node[font=\small, align=center] at (0.75, 13.2) {"Deep" Pre-LN Transformer};

\end{tikzpicture}
\end{document}
</script>

But we can redraw the same computation with all the blocks running in parallel... and the topology now looks shallow!

<script type="text/tikz">
\begin{document}
\begin{tikzpicture}[
  conv/.style={draw, rectangle, rounded corners=2pt, minimum width=1.3cm, minimum height=0.5cm, font=\scriptsize, fill=white},
  circ/.style={draw, circle, minimum size=0.42cm, inner sep=0pt, font=\footnotesize, fill=white}
]

\draw[opacity=0] (-1.5, -1) rectangle (16, 6);

\node[conv] (lc00) at (2.0,  2.0) {BN-ReLU-Conv};
\node[conv] (lc01) at (2.0,  3.0) {BN-ReLU-Conv};
\node[conv] (lc10) at (6.0,  2.0) {BN-ReLU-Conv};
\node[conv] (lc11) at (6.0,  3.0) {BN-ReLU-Conv};
\node[conv] (lc20) at (10.0,  2.0) {BN-ReLU-Conv};
\node[conv] (lc21) at (10.0,  3.0) {BN-ReLU-Conv};
\node[conv] (lc30) at (14.0,  2.0) {BN-ReLU-Conv};
\node[conv] (lc31) at (14.0,  3.0) {BN-ReLU-Conv};

\node[circ] (L0) at (0.0,  4.0) {$+$};
\node[circ] (L1) at (6.0,  1.0) {$+$};
\node[circ] (L2) at (10.0,  1.0) {$+$};
\node[circ] (L3) at (14.0,  1.0) {$+$};

%% 1. Upward arrows between the two conv layers in each block
\draw[->] (lc00) -- (lc01);
\draw[->] (lc10) -- (lc11);
\draw[->] (lc20) -- (lc21);
\draw[->] (lc30) -- (lc31);

%% 2. Curved arrows from top of each block's upper conv layer back to L0.
%% Both control points sit at y=4.0 so the bezier stays at or below y=4
%% and arrives at L0 horizontally (tangent to y=4).
\draw[->] (lc01.north) .. controls (2.0, 4.0) and (1.0, 4.0)  .. (L0);
\draw[->] (lc11.north) .. controls (6.0, 4.0) and (3.0, 4.0)  .. (L0);
\draw[->] (lc21.north) .. controls (10.0, 4.0) and (5.0, 4.0) .. (L0);
\draw[->] (lc31.north) .. controls (14.0, 4.0) and (7.0, 4.0) .. (L0);

%% 3. Upward arrows from junction nodes to the first conv layer above each
\draw[->] (L1) -- (lc10);
\draw[->] (L2) -- (lc20);
\draw[->] (L3) -- (lc30);

%% 4. Curved arrows from top of lcx1 to the left of L(x+1).
%% Each arrow is split into 3 segments so the curve passes through
%% the midpoint between lcx1/lc(x+1)1 at y=3.0, then the midpoint
%% between lcx0/lc(x+1)0 at y=2.0, then down to L(x+1).west.
\draw[->] (lc01.north)
  .. controls (2.5, 3.8) and (4.0, 3.5) .. (4.0, 3.0)
  -- (4.0, 2.0)
  .. controls (4.0, 1.5) and (4.0, 1.0) .. (L1.west);
\draw[->] (lc11.north)
  .. controls (6.5, 3.8) and (8.0, 3.5) .. (8.0, 3.0)
  -- (8.0, 2.0)
  .. controls (8.0, 1.5) and (8.0, 1.0) .. (L2.west);
\draw[->] (lc21.north)
  .. controls (10.5, 3.8) and (12.0, 3.5) .. (12.0, 3.0)
  -- (12.0, 2.0)
  .. controls (12.0, 1.5) and (12.0, 1.0) .. (L3.west);

%% 5. Input at (0,0): one branch up-right to lc00, one branch to lc00 computation start.
\draw[->] (0, 0.5) -- (L0.south);
\node[left, font=\small] at (0, 0.5) {$\mathbf{x}_0$};

%% Input feeds block 0's first conv
\draw[->] (0, 1) to[out=0, in=270] (lc00.south);

%% 6. Residual/skip arrows (identity path bypassing each block).
%% Skip block 0: x_0 straight to L1
\draw[->] (0, 1) -- (L1.west);
%% Skip block 1: L1 to L2 (horizontal)
\draw[->] (L1.east) -- (L2.west);
%% Skip block 2: L2 to L3 (horizontal)
\draw[->] (L2.east) -- (L3.west);

%% Output from L0
\draw[->] (L0.north) -- (0, 5.0);
\node[left, font=\small] at (0, 5.0) {$\mathbf{x}_L$};

\node[font=\small, align=center] at (7.0, 5.6) {"Shallow" ResNet-V2};

\end{tikzpicture}
\end{document}
</script>

<script type="text/tikz">
\begin{document}
\begin{tikzpicture}[
  block/.style={draw, rectangle, rounded corners=2pt, minimum width=1.1cm, minimum height=0.5cm, font=\scriptsize, fill=white},
  circ/.style={draw, circle, minimum size=0.42cm, inner sep=0pt, font=\footnotesize, fill=white}
]

\draw[opacity=0] (-1.5, -0.5) rectangle (19, 5.0);

%% 6 sublayer boxes (single box per column) at y=2
\node[block] (s0) at (2.0,  2.0) {LN-Attn};
\node[block] (s1) at (5.0,  2.0) {LN-MLP};
\node[block] (s2) at (8.0,  2.0) {LN-Attn};
\node[block] (s3) at (11.0, 2.0) {LN-MLP};
\node[block] (s4) at (14.0, 2.0) {LN-Attn};
\node[block] (s5) at (17.0, 2.0) {LN-MLP};

%% Output sum node and junction nodes
\node[circ] (L0) at (0.0, 3.0) {$+$};
\node[circ] (L1) at (5.0, 1.0) {$+$};
\node[circ] (L2) at (8.0, 1.0) {$+$};
\node[circ] (L3) at (11.0, 1.0) {$+$};
\node[circ] (L4) at (14.0, 1.0) {$+$};
\node[circ] (L5) at (17.0, 1.0) {$+$};

%% 1. Upward arrows from junction nodes to sublayer boxes above
\draw[->] (L1) -- (s1);
\draw[->] (L2) -- (s2);
\draw[->] (L3) -- (s3);
\draw[->] (L4) -- (s4);
\draw[->] (L5) -- (s5);

%% 2. Curved arrows from sublayer tops back to L0 (output sum).
%% Both control points at y=3.0 so curves stay at or below y=3.
\draw[->] (s0.north) .. controls (2.0, 3.0) and (1.0, 3.0)   .. (L0);
\draw[->] (s1.north) .. controls (5.0, 3.0) and (2.0, 3.0)   .. (L0);
\draw[->] (s2.north) .. controls (8.0, 3.0) and (3.0, 3.0)   .. (L0);
\draw[->] (s3.north) .. controls (11.0, 3.0) and (4.0, 3.0)  .. (L0);
\draw[->] (s4.north) .. controls (14.0, 3.0) and (5.0, 3.0)  .. (L0);
\draw[->] (s5.north) .. controls (17.0, 3.0) and (6.0, 3.0)  .. (L0);

%% 3. Curved arrows from sublayer tops to next junction node.
%% Each passes through the midpoint x between adjacent columns.
\draw[->] (s0.north)
  .. controls (2.5, 2.8) and (3.5, 2.5) .. (3.5, 2.0)
  .. controls (3.5, 1.5) and (3.5, 1.0) .. (L1.west);
\draw[->] (s1.north)
  .. controls (5.5, 2.8) and (6.5, 2.5) .. (6.5, 2.0)
  .. controls (6.5, 1.5) and (6.5, 1.0) .. (L2.west);
\draw[->] (s2.north)
  .. controls (8.5, 2.8) and (9.5, 2.5) .. (9.5, 2.0)
  .. controls (9.5, 1.5) and (9.5, 1.0) .. (L3.west);
\draw[->] (s3.north)
  .. controls (11.5, 2.8) and (12.5, 2.5) .. (12.5, 2.0)
  .. controls (12.5, 1.5) and (12.5, 1.0) .. (L4.west);
\draw[->] (s4.north)
  .. controls (14.5, 2.8) and (15.5, 2.5) .. (15.5, 2.0)
  .. controls (15.5, 1.5) and (15.5, 1.0) .. (L5.west);

%% 4. Input x_0
\draw[->] (0, 0.5) -- (L0.south);
\node[left, font=\small] at (0, 0.5) {$\mathbf{x}_0$};

%% Input feeds first sublayer
\draw[->] (0, 1) to[out=0, in=270] (s0.south);

%% 5. Residual/skip arrows (identity path along y=1)
\draw[->] (0, 1) -- (L1.west);
\draw[->] (L1.east) -- (L2.west);
\draw[->] (L2.east) -- (L3.west);
\draw[->] (L3.east) -- (L4.west);
\draw[->] (L4.east) -- (L5.west);

%% 6. Output from L0
\draw[->] (L0.north) -- (0, 4.0);
\node[left, font=\small] at (0, 4.0) {$\mathbf{x}_L$};

\node[font=\small, align=center] at (8.75, 4.7) {"Shallow" Pre-LN Transformer};

\end{tikzpicture}
\end{document}
</script>

In this parallel view, every block has a direct subpath from input to output in just one hop regardless of the total depth of the network. These shallower routes for gradient flow help explain how this structure addresses the vanishing gradient problem to stabilize and speed up model training.

It's worth noting that deep neural networks weren't always like this.
Early ResNets[^1] placed ReLUs, and early Transformers[^2] placed LayerNorms, between residuals, both of which "pollute" the residual stream and the backward gradient flows.
The fact that modern variants across language modeling and computer vision (Pre-LN Transformer[^3], ResNet-V2[^4], ConvNeXt[^5]) have converged to this (more elegant) design seems highly statistically significant.

Of course, now frontier labs are experimenting with mechanisms like mHC and attention residuals to improve on the limitations of the current paradigm, such as exploding activations.
Does this parallel view visualization extend to those architectures?

**References**

[^1]: He et al., [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385), CVPR 2016.
[^2]: Vaswani et al., [Attention Is All You Need](https://arxiv.org/abs/1706.03762), NeurIPS 2017.
[^3]: Xiong et al., [On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745), ICML 2020.
[^4]: He et al., [Identity Mappings in Deep Residual Networks](https://arxiv.org/abs/1603.05027), ECCV 2016.
[^5]: Liu et al., [A ConvNet for the 2020s](https://arxiv.org/abs/2201.03545), CVPR 2022.
