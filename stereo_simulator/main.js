import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { PCDLoader } from "three/addons/loaders/PCDLoader.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

// Constants
const DEFAULT_NEAR_PLANE = 0.01;
const DEFAULT_FAR_PLANE = 200;
const DEFAULT_FOV = 75;
const DEFAULT_CAMERA_WIDTH = 1920;
const DEFAULT_CAMERA_HEIGHT = 1080;
const DEFAULT_STEREO_BASELINE = 5;

// Create the scene and renderer
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cameras = [];
const gui = new GUI();
gui.title("Stereo Simulator");

// Add a global camera counter to name new folders
let cameraCounter = 1;

// Add the main camera through which the user will view the scene
const mainCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 600);
mainCamera.position.set(50, 50, 50);
window.addEventListener("resize", () => {
  mainCamera.aspect = window.innerWidth / window.innerHeight;
  mainCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
scene.add(mainCamera);

const controls = new OrbitControls(mainCamera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI;

const gridHelper = new THREE.GridHelper(200, 20);
scene.add(gridHelper);
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

let scenePoints = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 0.1, color: 0xff0000 }));
scene.add(scenePoints);
const loader = new PCDLoader();
loader.load("bunny.pcd", (pcdData) => {
  scenePoints.geometry = pcdData.geometry;
  scenePoints.scale.set(100, 100, 100);
  scenePoints.needsUpdate = true;
  console.log("Loaded PCD file with ", pcdData.geometry.attributes.position.count, " points");
  updateProjections();
});

const rayGroup = new THREE.Group();
scene.add(rayGroup);

const intersectionGroup = new THREE.Group();
scene.add(intersectionGroup);

/**
 * Class representing a convex polyhedron defined by a set of half-planes
 * Each half-plane is defined by a normal vector and a distance from the origin
 */
class ConvexPolyhedron {
  /**
   * Create a convex polyhedron
   * @param {Array} halfPlanes - Array of half-planes, each defined as {normal: THREE.Vector3, constant: number}
   *                            where normal points outward and constant is the distance from origin
   */
  constructor(halfPlanes = []) {
    this.halfPlanes = halfPlanes;
  }

  /**
   * Add a half-plane to the polyhedron
   * @param {THREE.Vector3} normal - Normal vector pointing outward from the half-plane
   * @param {number} constant - Distance from the origin to the plane
   */
  addHalfPlane(normal, constant) {
    // Ensure the normal is normalized
    const normalizedNormal = normal.clone().normalize();
    this.halfPlanes.push({ normal: normalizedNormal, constant: constant });
  }

