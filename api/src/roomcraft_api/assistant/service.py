from uuid import uuid4

from roomcraft_api.assistant.model import LayoutModel
from roomcraft_api.assistant.plans import Plan, to_operation
from roomcraft_api.domain.catalog import Catalog
from roomcraft_api.domain.operations import Layout, apply_operations
from roomcraft_api.schemas.operations import (
    AssistRequest,
    Operation,
    RejectedOperation,
    Suggestion,
)


class LayoutAssistant:
    """Asks the model for plans and keeps only the operations that leave the room valid."""

    def __init__(self, model: LayoutModel, catalog: Catalog) -> None:
        self._model = model
        self._catalog = catalog

    async def suggest(self, request: AssistRequest) -> list[Suggestion]:
        response = await self._model.plan(request)
        layout = Layout(request.room, tuple(request.furniture), request.materials)
        return [self._validate(plan, layout) for plan in response.plans[: request.options]]

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
