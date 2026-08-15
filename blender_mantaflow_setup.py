"""
Helper script to add a Mantaflow liquid domain and an inflow to the existing scene.

This script creates a domain cube that surrounds the grinder and an inflow object
positioned above the grinder. Because Blender's Python API for fluid setups can vary
between versions, the script will create the objects and attempt to set common
settings; if it cannot configure Mantaflow automatically it prints manual steps.

Run inside Blender's Text Editor or headless with:
  blender --background --python blender_mantaflow_setup.py

After running: open the Physics tab, select the domain and set Type -> Fluid -> Domain
and Domain Type -> Liquid (Mantaflow). For the inflow set Type -> Flow -> Flow Type: Liquid
and Flow Behavior -> Inflow. Bake the data and mesh to see the fluid.
"""
import bpy
import math

def find_object(name):
    return bpy.data.objects.get(name)

def create_domain(size=4.0, location=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=size, location=location)
    domain = bpy.context.object
    domain.name = 'Mantaflow_Domain'
    domain.display_type = 'WIRE'
    return domain

def create_inflow(location=(0,0,2.5), size=(0.6,0.6,0.6)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    inflow = bpy.context.object
    inflow.name = 'Mantaflow_Inflow'
    inflow.scale = size
    return inflow

def try_configure(domain, inflow):
    warnings = []
    # Try to set Mantaflow properties using common API paths; wrap in try/except
    try:
        # Newer Blender versions expose fluid settings on object.modifiers or object.fluid
        if hasattr(domain, 'modifiers'):
            # create a quick domain by adding a fluid modifier if available
            try:
                mod = domain.modifiers.new(name='Fluid', type='FLUID')
                mod.fluid_type = 'DOMAIN'
                mod.domain_settings.domain_type = 'LIQUID'
            except Exception:
                pass
        # Try setting custom properties for clarity
        domain['is_mantaflow_domain'] = True
        inflow['is_mantaflow_inflow'] = True
    except Exception as e:
        warnings.append(str(e))
    return warnings

def main():
    # Place domain around origin, large enough to contain grinder
    domain = find_object('Mantaflow_Domain') or create_domain(size=6.0, location=(0,0,0.5))
    inflow = find_object('Mantaflow_Inflow') or create_inflow(location=(0,0,2.2))

    warnings = try_configure(domain, inflow)

    print('Created domain:', domain.name)
    print('Created inflow:', inflow.name)
    if warnings:
        print('Warnings while configuring Mantaflow settings:')
        for w in warnings:
            print('-', w)

    print('\nManual steps (if not applied automatically):')
    print('1) Select', domain.name, '→ Physics → Fluid → Type: Domain → Domain Type: Liquid')
    print('2) Select', inflow.name, '→ Physics → Fluid → Type: Flow → Flow Type: Liquid → Flow Behavior: Inflow')
    print('3) In Domain settings, set Resolution Divisions (e.g., 64), enable Adaptive Domain if desired.')
    print('4) Bake Data and Bake Mesh (in Domain Physics settings) to simulate the liquid.')
    print('\nAfter baking you can play the timeline to see the liquid interacting with the grinder.')

if __name__ == '__main__':
    main()
