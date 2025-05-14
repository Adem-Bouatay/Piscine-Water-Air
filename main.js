import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Water } from "three/examples/jsm/objects/Water";
import { Sky } from "three/examples/jsm/objects/Sky";

let scene, camera, renderer, controls;
let water, sun, sky;

let poolWidth = 10;
let poolLength = 20;
let poolDepth = 2;
let waterColor = 0x001e0f;
let waterOpacity = 0.8;
let waterLevel = 1.5;
let waterMovement = 1.0;

let socket;

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(0, 10, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.physicallyCorrectLights = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 0, 0);
  controls.minDistance = 5;
  controls.maxDistance = 100;
  controls.update();

  sun = new THREE.Vector3();

  sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const parameters = { elevation: 5, azimuth: 180 };
  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms["sunPosition"].value.copy(sun);
    if (water) {
      water.material.uniforms["sunDirection"].value.copy(sun).normalize();
    }
    scene.environment = pmremGenerator.fromScene(sky).texture;
  }

  updateSun();

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x88ccee,
    metalness: 0,
    roughness: 0,
    transmission: 1.0,
    thickness: 1.0,
    transparent: true,
    opacity: 1.0,
    ior: 1.5,
    reflectivity: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0,
    side: THREE.DoubleSide,
  });

  // Create each wall and the bottom separately (no top)
  const thickness = 0.1;

  // Bottom
  const bottom = new THREE.Mesh(
    new THREE.PlaneGeometry(poolWidth, poolLength),
    glassMaterial
  );
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = -poolDepth;
  scene.add(bottom);

  // Front wall
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(poolWidth, poolDepth),
    glassMaterial
  );
  front.rotation.y = Math.PI;
  front.position.z = poolLength / 2;
  front.position.y = -poolDepth / 2;
  scene.add(front);

  // Back wall
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(poolWidth, poolDepth),
    glassMaterial
  );
  back.position.z = -poolLength / 2;
  back.position.y = -poolDepth / 2;
  scene.add(back);

  // Left wall
  const left = new THREE.Mesh(
    new THREE.PlaneGeometry(poolLength, poolDepth),
    glassMaterial
  );
  left.rotation.y = Math.PI / 2;
  left.position.x = -poolWidth / 2;
  left.position.y = -poolDepth / 2;
  scene.add(left);

  // Right wall
  const right = new THREE.Mesh(
    new THREE.PlaneGeometry(poolLength, poolDepth),
    glassMaterial
  );
  right.rotation.y = -Math.PI / 2;
  right.position.x = poolWidth / 2;
  right.position.y = -poolDepth / 2;
  scene.add(right);

  // Water surface
  const waterGeometry = new THREE.PlaneGeometry(
    poolWidth - 0.2,
    poolLength - 0.2
  );
  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: waterColor,
    distortionScale: waterMovement,
    fog: scene.fog !== undefined,
  });

  water.material.transparent = true;
  water.material.uniforms.opacity = { value: waterOpacity };
  water.rotation.x = -Math.PI / 2;
  water.position.y = waterLevel - poolDepth;
  scene.add(water);

  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 10, 10);
  scene.add(directionalLight);

  setupWebSocket();
  window.addEventListener("resize", onWindowResize);
}

function setupWebSocket() {
  socket = new WebSocket("ws://localhost:1880/ws/pool");

  socket.addEventListener("open", function () {
    console.log("Connected to Node-RED server");
    socket.send(
      JSON.stringify({
        type: "init",
        waterLevel: waterLevel,
        waterColor: "#" + waterColor.toString(16).padStart(6, "0"),
        waterOpacity: waterOpacity,
        waterMovement: waterMovement,
      })
    );
  });

  socket.addEventListener("message", function (event) {
    const data = JSON.parse(event.data);
    console.log("Message from Node-RED:", data);

    if (data.waterLevel !== undefined) {
      waterLevel = parseFloat(data.waterLevel);
      water.position.y = waterLevel - poolDepth;
    }

    if (data.waterColor !== undefined) {
      waterColor = parseInt(data.waterColor.replace("#", "0x"));
      water.material.uniforms.waterColor.value.setHex(waterColor);
    }

    if (data.waterOpacity !== undefined) {
      waterOpacity = parseFloat(data.waterOpacity);
      water.material.uniforms.opacity.value = waterOpacity;
    }

    if (data.waterMovement !== undefined) {
      waterMovement = parseFloat(data.waterMovement);
      water.material.uniforms.distortionScale.value = waterMovement;
    }
  });

  socket.addEventListener("error", function (event) {
    console.error("WebSocket error:", event);
  });

  socket.addEventListener("close", function () {
    console.log("WebSocket connection closed, retrying...");
    setTimeout(setupWebSocket, 3000);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (water.material.uniforms["time"])
    water.material.uniforms["time"].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}

init();
animate();