  /**
   * Check if a point is inside the polyhedron
   * @param {THREE.Vector3} point - The point to check
   * @returns {boolean} - True if the point is inside or on the boundary
   */
  containsPoint(point) {
    for (const plane of this.halfPlanes) {
      // For each half-plane, calculate signed distance
      // If distance > 0, point is outside this half-plane
      const distance = point.dot(plane.normal) - plane.constant;
      const EPSILON = 1e-10;
      if (distance > EPSILON) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculate the intersection of this polyhedron with another
   * @param {ConvexPolyhedron[]} polyhedra - The list of polyhedra to intersect
   * @returns {ConvexPolyhedron} - The intersection polyhedron
   */
  static intersect(polyhedra) {
    const combinedHalfPlanes = polyhedra.flatMap((polyhedron) => polyhedron.halfPlanes);
    return new ConvexPolyhedron(combinedHalfPlanes);
  }

  /**
   * Convert the polyhedron to a THREE.Mesh by finding all vertices at plane intersections
   * @param {THREE.Material} material - Material to use for the mesh
   * @returns {THREE.Mesh} - A mesh representation of the polyhedron
   */
  toMesh(material) {
    // Algorithm: Find all intersection points between triplets of half-planes
    // and keep only those that are inside the polyhedron
    const vertices = [];
    const n = this.halfPlanes.length;

    // Skip polyhedra with fewer than 3 half-planes
    if (n < 3) {
      console.warn("Polyhedron needs at least 3 half-planes to form a valid mesh");
      return null;
    }

    // For numerical stability
    const EPSILON = 1e-10;

    // Helper function to calculate the intersection of three planes
    const intersectThreePlanes = (plane1, plane2, plane3) => {
      // Extract normals and constants from planes
      const { normal: n1, constant: d1 } = plane1;
      const { normal: n2, constant: d2 } = plane2;
      const { normal: n3, constant: d3 } = plane3;

      // Create the coefficients matrix
      // [n1.x n1.y n1.z]   [x]   [d1]
      // [n2.x n2.y n2.z] * [y] = [d2]
      // [n3.x n3.y n3.z]   [z]   [d3]

      // Calculate determinant to check if the planes are linearly independent
      const det = n1.x * (n2.y * n3.z - n3.y * n2.z) - n1.y * (n2.x * n3.z - n3.x * n2.z) + n1.z * (n2.x * n3.y - n3.x * n2.y);

      // If determinant is too small, the planes are nearly parallel (no unique intersection)
      if (Math.abs(det) < EPSILON) {
        return null;
      }

      // Cramer's rule to solve the linear system
      const detX = d1 * (n2.y * n3.z - n3.y * n2.z) - n1.y * (d2 * n3.z - d3 * n2.z) + n1.z * (d2 * n3.y - d3 * n2.y);

      const detY = n1.x * (d2 * n3.z - d3 * n2.z) - d1 * (n2.x * n3.z - n3.x * n2.z) + n1.z * (n2.x * d3 - n3.x * d2);

      const detZ = n1.x * (n2.y * d3 - n3.y * d2) - n1.y * (n2.x * d3 - n3.x * d2) + d1 * (n2.x * n3.y - n3.x * n2.y);

      // Compute the intersection point
      const x = detX / det;
      const y = detY / det;
      const z = detZ / det;

      return new THREE.Vector3(x, y, z);
    };

    // Generate all possible triplets of half-planes
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          // Calculate intersection point of these three half-planes
          const intersection = intersectThreePlanes(this.halfPlanes[i], this.halfPlanes[j], this.halfPlanes[k]);

          // Skip if no intersection found
          if (!intersection) continue;

          // Check if this point is inside the polyhedron (satisfies all half-planes)
          if (this.containsPoint(intersection)) {
            // Add to vertices list, avoiding duplicates
            // Use a simple distance check to avoid adding very close points
            let isDuplicate = false;
            for (const existingVertex of vertices) {
              if (existingVertex.distanceTo(intersection) < EPSILON) {
                isDuplicate = true;
                break;
              }
            }

            if (!isDuplicate) {
              vertices.push(intersection);
            }
          }
        }
      }
    }

    // If no vertices found, the polyhedron might be unbounded or degenerate
    if (vertices.length === 0) {
      console.warn("No valid vertices found. The polyhedron may be unbounded or degenerate.");
      return null;
    }

    // If fewer than 4 vertices, can't form a proper 3D convex hull
    if (vertices.length < 4) {
      console.warn(`Only ${vertices.length} vertices found, not enough to form a 3D convex hull.`);
      return null;
    }

    // Create the convex geometry from the vertices
    const geometry = new ConvexGeometry(vertices);
    return new THREE.Mesh(geometry, material);
  }
}

/**
 * Compute a plane normal from three points. Points must be in counter-clockwise order
 * when viewed from the side of the plane that the normal points to.
 *
 * @param {THREE.Vector3} p1 - First point
 * @param {THREE.Vector3} p2 - Second point
 * @param {THREE.Vector3} p3 - Third point
 * @returns {THREE.Vector3} - The normalized normal vector
 */
