"""
Blender setup script: creates a simple grinder (hub + blades), a particle "water" emitter,
and basic collision so droplets interact with the grinder.

How to run:
- In Blender: open Text Editor, create new text block, paste this file and click Run Script.
- From terminal (headless): `blender --background --python blender_setup.py`

Notes:
- The script uses a particle-system-based water approximation (instanced small spheres).
- If your Blender version exposes different APIs for collisions or fluid, you may need
  to toggle Collision in the Physics tab for `Hub`, `Blade_*`, and `Floor` objects.
"""
import bpy
import math

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

clear_scene()

# Create hub
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.5, depth=0.4, location=(0,0,0))
hub = bpy.context.object
hub.name = 'Hub'

# Create blades and parent to hub
blade_count = 6
blades = []
for i in range(blade_count):
    ang = i * 2 * math.pi / blade_count
    bx = math.cos(ang) * 1.2
    by = math.sin(ang) * 1.2
    bpy.ops.mesh.primitive_cube_add(size=1, location=(bx, by, 0))
    blade = bpy.context.object
    blade.name = f'Blade_{i}'
    blade.scale = (0.9, 0.14, 0.08)
    blade.location = (math.cos(ang) * 1.4, math.sin(ang) * 1.4, 0)
    blade.rotation_euler[2] = ang
    blade.parent = hub
    blades.append(blade)

# Create floor
bpy.ops.mesh.primitive_plane_add(size=12, location=(0,0,-1))
floor = bpy.context.object
floor.name = 'Floor'

# Create emitter (plane above the grinder)
bpy.ops.mesh.primitive_plane_add(size=1.6, location=(0,0,3.0))
emitter = bpy.context.object
emitter.name = 'Emitter'

# Create droplet object (instanced by the particle system)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(0,0,3.0))
droplet = bpy.context.object
droplet.name = 'Droplet'

# Simple material for droplets
mat = bpy.data.materials.new(name='DropletMat')
mat.diffuse_color = (0.08, 0.35, 0.75, 1.0)
if droplet.data.materials:
    droplet.data.materials[0] = mat
else:
    droplet.data.materials.append(mat)

# Add particle system to emitter
psys_mod = emitter.modifiers.new(name='ParticleSystem', type='PARTICLE_SYSTEM')
psys = emitter.particle_systems[0]
psettings = psys.settings
psettings.count = 1200
psettings.frame_start = 1
psettings.frame_end = 250
psettings.lifetime = 200
psettings.emit_from = 'VOLUME'
psettings.physics_type = 'NEWTON'
psettings.gravity = 9.81
psettings.render_type = 'OBJECT'
psettings.instance_object = droplet
psettings.particle_size = 0.06
psettings.use_rotations = True
psettings.rotation_mode = 'GLOB_X'
psettings.normal_factor = 0.2
psettings.factor_random = 0.4

# Attempt to add collision physics to hub, blades, and floor so particles deflect
for obj in [hub, floor] + blades:
    try:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.rigidbody.object_add()
        # Make rigid body passive (so it doesn't move under physics)
        obj.rigid_body.type = 'PASSIVE'
        obj.rigid_body.collision_shape = 'MESH'
    except Exception as e:
        print(f'Warning: could not add rigid body to {obj.name}: {e}')

# Add simple rotation driver to hub (continuous spin based on frame)
drv = hub.driver_add('rotation_euler', 2).driver
drv.expression = 'frame * 0.05'

print('Blender setup finished. Play the timeline to see the particles and rotating grinder.')
