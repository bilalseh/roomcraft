import asyncio
import logging
from time import monotonic
from uuid import uuid4

from roomcraft_api.assistant.model import LayoutModel
from roomcraft_api.assistant.plans import Attempt, Plan, to_operation
from roomcraft_api.domain.catalog import Catalog
from roomcraft_api.domain.operations import Layout, apply_operations
from roomcraft_api.schemas.operations import (
    AssistRequest,
    Operation,
    RejectedOperation,
    Suggestion,
)

logger = logging.getLogger(__name__)

# Inside the web client's 90 second limit, so a second attempt cannot lose the first answer.
_ANSWER_WITHIN_SECONDS = 75.0


class LayoutAssistant:
    """Asks the model for plans and keeps only the operations that leave the room valid.
    Plans with refused operations go back to the model once, with what was refused."""

    def __init__(self, model: LayoutModel, catalog: Catalog) -> None:
        self._model = model
        self._catalog = catalog

    async def suggest(self, request: AssistRequest) -> list[Suggestion]:
        started = monotonic()
        response = await self._model.plan(request)
        layout = Layout(request.room, tuple(request.furniture), request.materials)
        plans = response.plans[: request.options]
        suggestions = [self._validate(plan, layout) for plan in plans]

        refused = [index for index, suggestion in enumerate(suggestions) if suggestion.rejected]
        if not refused:
            return suggestions
        earlier = [Attempt(plans[index], suggestions[index].rejected) for index in refused]
        try:
            async with asyncio.timeout(_ANSWER_WITHIN_SECONDS - (monotonic() - started)):
                revised = await self._model.plan(request, earlier)
        except Exception as error:  # The first answer is still worth showing, whatever happened.
            logger.warning("Keeping the first answer, the second attempt failed: %r", error)
            return suggestions
        for index, plan in zip(refused, revised.plans, strict=False):
            suggestions[index] = min(
                suggestions[index], self._validate(plan, layout), key=_shortfall
            )
        return suggestions

    def _validate(self, plan: Plan, layout: Layout) -> Suggestion:
        operations: list[Operation] = []
        rejected: list[RejectedOperation] = []
        for planned in plan.operations:
            operation = to_operation(planned, new_id=f"ai-{uuid4().hex[:10]}")
            if operation is None:
                rejected.append(
                    RejectedOperation(
                        op=planned.op, reason=planned.reason, code="invalid_operation"
                    )
                )
            else:
                operations.append(operation)

        result = apply_operations(layout, operations, self._catalog)
        for index, problem in result.rejected:
            operation = operations[index]
            rejected.append(
                RejectedOperation(
                    op=operation.op,
                    reason=operation.reason,
                    code=problem.code,
                    other_id=problem.other_id,
                    opening_id=problem.opening_id,
                )
            )
        return Suggestion(summary=plan.summary, operations=result.accepted, rejected=rejected)


def _shortfall(suggestion: Suggestion) -> tuple[bool, int, int]:
    """Lower is better: something to apply first, then the fewest refusals, then the most kept."""
    return (not suggestion.operations, len(suggestion.rejected), -len(suggestion.operations))
