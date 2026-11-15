// Import user 3D models: glTF/GLB, OBJ, STL, PLY, FBX.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const ACCEPT = '.glb,.gltf,.obj,.stl,.ply,.fbx,.bin,.png,.jpg,.jpeg,.webp';
const MAIN = ['glb', 'gltf', 'obj', 'stl', 'ply', 'fbx'];
const ext = (name) => name.split('.').pop().toLowerCase();

const defaultMaterial = () =>
  new THREE.MeshStandardMaterial({ color: '#c3cad6', roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide });

/**
 * @param files FileList / File[]; companion files (.bin, textures) may be included.
 * @returns Promise<{ object: THREE.Object3D, name: string, triangles: number }>
 */
export async function loadModelFiles(files) {
  const list = [...files];
  const main = list.find((f) => MAIN.includes(ext(f.name)));
  if (!main) throw new Error('Unsupported file. Use GLB, glTF, OBJ, STL, PLY or FBX.');

  // Resolve sibling files (glTF buffers, textures) from the dropped set.
  const urls = new Map(list.map((f) => [f.name.toLowerCase(), URL.createObjectURL(f)]));
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    const base = decodeURIComponent(url.split(/[\\/]/).pop().split('?')[0]).toLowerCase();
    return urls.get(base) ?? url;
  });
  const url = urls.get(main.name.toLowerCase());

  let object;
  try {
    switch (ext(main.name)) {
      case 'glb':
      case 'gltf':
        object = (await new GLTFLoader(manager).loadAsync(url)).scene;
        break;
      case 'obj':
        object = await new OBJLoader(manager).loadAsync(url);
        object.traverse((o) => o.isMesh && (o.material = defaultMaterial()));
        break;
      case 'stl': {
        const geo = await new STLLoader(manager).loadAsync(url);
        geo.computeVertexNormals();
        object = new THREE.Mesh(geo, defaultMaterial());
        break;
      }
      case 'ply': {
        const geo = await new PLYLoader(manager).loadAsync(url);
        geo.computeVertexNormals();
        const m = defaultMaterial();
        if (geo.attributes.color) {
          m.vertexColors = true;
          m.color.set('#ffffff');
        }
        object = new THREE.Mesh(geo, m);
        break;
      }
      case 'fbx':
        object = await new FBXLoader(manager).loadAsync(url);
        break;
    }
  } finally {
    for (const u of urls.values()) URL.revokeObjectURL(u);
  }

  let triangles = 0;
  let meshes = 0;
  object.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes.position) return;
    meshes++;
    o.castShadow = o.receiveShadow = true;
    triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
  });
  if (!meshes) throw new Error('No mesh geometry found in that file.');
  const wrap = new THREE.Group();
  wrap.add(object);
  return { object: wrap, name: main.name.replace(/\.[^.]+$/, ''), triangles: Math.round(triangles) };
}
