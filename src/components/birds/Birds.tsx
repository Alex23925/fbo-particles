import GPUComputationRenderer, {
    BufferGeometry,
    OrthographicCamera,
    Points,
    ShaderMaterial,
} from "three";
import { useRef, useMemo } from "react";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import simVert from "../../shaders/sim-shaders/simvert.glsl";
import simFrag from "../../shaders/sim-shaders/simfrag.glsl";
import rendVert from "../../shaders/vertex.glsl";
import rendFrag from "../../shaders/fragment.glsl";

interface BirdProps {}

//returns an array of random 3D coordinates
function getRandomData(width: number, height: number, size: number) {
    var len = width * height * 3;
    var data = new Float32Array(len);
    while (len--) data[len] = (Math.random() * 2 - 1) * size;
    return data;
}

const Birds = (props: BirdProps) => {
    const simGeoRef = useRef<BufferGeometry>();
    const pointsGeoRef = useRef<BufferGeometry>();

    const pointsRef = useRef<Points>();
    const renderShaderRef = useRef<ShaderMaterial>();

    const { gl, scene, camera } = useThree();

    //3 rtt setup
    const camRef = useRef<OrthographicCamera>();
    const OrthoCam = new THREE.OrthographicCamera(
        -1,
        1,
        1,
        -1,
        1 / Math.pow(2, 53),
        1
    );

    const width: number = 1024;
    const height: number = 1024;
    const size: number = 1024;
    const settings = {
        minFilter: THREE.NearestFilter, //important as we want to sample square pixels
        magFilter: THREE.NearestFilter, //
        format: THREE.RGBAFormat, //could be RGBAFormat
        type: THREE.FloatType, //important as we need precise coordinates (not ints)
    };
    const rtt = useFBO(width, height, settings);

    // make data for the position of the points
    let data = getRandomData(width, height, size);

    // Convert to a float texture
    let positions = useMemo(() => {
        return new THREE.DataTexture(
            data,
            width,
            height,
            THREE.RGBFormat,
            THREE.FloatType
        );
    }, [data]);
    positions.needsUpdate = true;

    //5 the simulation:
    //create a bi-unit quadrilateral and uses the simulation material to update the Float Texture
    // make array for attributes
    const positionArray = useMemo(() => {
        const posArray = new Float32Array([
            -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0,
        ]);
        return posArray;
    }, []);

    const uvArray = useMemo(() => {
        const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);
        return uvs;
    }, []);

    // inster float 32 arrays into BufferAttributes
    const positionAttribute = useMemo(() => {
        const posAttribute = new THREE.BufferAttribute(positionArray, 3);
        return posAttribute;
    }, [positionArray]);

    const uvAttribute = useMemo(() => {
        const uvsAttribute = new THREE.BufferAttribute(uvArray, 2);
        return uvsAttribute;
    }, [uvArray]);

    if (simGeoRef) {
        simGeoRef.current?.setAttribute("position", positionAttribute);
        simGeoRef.current?.setAttribute("uv", uvAttribute);
    }

    //6 the particles:
    //create a vertex buffer of size width * height with normalized coordinates
    const l = width * height;
    const vertices = useMemo(() => {
        const verts = new Float32Array(l * 3);
        return verts;
    }, [l]);

    for (let i = 0; i < l; i++) {
        let i3 = i * 3;
        vertices[i3] = (i % width) / width;
        vertices[i3 + 1] = i / width / height;
    }

    // add attribute to points geometry
    const pointsPosAttribute = useMemo(() => {
        const pointsPosAttribute = new THREE.BufferAttribute(vertices, 3);
        return pointsPosAttribute;
    }, [vertices]);

    if (pointsGeoRef) {
        pointsGeoRef.current?.setAttribute("position", pointsPosAttribute);
    }

    //7 Make uniforms
    const simUniforms = useMemo(() => {
        return {
            positions: { type: "t", value: positions },
        };
    }, [positions]);

    const rendUniforms = useMemo(() => {
        return {
            positions: { value: null },
            pointSize: { value: 2 },
        };
    }, []);

    // animation / custom render
    useFrame(() => {
        gl.setRenderTarget(rtt);

        if (camRef) {
            gl.render(scene, OrthoCam);
        }

        if (renderShaderRef) {
            renderShaderRef.current?.uniforms.positions.value = rtt;
        }

        gl.setRenderTarget(null);
        gl.render(scene, camera);
    });

    return (
        <>
            {/* Cam */}
            {<orthographicCamera
                left={-1}
                right={1}
                top={1}
                bottom={-1}
                near={1 / Math.pow(2, 53)}
                far={1}
                ref={camRef}
            />}

            {/* Simulation part  */}
            <mesh>
                <bufferGeometry ref={simGeoRef} />
                <shaderMaterial
                    vertexShader={simVert}
                    fragmentShader={simFrag}
                    uniforms={simUniforms}
                />
            </mesh>

            {/* Render Part  */}
            <points ref={pointsRef}>
                <bufferGeometry ref={pointsGeoRef} />
                <shaderMaterial
                    ref={renderShaderRef}
                    fragmentShader={rendFrag}
                    vertexShader={rendVert}
                    uniforms={rendUniforms}
                />
            </points>
        </>
    );
};

export default Birds;