function computePlaneNormal(p1, p2, p3) {
  const v1 = new THREE.Vector3().subVectors(p2, p1);
  const v2 = new THREE.Vector3().subVectors(p3, p1);
  return new THREE.Vector3().crossVectors(v1, v2).normalize();
}

/**
 * Compute a half-plane from three points. Points must be in counter-clockwise order
 * when viewed from the side of the plane that the normal points to.
 *
 * @param {THREE.Vector3} p1 - First point
 * @param {THREE.Vector3} p2 - Second point
 * @param {THREE.Vector3} p3 - Third point
 * @returns {Object} - An object with normal and constant properties
 */
function computeHalfPlane(p1, p2, p3) {
  const normal = computePlaneNormal(p1, p2, p3);
  const constant = normal.dot(p1);
  return { normal: normal, constant: constant };
}

// Predefined color palette that's highly visible on dark backgrounds
const colorPalette = [
  new THREE.Color(1, 0, 0), // Bright Red
  new THREE.Color(0, 1, 0), // Bright Green
  new THREE.Color(0, 0.5, 1), // Bright Blue
  new THREE.Color(1, 1, 0), // Yellow
  new THREE.Color(1, 0, 1), // Magenta
  new THREE.Color(0, 1, 1), // Cyan
  new THREE.Color(1, 0.5, 0), // Orange
  new THREE.Color(0.5, 0, 1), // Purple
  new THREE.Color(0, 0.8, 0.4), // Mint Green
  new THREE.Color(1, 0.8, 0.2), // Gold
  new THREE.Color(1, 0.4, 0.7), // Pink
  new THREE.Color(0.6, 0.9, 0.1), // Lime
];

function createCameraHelper(camera, color) {
  const cameraHelper = new THREE.CameraHelper(camera);

  const BLACK = new THREE.Color(0, 0, 0);

  // Apply color to the camera helper
  cameraHelper.setColors(color, BLACK, BLACK, BLACK, BLACK);
  // cameraHelper.material.color.copy(color);

  // // Modify the original line colors in the geometry
  // if (cameraHelper.geometry && cameraHelper.geometry.attributes.color) {
  //   const colors = cameraHelper.geometry.attributes.color;
  //   for (let i = 0; i < colors.count; i++) {
  //     colors.setXYZ(i, color.r, color.g, color.b);
  //   }
  //   colors.needsUpdate = true;
  // }

  return cameraHelper;
}

// Keep track of used colors to avoid duplication when possible
const usedColorIndices = new Set();

// Get a color from the palette, avoiding duplicates when possible
function getColorFromPalette() {
  // Reset used colors if we've used them all
  if (usedColorIndices.size >= colorPalette.length) {
    usedColorIndices.clear();
  }

  // Find an unused color
  let colorIndex;
  do {
    colorIndex = Math.floor(Math.random() * colorPalette.length);
  } while (usedColorIndices.has(colorIndex) && usedColorIndices.size < colorPalette.length);

  // Mark as used
  usedColorIndices.add(colorIndex);

  // Return the color
  return colorPalette[colorIndex];
}

/**
 * Create a default camera.
 *
 * Does not add the camera helper to the scene! The caller must add the camera helper to the scene
 * manually if desired.
 *
 * @returns {Object} - An object containing the camera, width, height, color, and camera helper.
 */
function defaultCamera() {
  const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, window.innerWidth / window.innerHeight, DEFAULT_NEAR_PLANE, DEFAULT_FAR_PLANE);
  camera.position.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);

  // Set initial aspect ratio based on resolution
  camera.aspect = DEFAULT_CAMERA_WIDTH / DEFAULT_CAMERA_HEIGHT;
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  const color = getColorFromPalette();
  const cameraHelper = createCameraHelper(camera, color);

  return {
    isStereo: false,
    camera: camera,
    width: DEFAULT_CAMERA_WIDTH,
    height: DEFAULT_CAMERA_HEIGHT,
    color: color,
    cameraHelper: cameraHelper,
  };
}

