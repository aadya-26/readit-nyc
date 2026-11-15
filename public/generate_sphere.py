import math
import struct
import numpy as np
from pygltflib import (
    GLTF2,
    Scene,
    Node,
    Mesh,
    Primitive,
    Buffer,
    BufferView,
    Accessor,
    Asset,
)

LAT_SEGMENTS = 32
LON_SEGMENTS = 32
RADIUS = 1.0
OUTPUT_FILE = "sphere.glb"

positions = []
normals = []
indices = []

for lat in range(LAT_SEGMENTS + 1):
    theta = math.pi * lat / LAT_SEGMENTS
    sin_theta = math.sin(theta)
    cos_theta = math.cos(theta)

    for lon in range(LON_SEGMENTS + 1):
        phi = 2 * math.pi * lon / LON_SEGMENTS
        sin_phi = math.sin(phi)
        cos_phi = math.cos(phi)

        x = sin_theta * cos_phi
        y = cos_theta
        z = sin_theta * sin_phi

        positions.append([RADIUS * x, RADIUS * y, RADIUS * z])
        normals.append([x, y, z])

for lat in range(LAT_SEGMENTS):
    for lon in range(LON_SEGMENTS):
        first = lat * (LON_SEGMENTS + 1) + lon
        second = first + LON_SEGMENTS + 1

        indices.extend([first, second, first + 1])
        indices.extend([second, second + 1, first + 1])

positions_np = np.array(positions, dtype=np.float32)
normals_np = np.array(normals, dtype=np.float32)
indices_np = np.array(indices, dtype=np.uint32)

position_bytes = positions_np.tobytes()
normal_bytes = normals_np.tobytes()
index_bytes = indices_np.tobytes()

def pad4(data):
    padding = (4 - len(data) % 4) % 4
    return data + b"\x00" * padding

position_offset = 0
position_blob = pad4(position_bytes)

normal_offset = len(position_blob)
normal_blob = pad4(normal_bytes)

index_offset = normal_offset + len(normal_blob)
index_blob = pad4(index_bytes)

binary_blob = position_blob + normal_blob + index_blob

gltf = GLTF2(
    asset=Asset(version="2.0"),
    scenes=[Scene(nodes=[0])],
    scene=0,
    nodes=[Node(mesh=0)],
    meshes=[
        Mesh(
            primitives=[
                Primitive(
                    attributes={
                        "POSITION": 0,
                        "NORMAL": 1,
                    },
                    indices=2,
                    mode=4,
                )
            ]
        )
    ],
    buffers=[
        Buffer(byteLength=len(binary_blob))
    ],
    bufferViews=[
        BufferView(
            buffer=0,
            byteOffset=position_offset,
            byteLength=len(position_bytes),
            target=34962,
        ),
        BufferView(
            buffer=0,
            byteOffset=normal_offset,
            byteLength=len(normal_bytes),
            target=34962,
        ),
        BufferView(
            buffer=0,
            byteOffset=index_offset,
            byteLength=len(index_bytes),
            target=34963,
        ),
    ],
    accessors=[
        Accessor(
            bufferView=0,
            byteOffset=0,
            componentType=5126,
            count=len(positions),
            type="VEC3",
            min=positions_np.min(axis=0).tolist(),
            max=positions_np.max(axis=0).tolist(),
        ),
        Accessor(
            bufferView=1,
            byteOffset=0,
            componentType=5126,
            count=len(normals),
            type="VEC3",
        ),
        Accessor(
            bufferView=2,
            byteOffset=0,
            componentType=5125,
            count=len(indices),
            type="SCALAR",
        ),
    ],
)

gltf.set_binary_blob(binary_blob)
gltf.save_binary(OUTPUT_FILE)

print(f"Saved {OUTPUT_FILE}")
print(f"Vertices: {len(positions)}")
print(f"Triangles: {len(indices) // 3}")