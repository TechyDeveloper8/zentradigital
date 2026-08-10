import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AircraftScene3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene Setup — Clean Studio White Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF4F6FB);
    scene.fog = new THREE.FogExp2(0xF4F6FB, 0.035);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.2, 7.5);

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainSunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainSunLight.position.set(10, 20, 15);
    mainSunLight.castShadow = true;
    scene.add(mainSunLight);

    const blueFillLight = new THREE.DirectionalLight(0x0052FF, 1.2);
    blueFillLight.position.set(-10, -5, -10);
    scene.add(blueFillLight);

    const rimLight = new THREE.DirectionalLight(0x3B82F6, 1.0);
    rimLight.position.set(0, 10, -10);
    scene.add(rimLight);

    // Build Sleek Stealth Jet Mesh — Clean Corporate White Finish
    const jetGroup = new THREE.Group();

    // Fuselage (Main Body)
    const noseGeo = new THREE.ConeGeometry(0.55, 3.2, 5);
    noseGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.15,
      metalness: 0.25,
      flatShading: true,
    });
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    jetGroup.add(nose);

    // Main Mid Body
    const midGeo = new THREE.CylinderGeometry(0.55, 0.7, 3.8, 6);
    midGeo.rotateX(Math.PI / 2);
    const midBody = new THREE.Mesh(midGeo, bodyMat);
    midBody.position.z = -2.2;
    jetGroup.add(midBody);

    // Glass Cockpit (Sleek Dark Glass)
    const cockpitGeo = new THREE.CapsuleGeometry(0.32, 1.1, 4, 8);
    cockpitGeo.rotateX(Math.PI / 2);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0A0D14,
      roughness: 0.05,
      transmission: 0.4,
      transparent: true,
      opacity: 0.85,
      ior: 1.5,
      reflectivity: 0.9,
    });
    const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
    cockpit.position.set(0, 0.35, 0.5);
    jetGroup.add(cockpit);

    // Delta Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(4.5, -2.5);
    wingShape.lineTo(4.2, -3.2);
    wingShape.lineTo(0, -1.8);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeo.rotateX(Math.PI / 2);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.2,
      metalness: 0.4,
      flatShading: true,
    });

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.2, 0, 0.8);
    jetGroup.add(rightWing);

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.scale.set(-1, 1, 1);
    leftWing.position.set(-0.2, 0, 0.8);
    jetGroup.add(leftWing);

    // Tail Fins
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.lineTo(1.2, 1.6);
    tailShape.lineTo(0.5, 1.6);
    tailShape.lineTo(0, 0);
    tailShape.closePath();

    const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.05, bevelEnabled: false });

    const rightTail = new THREE.Mesh(tailGeo, wingMat);
    rightTail.position.set(0.4, 0.4, -3.5);
    rightTail.rotation.z = -Math.PI / 8;
    jetGroup.add(rightTail);

    const leftTail = new THREE.Mesh(tailGeo, wingMat);
    leftTail.position.set(-0.4, 0.4, -3.5);
    leftTail.rotation.z = Math.PI / 8;
    jetGroup.add(leftTail);

    // Engine Thrusters Glow
    const engineGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.8, 12);
    engineGeo.rotateX(Math.PI / 2);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });

    const rightEngine = new THREE.Mesh(engineGeo, engineMat);
    rightEngine.position.set(0.35, -0.1, -4.2);
    jetGroup.add(rightEngine);

    const leftEngine = new THREE.Mesh(engineGeo, engineMat);
    leftEngine.position.set(-0.35, -0.1, -4.2);
    jetGroup.add(leftEngine);

    const thrusterGlowGeo = new THREE.ConeGeometry(0.24, 1.5, 12);
    thrusterGlowGeo.rotateX(-Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x0052FF, transparent: true, opacity: 0.75 });

    const rightGlow = new THREE.Mesh(thrusterGlowGeo, glowMat);
    rightGlow.position.set(0.35, -0.1, -5.2);
    jetGroup.add(rightGlow);

    const leftGlow = new THREE.Mesh(thrusterGlowGeo, glowMat);
    leftGlow.position.set(-0.35, -0.1, -5.2);
    jetGroup.add(leftGlow);

    scene.add(jetGroup);

    // Speed Lines & Particle Streams
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 16;
      particlePos[i + 1] = (Math.random() - 0.5) * 12;
      particlePos[i + 2] = (Math.random() - 0.5) * 40;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x0052FF,
      size: 0.08,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Interactive Scroll & Mouse Rotation Logic
    let targetRotX = 0;
    let targetRotY = 0;
    let targetZ = 0;
    let targetPosY = 0;

    const handleMouseMove = (e) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotY = mouseX * 0.18;
      targetRotX = mouseY * 0.12;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight || 1;
      const progress = scrollY / maxScroll;

      targetZ = progress * 6;
      targetPosY = progress * -1.5;

      jetGroup.rotation.z = Math.sin(progress * Math.PI * 4) * 0.15;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    // Responsive Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle Hover Floating
      jetGroup.position.y += (targetPosY + Math.sin(elapsedTime * 1.8) * 0.08 - jetGroup.position.y) * 0.05;
      jetGroup.position.z += (targetZ - jetGroup.position.z) * 0.05;

      // Smooth Rotation Lerp
      jetGroup.rotation.x += (targetRotX - jetGroup.rotation.x) * 0.05;
      jetGroup.rotation.y += (targetRotY - jetGroup.rotation.y) * 0.05;

      // Move Particles for Speed Flight Effect
      const positions = particleGeo.attributes.position.array;
      for (let i = 2; i < particleCount * 3; i += 3) {
        positions[i] += 0.35;
        if (positions[i] > 20) {
          positions[i] = -20;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