function updateStereoCamera(stereoCamera, baseCamera) {
  // Copy essential camera properties to left and right cameras
  stereoCamera.cameraL.near = baseCamera.near;
  stereoCamera.cameraL.far = baseCamera.far;
  stereoCamera.cameraR.near = baseCamera.near;
  stereoCamera.cameraR.far = baseCamera.far;
  stereoCamera.cameraL.fov = baseCamera.fov;
  stereoCamera.cameraR.fov = baseCamera.fov;
  stereoCamera.cameraL.userData = baseCamera.userData;
  stereoCamera.cameraR.userData = baseCamera.userData;
  stereoCamera.cameraL.aspect = baseCamera.aspect;
  stereoCamera.cameraR.aspect = baseCamera.aspect;

  // Then update the stereo camera with the base camera
  baseCamera.updateProjectionMatrix();
  stereoCamera.update(baseCamera);

  // Update projection and world matrices for both cameras
  stereoCamera.cameraL.updateMatrixWorld();
  stereoCamera.cameraL.updateProjectionMatrix();
  stereoCamera.cameraR.updateMatrixWorld();
  stereoCamera.cameraR.updateProjectionMatrix();
}

/**
 * Create a default stereo camera.
 *
 * Does not add the camera helpers to the scene! The caller must add the camera helpers to the scene
 * manually if desired.
 *
 * @returns {Object} - An object containing the stereo camera, width, height, left color, right color,
 * and left and right camera helpers.
 */
function defaultStereoCamera() {
  let { camera, width, height } = defaultCamera();
  const stereoCamera = new THREE.StereoCamera();
  stereoCamera.eyeSep = DEFAULT_STEREO_BASELINE;
  updateStereoCamera(stereoCamera, camera);

  const leftColor = getColorFromPalette();
  const rightColor = getColorFromPalette();
  const leftCameraHelper = createCameraHelper(stereoCamera.cameraL, leftColor);
  const rightCameraHelper = createCameraHelper(stereoCamera.cameraR, rightColor);

  return {
    isStereo: true,
    camera: camera,
    stereoCamera: stereoCamera,
    width: width,
    height: height,
    leftColor: leftColor,
    rightColor: rightColor,
    leftCameraHelper: leftCameraHelper,
    rightCameraHelper: rightCameraHelper,
  };
}

function updateCamera(camera) {
  camera.camera.aspect = camera.width / camera.height;
  camera.camera.updateMatrixWorld();
  camera.camera.updateProjectionMatrix();
  if (camera.isStereo) {
    updateStereoCamera(camera.stereoCamera, camera.camera);
    camera.leftCameraHelper.camera = camera.stereoCamera.cameraL;
    camera.rightCameraHelper.camera = camera.stereoCamera.cameraR;
    camera.leftCameraHelper.update();
    camera.rightCameraHelper.update();
  } else {
    camera.cameraHelper.update();
  }

  updateProjections();
}

function deleteCamera(camera, folder) {
  // Remove camera helpers from scene
  if (camera.isStereo) {
    scene.remove(camera.leftCameraHelper);
    scene.remove(camera.rightCameraHelper);
  } else {
    scene.remove(camera.cameraHelper);
  }

  // Remove camera from global cameras array
  const camIndex = cameras.indexOf(camera);
  console.assert(camIndex > -1, "deleteCamera: Camera not found");
  cameras.splice(camIndex, 1);

  // Destroy the GUI folder
  folder.destroy();

  // Update projections
  updateProjections();
}

