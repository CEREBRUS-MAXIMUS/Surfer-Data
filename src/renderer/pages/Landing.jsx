import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentRoute } from '../state/actions';
import * as THREE from 'three';

const Landing = () => {
  const dispatch = useDispatch();
  const canvasRef = useRef(null);

  const handleNavigation = (route) => {
    console.log('Navigating to:', route);
    dispatch(setCurrentRoute(route));
  };

  // useEffect(() => {
  //   // Set up the scene, camera, and renderer
  //   const scene = new THREE.Scene();
  //   const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  //   const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
  //   renderer.setSize(window.innerWidth, window.innerHeight);

  //   // Create a sphere geometry
  //   const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
  //   const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });
  //   const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  //   scene.add(sphere);

  //   // Create particles
  //   const particlesGeometry = new THREE.BufferGeometry();
  //   const particleCount = 200;
  //   const positions = new Float32Array(particleCount * 3);
  //   const colors = new Float32Array(particleCount * 3);
  //   const velocities = [];

  //   for (let i = 0; i < particleCount; i++) {
  //     const theta = Math.random() * Math.PI * 2;
  //     const phi = Math.acos(Math.random() * 2 - 1);
  //     const radius = Math.random() * 4.5;

  //     positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  //     positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  //     positions[i * 3 + 2] = radius * Math.cos(phi);

  //     colors[i * 3] = Math.random();
  //     colors[i * 3 + 1] = Math.random();
  //     colors[i * 3 + 2] = Math.random();

  //     velocities.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.05));
  //   }

  //   particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  //   particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  //   const particlesMaterial = new THREE.PointsMaterial({
  //     size: 0.1,
  //     vertexColors: true,
  //     blending: THREE.AdditiveBlending,
  //     transparent: true
  //   });
  //   const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  //   scene.add(particles);

  //   // Create lines between particles
  //   // const linesMaterial = new THREE.LineBasicMaterial({
  //   //   color: 0x222222,
  //   //   opacity: 0.25,
  //   //   transparent: true,
  //   //   blending: THREE.AdditiveBlending
  //   // });
  //   // const linesGeometry = new THREE.BufferGeometry();
  //   // const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
  //   // scene.add(lines);

  //   // Set camera position
  //   camera.position.z = 10;

  //   // Create a clock for time-based animations
  //   const clock = new THREE.Clock();

  //   // Animation loop
  //   function animate() {
  //     requestAnimationFrame(animate);

  //     const time = clock.getElapsedTime();

  //     // Update particle positions
  //     const positions = particles.geometry.attributes.position.array;
  //     const colors = particles.geometry.attributes.color.array;
  //     const linePositions = [];

  //     for (let i = 0; i < particleCount; i++) {
  //       const i3 = i * 3;

  //       // Chaotic movement
  //       positions[i3] += velocities[i].x + Math.sin(time * 2 + i) * 0.02;
  //       positions[i3 + 1] += velocities[i].y + Math.cos(time * 2 + i) * 0.02;
  //       positions[i3 + 2] += velocities[i].z + Math.sin(time * 3 + i) * 0.02;

  //       // Keep particles inside the sphere
  //       const distance = Math.sqrt(positions[i3]**2 + positions[i3+1]**2 + positions[i3+2]**2);
  //       if (distance > 4.5) {
  //         const factor = 4.5 / distance;
  //         positions[i3] *= factor;
  //         positions[i3 + 1] *= factor;
  //         positions[i3 + 2] *= factor;

  //         // Bounce effect
  //         velocities[i].reflect(new THREE.Vector3(positions[i3], positions[i3+1], positions[i3+2]).normalize());
  //       }

  //       // Dynamic color change
  //       colors[i3] = Math.sin(time + i) * 0.5 + 0.5;
  //       colors[i3 + 1] = Math.cos(time * 1.3 + i) * 0.5 + 0.5;
  //       colors[i3 + 2] = Math.sin(time * 0.7 + i) * 0.5 + 0.5;

  //       // Create lines between nearby particles
  //       for (let j = i + 1; j < particleCount; j++) {
  //         const j3 = j * 3;
  //         const dx = positions[i3] - positions[j3];
  //         const dy = positions[i3 + 1] - positions[j3 + 1];
  //         const dz = positions[i3 + 2] - positions[j3 + 2];
  //         const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

  //         if (distance < 0.5) {
  //           linePositions.push(positions[i3], positions[i3 + 1], positions[i3 + 2]);
  //           linePositions.push(positions[j3], positions[j3 + 1], positions[j3 + 2]);
  //         }
  //       }
  //     }

  //     particles.geometry.attributes.position.needsUpdate = true;
  //     particles.geometry.attributes.color.needsUpdate = true;

  //     // linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  //     // linesGeometry.attributes.position.needsUpdate = true;

  //     // Rotate the entire scene
  //     scene.rotation.y += 0.001;
  //     scene.rotation.x = Math.sin(time * 0.5) * 0.1;

  //     // Pulsating effect
  //     const scale = 1 + Math.sin(time * 2) * 0.05;
  //     sphere.scale.set(scale, scale, scale);
  //     particles.scale.set(scale, scale, scale);

  //     renderer.render(scene, camera);
  //   }

  //   animate();

  //   // Handle window resizing
  //   const handleResize = () => {
  //     camera.aspect = window.innerWidth / window.innerHeight;
  //     camera.updateProjectionMatrix();
  //     renderer.setSize(window.innerWidth, window.innerHeight);
  //   };

  //   window.addEventListener('resize', handleResize);

  //   // Cleanup
  //   return () => {
  //     window.removeEventListener('resize', handleResize);
  //     // Additional cleanup
  //     scene.remove(sphere);
  //     scene.remove(particles);
  //     // scene.remove(lines);
  //     sphereGeometry.dispose();
  //     sphereMaterial.dispose();
  //     particlesGeometry.dispose();
  //     particlesMaterial.dispose();
  //     // linesGeometry.dispose();
  //     // linesMaterial.dispose();
  //     renderer.dispose();
  //   };
  // }, []);

  return (
    <div className="flex-grow flex overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="w-full h-screen flex flex-col items-center justify-center relative z-10">
        <h1 className="text-6xl font-bold">Surfer</h1>
        <button
          onClick={() => handleNavigation('/home')}
          className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 text-white"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default Landing;
