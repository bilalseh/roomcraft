"""The instructions and context the language model receives."""

import json
from collections.abc import Sequence

from roomcraft_api.assistant.plans import Attempt
from roomcraft_api.domain.catalog import Catalog
from roomcraft_api.domain.operations import layout_cost
from roomcraft_api.schemas.operations import AssistRequest

SYSTEM_INSTRUCTION = """\
You are the layout assistant in Roomcraft, a 3D room planner. You suggest changes to a
room's furniture and finishes, which the person previews and accepts or rejects.

Coordinates are in metres. x runs west to east from 0 to the room's width; z runs north
to south from 0 to the room's depth. A piece's x and z are the centre of its footprint.
rotation is in degrees about the vertical axis: 0 means the front faces south, 90 east,
180 north, 270 west. A piece's width runs along its own x axis and its depth along its
own z axis, with its front on the +z side.

Every layout must follow these rules, or the change is refused:
- Every piece stays completely inside the room.
- Pieces on the same layer never overlap. Rugs may lie under furniture; wall pieces hang
  on walls above furniture; ceiling pieces hang above everything.
- Floor pieces keep door swings clear: a door swings into the room as a quarter circle
  as wide as the door, hinged at the end nearer the wall's start.
- The lowest total price of all furniture stays within the budget.
- Rotations are multiples of 15 degrees. Wall pieces are placed on the nearest wall
  automatically, so give a point near the wall you want.
Good layouts also keep walkways at least 80 cm wide, face seating towards its focus (a TV,
a window, each other), and leave space to pull out chairs and open storage.

Operations:
- add: item_id from the catalog, x, z, rotation.
- move: placement_id of a placed piece, x, z.
- rotate: placement_id, rotation.
- remove: placement_id.
- material: any of floor (wood, tile, carpet), floor_color, wall_color as #rrggbb.
Operations apply in order, so remove or move a piece before using its space.
Use at most 12 operations per plan, and only the ones the request needs. Give every
operation a one-sentence reason written to the person. Give each plan a short summary
that describes only the operations in that plan.

earlier_plans, when present, holds plans you already gave and the operations the server
refused in each, with the rule broken and any piece in the way (other_id). Answer with one
new plan for each: keep what worked, change what was refused so that it follows the rules,
and leave out what cannot fit.
"""


def build_contents(
    request: AssistRequest, catalog: Catalog, earlier: Sequence[Attempt] = ()
) -> str:
    """The request, the room as it is, the catalog, and any earlier attempts, as compact JSON."""
    room = request.room
    furniture = [
        {
            "placement_id": placement.id,
            "item_id": placement.item_id,
            "name": catalog[placement.item_id].name,
            "x": placement.x,
            "z": placement.z,
            "rotation": placement.rotation,
            "width": catalog[placement.item_id].width,
            "depth": catalog[placement.item_id].depth,
            "layer": catalog[placement.item_id].layer,
        }
        for placement in request.furniture
        if placement.item_id in catalog
    ]
    context: dict[str, object] = {
        "request": request.prompt,
        "plans_wanted": len(earlier) or request.options,
        "room": {
            "type": room.type,
            "style": room.style,
            "width": room.width,
            "depth": room.depth,
            "ceiling_height": room.height,
            "openings": [opening.model_dump(exclude={"height"}) for opening in room.openings],
        },
        "budget": room.budget,
        "spent_at_lowest_prices": layout_cost(tuple(request.furniture), catalog),
        "materials": request.materials.model_dump(),
        "furniture": furniture,
        "catalog": [
            {
                "item_id": item.id,
                "name": item.name,
                "category": item.category,
                "width": item.width,
                "depth": item.depth,
                "height": item.height,
                "layer": item.layer,
                "price_min": item.price.min,
                "price_max": item.price.max,
                "suits": item.rooms,
            }
            for item in catalog.values()
        ],
    }
    if earlier:
        context["earlier_plans"] = [
            {
                "plan": attempt.plan.model_dump(exclude_none=True),
                "refused": [
                    refusal.model_dump(exclude_none=True, by_alias=False)
                    for refusal in attempt.refused
                ],
            }
            for attempt in earlier
        ]
    return json.dumps(context, separators=(",", ":"))