function updateGUI(camera) {
  let folderName = camera.isStereo ? `Stereo Camera ${cameraCounter}` : `Camera ${cameraCounter}`;
  cameraCounter++;

  const folder = gui.addFolder(folderName);

  // Apply CSS styling to the folder title
  const folderElement = folder.domElement;
  const titleElement = folderElement.querySelector(".title");
  titleElement.style.color = "#000000";
  titleElement.style.fontWeight = "bold";
  if (camera.isStereo) {
    titleElement.style.background = `linear-gradient(90deg, rgb(${camera.leftColor.r * 255}, ${camera.leftColor.g * 255}, ${
      camera.leftColor.b * 255
    }), rgb(${camera.rightColor.r * 255}, ${camera.rightColor.g * 255}, ${camera.rightColor.b * 255}))`;
  } else {
    titleElement.style.background = `rgb(${camera.color.r * 255}, ${camera.color.g * 255}, ${camera.color.b * 255})`;
  }

  folder
    .add(camera.camera.position, "x", -100, 100)
    .name("Position X")
    .onChange(() => updateCamera(camera));
  folder
    .add(camera.camera.position, "y", -100, 100)
    .name("Position Y")
    .onChange(() => updateCamera(camera));
  folder
    .add(camera.camera.position, "z", -100, 100)
    .name("Position Z")
    .onChange(() => updateCamera(camera));
  folder
    .add(camera.camera.rotation, "x", -Math.PI, Math.PI)
    .name("Rotation X")
    .onChange(() => updateCamera(camera));
  folder
    .add(camera.camera.rotation, "y", -Math.PI, Math.PI)
    .name("Rotation Y")
    .onChange(() => updateCamera(camera));
  folder
    .add(camera.camera.rotation, "z", -Math.PI, Math.PI)
    .name("Rotation Z")
    .onChange(() => updateCamera(camera));
  folder
    .add(camera.camera, "fov", 10, 120)
    .name("Field of View")
    .onChange(() => updateCamera(camera));
  folder
    .add(camera, "width", 240, 3840)
    .step(1)
    .name("Width")
    .onChange(() => updateCamera(camera));
  folder
    .add(camera, "height", 135, 2160)
    .step(1)
    .name("Height")
    .onChange(() => updateCamera(camera));
  if (camera.isStereo) {
    folder
      .add(camera.stereoCamera, "eyeSep", 0.1, 10)
      .name("Baseline")
      .onChange(() => updateCamera(camera));
  }
  folder.add({ delete: () => deleteCamera(camera, folder) }, "delete").name("Delete");

  folder.open();
}

function addCamera() {
  const camera = defaultCamera();
  scene.add(camera.cameraHelper);
  cameras.push(camera);
  updateGUI(camera);
  updateProjections();
}

function addStereoCamera() {
  const camera = defaultStereoCamera();
  scene.add(camera.leftCameraHelper);
  scene.add(camera.rightCameraHelper);
  cameras.push(camera);
  updateGUI(camera);
  updateProjections();
}

/**
 * Update the projections of all cameras
 */
