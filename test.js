import * as THREE from "./three.module.js";

import { PointerLockControls } from "./PointerLockControls.js";

var camera, scene, renderer, controls;

var objects = [];

var raycaster;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.y = 10;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 0, 750);

  var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  function initControls() {
    controls = new PointerLockControls(camera, document.body);

    var blocker = document.getElementById("blocker");
    var instructions = document.getElementById("instructions");

    instructions.addEventListener(
      "click",
      function () {
        controls.lock();
      },
      false
    );

    controls.addEventListener("lock", function () {
      instructions.style.display = "none";
      blocker.style.display = "none";
    });

    controls.addEventListener("unlock", function () {
      blocker.style.display = "block";
      instructions.style.display = "";
    });

    scene.add(controls.getObject());

    var onKeyDown = function (event) {
      switch (event.keyCode) {
        case 38: // up
        case 87: // w
          moveForward = true;
          break;

        case 37: // left
        case 65: // a
          moveLeft = true;
          break;

        case 40: // down
        case 83: // s
          moveBackward = true;
          break;

        case 39: // right
        case 68: // d
          moveRight = true;
          break;

        case 32: // space
          if (canJump === true) velocity.y += 350;
          canJump = false;
          break;
      }
    };

    var onKeyUp = function (event) {
      switch (event.keyCode) {
        case 38: // up
        case 87: // w
          moveForward = false;
          break;

        case 37: // left
        case 65: // a
          moveLeft = false;
          break;

        case 40: // down
        case 83: // s
          moveBackward = false;
          break;

        case 39: // right
        case 68: // d
          moveRight = false;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);

    raycaster = new THREE.Raycaster(
      new THREE.Vector3(),
      new THREE.Vector3(0, -1, 0),
      0,
      10
    );
  }

  // this function is not self contained also check the animate function
  // to understand how controls work
  initControls();

  // floor
  function initFloor() {
    var floorGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 100, 100);
    // 1 sets the flor vertically 2 makes it horizontal
    floorGeometry.rotateX(-Math.PI / 2);

    // vertex displacement

    var position = floorGeometry.attributes.position;

    for (var i = 0, l = position.count; i < l; i++) {
      vertex.fromBufferAttribute(position, i);

      vertex.x += Math.random() * 40 - 10;
      vertex.y += Math.random() * 2;
      vertex.z += Math.random() * 20 - 10;

      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

    position = floorGeometry.attributes.position;
    var colors = [];

    for (var i = 0, l = position.count; i < l; i++) {
      color.setHSL(
        Math.random() * 0.3 + 0.5,
        0.75,
        Math.random() * 0.25 + 0.75
      );
      colors.push(color.r, color.g, color.b);
    }

    floorGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    var floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);
  }
  initFloor();

  // objects
  function initObjects() {
    var boxGeometry = new THREE.BoxBufferGeometry(20, 20, 20);
    boxGeometry = boxGeometry.toNonIndexed(); // ensure each face has unique vertices

    const position = boxGeometry.attributes.position;
    const colors = [];

    for (var i = 0, l = position.count; i < l; i++) {
      color.setHSL(
        Math.random() * 0.3 + 0.5,
        0.75,
        Math.random() * 0.25 + 0.75
      );
      colors.push(color.r, color.g, color.b);
    }

    boxGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    for (var i = 0; i < 500; i++) {
      var boxMaterial = new THREE.MeshPhongMaterial({
        specular: 0xffffff,
        flatShading: true,
        vertexColors: true
      });
      boxMaterial.color.setHSL(
        Math.random() * 0.2 + 0.5,
        0.75,
        Math.random() * 0.25 + 0.75
      );

      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
      box.position.y = Math.floor(Math.random() * 20) * 20 + 10;
      box.position.z = Math.floor(Math.random() * 20 - 10) * 20;

      scene.add(box);
      objects.push(box);
    }
  }

  // insert webcam on mesh

  function initWebcamPermission() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      var constraints = {
        video: { width: 1280, height: 720, facingMode: "user" }
      };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
          // apply the stream to the video element used in the texture

          video.srcObject = stream;
          video.play();
        })
        .catch(function (error) {
          console.error("Unable to access the camera/webcam.", error);
        });
    } else {
      console.error("MediaDevices interface not available.");
    }
  }
  initWebcamPermission();

  // this creates a plane with a webcam texture on it
  function initPlane() {
    const video = document.getElementById("video");
    const texture = new THREE.VideoTexture(video);

    var geometry = new THREE.PlaneGeometry(1280, 720, 32);
    geometry.scale( 0.1, 0.1, 0.1 );

    var material = new THREE.MeshBasicMaterial({
      map: texture
    });
    var plane = new THREE.Mesh(geometry, material);
    // position webcam infron of camera
    plane.position.y = 50;
    plane.position.z = -150;
    plane.material.side = THREE.DoubleSide
    scene.add(plane);
  }
  initPlane();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked === true) {
    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    var intersections = raycaster.intersectObjects(objects);

    var onObject = intersections.length > 0;

    var time = performance.now();
    var delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta; // new behavior

    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;
    }

    prevTime = time;
  }

  renderer.render(scene, camera);
}