function updateProjections() {
  // Clear existing ray frustums
  rayGroup.clear();
  intersectionGroup.clear();

  // Flatten all cameras into a single array (destructure stereo cameras into two separate cameras)
  let allCameras = [];
  for (const camera of cameras) {
    if (camera.isStereo) {
      allCameras.push({
        camera: camera.stereoCamera.cameraL,
        width: camera.width,
        height: camera.height,
        color: camera.leftColor,
      });
      allCameras.push({
        camera: camera.stereoCamera.cameraR,
        width: camera.width,
        height: camera.height,
        color: camera.rightColor,
      });
    } else {
      allCameras.push(camera);
    }
  }

  const positionAttribute = scenePoints.geometry.getAttribute("position");
  const point = new THREE.Vector3();
  for (let i = 0; i < positionAttribute.count; i++) {
    point.fromBufferAttribute(positionAttribute, i);
    point.applyMatrix4(scenePoints.matrixWorld);

    let rayPolyhedra = [];
    for (const camera of allCameras) {
      const proj = projectPointToUV(point, camera.camera, camera.width, camera.height);
      if (!proj.isVisible) continue;
      const rayPolyhedron = createSquarePyramidForPixelInCamera(camera.camera, proj.pixelCoords.x, proj.pixelCoords.y, camera.width, camera.height);
      if (!rayPolyhedron) continue;

      // Create material for the ray frustum
      const material = new THREE.MeshBasicMaterial({
        color: camera.color,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      rayPolyhedra.push(rayPolyhedron);
      rayGroup.add(rayPolyhedron.toMesh(material));
    }

    // Compute the intersection of all ray frustums
    const intersection = ConvexPolyhedron.intersect(rayPolyhedra);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const intersectionMesh = intersection.toMesh(material);
    if (intersectionMesh) {
      intersectionGroup.add(intersectionMesh);
    }
  }
}

/**
 * Project a 3D point to 2D UV coordinates in a camera's view
 *
 * @param {THREE.Vector3|Object} point - The point to project, either a THREE.Vector3 or an object with x, y, z properties
 * @param {THREE.PerspectiveCamera} camera - The camera to project the point to
 * @param {number} width - The width of the camera
 * @param {number} height - The height of the camera
 * @returns {Object} - An object with uv, ndc, pixelCoords, and isVisible properties
 */
function projectPointToUV(point, camera, width, height) {
  // Create a vector from the input point
  const worldPoint = point instanceof THREE.Vector3 ? point.clone() : new THREE.Vector3(point.x, point.y, point.z);

  // Create a vector for the projected point
  const projectedPoint = worldPoint.clone();

  // Transform the point to the camera's local space
  projectedPoint.project(camera);

  // Convert from normalized device coordinates (-1 to +1) to UV coordinates (0 to 1)
  const uv = {
    u: (projectedPoint.x + 1) / 2,
    v: (-projectedPoint.y + 1) / 2,
  };

  // Calculate pixel coordinates based on camera resolution
  const pixelCoords = {
    x: Math.round(uv.u * width),
    y: Math.round(uv.v * height),
  };

  // Check if the point is within the camera's view (NDC coordinates are between -1 and 1 for x and y)
  // And the point is in front of the camera (z value in NDC space is between -1 and 1)
  // For the pixel to be visible, it must be within the viewport (0 to resolution width/height)
  const isVisible =
    projectedPoint.z >= -1 &&
    projectedPoint.z <= 1 && // In front of camera, between near and far planes
    projectedPoint.x >= -1 &&
    projectedPoint.x <= 1 && // Within horizontal view
    projectedPoint.y >= -1 &&
    projectedPoint.y <= 1 && // Within vertical view
    pixelCoords &&
    pixelCoords.x >= 0 &&
    pixelCoords.y >= 0 &&
    pixelCoords.x < width &&
    pixelCoords.y < height;

  return {
    uv, // Normalized coordinates (0-1)
    ndc: {
      // Normalized device coordinates (-1 to +1)
      x: projectedPoint.x,
      y: projectedPoint.y,
      z: projectedPoint.z,
    },
    pixelCoords, // Pixel coordinates if camera has resolution info
    isVisible, // Whether the point is in front of the camera and within frustum
  };
}

/**
 * Create a ray frustum mesh for a specific pixel coordinate in a camera
 *
 * @param {THREE.PerspectiveCamera} camera - The camera to create the ray frustum for
 * @param {number} pixelX - The x coordinate of the pixel in the camera
 * @param {number} pixelY - The y coordinate of the pixel in the camera
 * @param {number} width - The width of the camera
 * @param {number} height - The height of the camera
 * @returns {ConvexPolyhedron} - A square pyramid representing a pixel's field of view in world space
 */
function createSquarePyramidForPixelInCamera(camera, pixelX, pixelY, width, height) {
  // Convert pixel coordinates to UV coordinates
  const uv = {
    u: pixelX / width,
    v: pixelY / height,
  };

  // Calculate pixel dimensions in NDC space
  const pixelWidthNDC = 2.0 / width;
  const pixelHeightNDC = 2.0 / height;

  // Convert UV to normalized device coordinates (-1 to 1) for the pixel center
  const ndcX = uv.u * 2 - 1;
  const ndcY = -(uv.v * 2) + 1;

  // Calculate the corners of the pixel in NDC space
  const ndcLeft = ndcX - pixelWidthNDC / 2;
  const ndcRight = ndcX + pixelWidthNDC / 2;
  const ndcTop = ndcY + pixelHeightNDC / 2;
  const ndcBottom = ndcY - pixelHeightNDC / 2;

  // Convert NDC coordinates to world space
  const unprojectNDC = (ndcPoint) => {
    // Create a Vector4 for matrix operations
    const clipCoord = new THREE.Vector4(ndcPoint.x, ndcPoint.y, ndcPoint.z, 1.0);

    // Create matrices for unprojecting
    const invProjMatrix = camera.projectionMatrixInverse.clone();
    const matrixWorld = camera.matrixWorld.clone();

    // Apply inverse projection matrix to get to view space
    clipCoord.applyMatrix4(invProjMatrix);

    // Normalize by w component
    const viewCoord = new THREE.Vector3(clipCoord.x / clipCoord.w, clipCoord.y / clipCoord.w, clipCoord.z / clipCoord.w);

    // Apply camera's world matrix to get to world space
    viewCoord.applyMatrix4(matrixWorld);

    return viewCoord;
  };

  // Camera center in world space
  // Hack: Assume the near plane is very close to the camera
  const cameraCenter = unprojectNDC(new THREE.Vector3(0, 0, 0));

  // Corner points at far plane
  const farTopLeft = unprojectNDC(new THREE.Vector3(ndcLeft, ndcTop, 1));
  const farTopRight = unprojectNDC(new THREE.Vector3(ndcRight, ndcTop, 1));
  const farBottomLeft = unprojectNDC(new THREE.Vector3(ndcLeft, ndcBottom, 1));
  const farBottomRight = unprojectNDC(new THREE.Vector3(ndcRight, ndcBottom, 1));

  const halfPlanes = [
    // sides of the pyramid
    computeHalfPlane(cameraCenter, farTopLeft, farBottomLeft), // left
    computeHalfPlane(cameraCenter, farBottomLeft, farBottomRight), // bottom
    computeHalfPlane(cameraCenter, farBottomRight, farTopRight), // right
    computeHalfPlane(cameraCenter, farTopRight, farTopLeft), // top
    // base of the pyramid
    computeHalfPlane(farTopLeft, farTopRight, farBottomRight),
  ];
  return new ConvexPolyhedron(halfPlanes);
}

// Setup GUI controls
gui.add({ addCamera }, "addCamera").name("Add Camera");
gui.add({ addStereoCamera }, "addStereoCamera").name("Add Stereo Camera");
const advancedFolder = gui.addFolder("Advanced");
advancedFolder.add(rayGroup, "visible").name("Show Rays");
advancedFolder.add(intersectionGroup, "visible").name("Show Intersection");
advancedFolder.add(scenePoints, "visible").name("Show Scene Points");
advancedFolder.close();

renderer.domElement.addEventListener("click", onClick, false);
let mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const infoDisplay = document.getElementById("intersection-info");

function onClick() {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, mainCamera);

  const intersects = raycaster.intersectObject(intersectionGroup, true);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    // display info about the xyz bounding box of the intersection as a tooltip
    const bounds = new THREE.Box3().setFromObject(object);
    infoDisplay.innerHTML = `Triangulation Dimensions:<br>X: ${bounds.max.x - bounds.min.x}<br>Y: ${bounds.max.y - bounds.min.y}<br>Z: ${
      bounds.max.z - bounds.min.z
    }`;
    infoDisplay.style.display = "block";

    // change the color of the intersection to a random color to give the user
    // some visual feedback on which intersection they clicked on
    object.material.color.set(Math.random() * 0xffffff);
  }
}

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  controls.update();
  renderer.render(scene, mainCamera);
  stats.end();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
